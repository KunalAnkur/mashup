"use client";

import { createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";

interface VideoSelectionContextType {
    selectedIndex: number;
    selectVideo: (index: number) => void;
    isHost: boolean;
}

const VideoSelectionContext = createContext<VideoSelectionContextType>({
    selectedIndex: 0,
    selectVideo: () => {},
    isHost: false,
});

interface VideoSelectionProviderProps {
    children: ReactNode;
}

/**
 * VideoSelectionProvider
 * 
 * Provides video selection functionality that works with both:
 * - Sync mode (URL-based video sync)
 * - Stream mode (file-based MediaSoup streaming)
 * 
 * Handles:
 * - Host video selection and broadcasting
 * - Non-host video selection sync from host
 * 
 * Uses unified socket (single namespace)
 */
export const VideoSelectionProvider = ({ children }: VideoSelectionProviderProps) => {
    const dispatch = useDispatch();
    const { socket } = useSocket(); // Unified socket
    const roomState = useSelector((state: RootState) => state.room);
    
    const isHost = roomState.host;
    const selectedIndex = roomState.selectedFileIndex;

    // Select video and broadcast to other users (only works for host)
    const selectVideo = useCallback((index: number) => {
        if (!isHost) return;
        
        // Update local state
        dispatch(setSelectedFileIndex(index));
        
        // Broadcast to other users
        if (socket && roomState.roomId) {
            socket.emit(SocketEvent.SELECT_VIDEO, {
                roomId: roomState.roomId,
                selectedIndex: index,
            });
        }
    }, [isHost, socket, roomState.roomId, dispatch]);

    // Listen for video selection from host (for non-hosts)
    useEffect(() => {
        if (!socket || isHost) return;

        const handleVideoSelected = ({ selectedIndex }: { selectedIndex: number }) => {
            dispatch(setSelectedFileIndex(selectedIndex));
        };

        socket.on(SocketEvent.VIDEO_SELECTED, handleVideoSelected);

        return () => {
            socket.off(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
        };
    }, [socket, isHost, dispatch]);

    return (
        <VideoSelectionContext.Provider value={{ selectedIndex, selectVideo, isHost }}>
            {children}
        </VideoSelectionContext.Provider>
    );
};

export const useVideoSelection = () => useContext(VideoSelectionContext);

