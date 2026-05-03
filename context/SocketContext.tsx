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
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface SocketContextType {
    socketService: SocketService;
    isConnected: boolean;
    getSocket: () => Socket | null; // Unified socket - no namespace needed
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socketService] = useState(() => new SocketService({}));
    const [isConnected, setIsConnected] = useState(false);
    const errorShownRef = useRef(false); // Prevent showing multiple error toasts
    const tToast = useTranslations("toast");
    const authToken = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (!authToken) {
            socketService.disconnect();
            setIsConnected(false);
            return;
        }

        socketService.setAuthToken(authToken);
        const mainSocket = socketService.getSocket();
        if (!mainSocket) {
            setIsConnected(false);
            return;
        }

        // Setup connection status listeners
        const onConnect = () => {
            console.log('[SOCKET] Connection started...');
            setIsConnected(true);
            errorShownRef.current = false; // Reset error flag on successful connection
        };
        
        const onDisconnect = (reason: string) => {
            console.log('[SOCKET] Connection disconnected', reason);
            setIsConnected(false);
            
            // Show error toast for unexpected disconnections (not user-initiated)
            if (reason !== 'io client disconnect' && !errorShownRef.current) {
                errorShownRef.current = true;
                showError(tToast("connectionLost"), tToast("tryingToReconnect"));
            }
        };

        const onConnectError = (error: Error) => {
            console.error('[SOCKET] Connection error:', error);
            if (!errorShownRef.current) {
                errorShownRef.current = true;
                showError(tToast("failedToConnect"), tToast("checkInternetConnection"));
            }
        };

        // Heartbeat handler - respond to server pings
        const handlePing = () => {
            mainSocket.emit('pong');
        };

        mainSocket.on("connect", onConnect);
        mainSocket.on("disconnect", onDisconnect);
        mainSocket.on("connect_error", onConnectError);
        mainSocket.on("ping", handlePing);

        // Set initial connection status
        setIsConnected(mainSocket.connected);

        // Cleanup
        return () => {
            mainSocket.off("connect", onConnect);
            mainSocket.off("disconnect", onDisconnect);
            mainSocket.off("connect_error", onConnectError);
            mainSocket.off("ping", handlePing);
            socketService.disconnect();
        };
    }, [socketService, tToast, authToken]);

    const getSocket = () => {
        // Always return the main socket (unified namespace)
        return socketService.getSocket();
    };

    return (
        <SocketContext.Provider value={{ socketService, isConnected, getSocket }}>
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
        socketService: context.socketService,
    };
};
