"use client";

import SocketService from "@/utils/socketService";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
} from "react";
import { Socket } from "socket.io-client";
import { SocketEvent } from "@/types/socketEvents";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface SocketContextType {
    socketService: SocketService;
    isConnected: boolean;
    /**
     * Disconnected, but recovery is still in progress. Room UI should hold its state and wait
     * rather than treating the user as having left.
     */
    isReconnecting: boolean;
    /** The server announced a deploy/restart before dropping us. The outage is expected and short. */
    serverRestarting: boolean;
    /** Recovery has genuinely given up. Only now is a teardown appropriate. */
    connectionFailed: boolean;
    getSocket: () => Socket | null; // Unified socket - no namespace needed
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

/**
 * Manual retry schedule used when Socket.IO refuses to retry on its own — see the
 * `connect_error` handler below.
 */
const MANUAL_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];
const MANUAL_RETRY_MAX_DELAY_MS = 15000;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socketService] = useState(() => new SocketService({}));
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [serverRestarting, setServerRestarting] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const authToken = useSelector((state: RootState) => state.auth.token);

    const tToast = useTranslations("toast");
    // Kept in a ref rather than in the effect's dependencies. This effect owns the socket's
    // entire lifecycle and tears it down on cleanup, so any dependency that changes identity
    // mid-outage would kill a socket that was in the middle of reconnecting. Translations must
    // never cost us the connection.
    const tToastRef = useRef(tToast);
    tToastRef.current = tToast;

    // True once we have told the user about the current outage, so a long recovery does not
    // stack one toast per retry.
    const outageNotifiedRef = useRef(false);
    // Also mirrored in a ref because the `disconnect` handler reads it synchronously, before
    // React has re-rendered with the new state value.
    const serverRestartingRef = useRef(false);

    useEffect(() => {
        if (!authToken) {
            socketService.disconnect();
            setIsConnected(false);
            setIsReconnecting(false);
            setServerRestarting(false);
            setConnectionFailed(false);
            return;
        }

        socketService.setAuthToken(authToken);
        const mainSocket = socketService.getSocket();
        if (!mainSocket) {
            setIsConnected(false);
            return;
        }

        const t = (key: string) => tToastRef.current(key);

        let manualRetryTimer: ReturnType<typeof setTimeout> | null = null;
        let manualRetryCount = 0;
        let disposed = false;

        const clearManualRetry = () => {
            if (manualRetryTimer) {
                clearTimeout(manualRetryTimer);
                manualRetryTimer = null;
            }
        };

        /**
         * Socket.IO only auto-retries transport failures. When the server's auth middleware
         * rejects a handshake it marks the socket inactive and stops for good — which is
         * exactly what happens while guardian is still starting up during a deploy. Left
         * alone, those clients stay dead until the user reloads the page, so we drive the
         * retry ourselves.
         */
        const scheduleManualRetry = () => {
            if (disposed || manualRetryTimer) return;

            const delay =
                MANUAL_RETRY_DELAYS_MS[manualRetryCount] ?? MANUAL_RETRY_MAX_DELAY_MS;
            manualRetryCount += 1;

            console.log(`[SOCKET] Handshake rejected; retrying in ${delay}ms`);
            manualRetryTimer = setTimeout(() => {
                manualRetryTimer = null;
                if (disposed || mainSocket.connected) return;
                mainSocket.connect();
            }, delay);
        };

        const onConnect = () => {
            console.log("[SOCKET] Connected");
            clearManualRetry();
            manualRetryCount = 0;

            const recoveredFromOutage = outageNotifiedRef.current;
            outageNotifiedRef.current = false;
            serverRestartingRef.current = false;

            setIsConnected(true);
            setIsReconnecting(false);
            setServerRestarting(false);
            setConnectionFailed(false);

            if (recoveredFromOutage) {
                showSuccess(t("reconnected"));
            }
        };

        const onDisconnect = (reason: string) => {
            console.log("[SOCKET] Disconnected:", reason);
            setIsConnected(false);

            // We asked for this (logout, unmount, token change) — nothing to recover.
            if (reason === "io client disconnect") {
                setIsReconnecting(false);
                return;
            }

            setIsReconnecting(true);
            setConnectionFailed(false);

            // `io server disconnect` means the server closed us deliberately and the client
            // will not retry by itself.
            if (reason === "io server disconnect") {
                scheduleManualRetry();
            }

            if (!outageNotifiedRef.current) {
                outageNotifiedRef.current = true;
                if (serverRestartingRef.current) {
                    showInfo(t("serverUpdating"));
                } else {
                    showError(t("connectionLost"), t("tryingToReconnect"));
                }
            }
        };

        const onConnectError = (error: Error) => {
            console.error("[SOCKET] Connection error:", error.message);
            setIsReconnecting(true);

            // `active` is false when the server rejected the handshake outright, which stops
            // the built-in reconnection. Guardian being unreachable reports itself distinctly
            // so we can keep trying instead of treating it as a bad token.
            const rejectedByServer = !mainSocket.active;
            const authUnavailable = error.message === "Authentication service unavailable";

            if (rejectedByServer) {
                if (authUnavailable || manualRetryCount < MANUAL_RETRY_DELAYS_MS.length) {
                    scheduleManualRetry();
                } else {
                    clearManualRetry();
                    setIsReconnecting(false);
                    setConnectionFailed(true);
                }
            }

            if (!outageNotifiedRef.current) {
                outageNotifiedRef.current = true;
                if (serverRestartingRef.current || authUnavailable) {
                    showInfo(t("serverUpdating"));
                } else {
                    showError(t("failedToConnect"), t("checkInternetConnection"));
                }
            }
        };

        // Built-in reconnection exhausted every attempt.
        const onReconnectFailed = () => {
            console.error("[SOCKET] Reconnection failed");
            setIsReconnecting(false);
            setConnectionFailed(true);
            showError(t("failedToConnect"), t("checkInternetConnection"));
        };

        // Deploy warning — arrives while still connected, just before the server exits.
        const onServerRestarting = (data: { reason?: string }) => {
            console.log("[SOCKET] Server restarting:", data?.reason);
            serverRestartingRef.current = true;
            setServerRestarting(true);
        };

        // Heartbeat handler - respond to server pings
        const handlePing = () => {
            mainSocket.emit("pong");
        };

        mainSocket.on("connect", onConnect);
        mainSocket.on("disconnect", onDisconnect);
        mainSocket.on("connect_error", onConnectError);
        mainSocket.on("ping", handlePing);
        mainSocket.on(SocketEvent.SERVER_RESTARTING, onServerRestarting);
        mainSocket.io.on("reconnect_failed", onReconnectFailed);

        // Set initial connection status
        setIsConnected(mainSocket.connected);

        // Cleanup
        return () => {
            disposed = true;
            clearManualRetry();
            mainSocket.off("connect", onConnect);
            mainSocket.off("disconnect", onDisconnect);
            mainSocket.off("connect_error", onConnectError);
            mainSocket.off("ping", handlePing);
            mainSocket.off(SocketEvent.SERVER_RESTARTING, onServerRestarting);
            mainSocket.io.off("reconnect_failed", onReconnectFailed);
            socketService.disconnect();
        };
    }, [socketService, authToken]);

    const getSocket = () => {
        // Always return the main socket (unified namespace)
        return socketService.getSocket();
    };

    return (
        <SocketContext.Provider
            value={{
                socketService,
                isConnected,
                isReconnecting,
                serverRestarting,
                connectionFailed,
                getSocket,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

// Unified useSocket hook - no namespace parameter needed
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }

    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Get the unified socket
        const socketInstance = context.getSocket();
        setSocket(socketInstance || null);
    }, [context]);

    return {
        socket,
        isConnected: context.isConnected,
        isReconnecting: context.isReconnecting,
        serverRestarting: context.serverRestarting,
        connectionFailed: context.connectionFailed,
        socketService: context.socketService,
    };
};
