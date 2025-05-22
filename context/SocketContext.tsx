"use client";

import { socketService } from "@/utils";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    getNamespaceSocket: (namespace: string) => Socket;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log('socket context', socket)

        // Initialize the socket connection
        const socketInstance = socketService.getSocket();
        setSocket(socketInstance);

        // Setup connection status listeners
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socketInstance.on("connect", onConnect);
        socketInstance.on("disconnect", onDisconnect);

        // Set initial connection status
        setIsConnected(socketInstance.connected);

        // Cleanup
        return () => {
            socketInstance.off("connect", onConnect);
            socketInstance.off("disconnect", onDisconnect);
            socketService.disconnect();
        };
    }, []);

    const getNamespaceSocket = (namespace: string) => {
        return socketService.getNamespaceSocket(namespace);
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, getNamespaceSocket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
