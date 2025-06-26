"use client";

import SocketService from "@/utils/socketService";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { Socket } from "socket.io-client";

interface SocketContextType {
    socketService: SocketService;
    isConnected: boolean;
    getSocket: (namespace?: string) => Socket;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socketService] = useState(() => new SocketService({  }));
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize the main socket connection
        const mainSocket = socketService.getSocket();

        // Setup connection status listeners for main socket
        const onConnect = () => {
            console.log('socket connection started ...') 
            setIsConnected(true)
        };
        const onDisconnect = () => setIsConnected(false);

        mainSocket.on("connect", onConnect);
        mainSocket.on("disconnect", onDisconnect);

        // Set initial connection status
        setIsConnected(mainSocket.connected);

        // Cleanup
        return () => {
            mainSocket.off("connect", onConnect);
            mainSocket.off("disconnect", onDisconnect);
            socketService.disconnect();
        };
    }, [socketService]);

    const getSocket = (namespace?: string) => {
        if (!namespace || namespace === "/") {
            return socketService.getSocket();
        }
        return socketService.getNamespaceSocket(namespace);
    };

    return (
        <SocketContext.Provider value={{ socketService, isConnected, getSocket }}>
            {children}
        </SocketContext.Provider>
    );
};

// Updated useSocket hook with optional namespace parameter
export const useSocket = (namespace?: string) => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }

    const [socket, setSocket] = useState<Socket | null>(null);
    const [namespaceConnected, setNamespaceConnected] = useState(false);

    useEffect(() => {
        // Get the appropriate socket based on namespace
        const socketInstance = context.getSocket(namespace);
        setSocket(socketInstance);

        // Setup namespace-specific connection listeners
        const onConnect = () => setNamespaceConnected(true);
        const onDisconnect = () => setNamespaceConnected(false);

        socketInstance.on("connect", onConnect);
        socketInstance.on("disconnect", onDisconnect);

        // Set initial connection status
        setNamespaceConnected(socketInstance.connected);

        // Cleanup
        return () => {
            socketInstance.off("connect", onConnect);
            socketInstance.off("disconnect", onDisconnect);
        };
    }, [namespace, context]);

    return {
        socket,
        isConnected: namespace ? namespaceConnected : context.isConnected,
        socketService: context.socketService,
    };
};