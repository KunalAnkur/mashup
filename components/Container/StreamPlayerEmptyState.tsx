"use client";

import { RoomType } from "@/context/RoomContext";
import getPlayerMessage from "@/utils/playerState";

type StreamPlayerEmptyStateProps = {
    isHost: boolean;
    roomType: RoomType | null;
    hostLeft: boolean;
    remoteStream: MediaStream | null;
    isInitialized: boolean;
};

const StreamPlayerEmptyState = ({
    isHost,
    roomType,
    hostLeft,
    remoteStream,
    isInitialized,
}: StreamPlayerEmptyStateProps) => {
    const message = isHost 
        ? "🎬 Loading video..." 
        : getPlayerMessage(isHost, roomType || "sync", hostLeft, remoteStream);
    
    const subtitle = isHost 
        ? "Preparing to stream" 
        : `Connecting... ${isInitialized ? '(Ready)' : ''}`;

    return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),transparent_50%)] animate-pulse" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.05)_25%,rgba(139,92,246,0.05)_50%,transparent_50%,transparent_75%,rgba(139,92,246,0.05)_75%,rgba(139,92,246,0.05))] bg-[length:20px_20px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-md">
                {/* Icon/Emoji with animation */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="text-6xl md:text-7xl animate-bounce">
                            {isHost ? "🎬" : hostLeft ? "👋" : "⏳"}
                        </div>
                        {/* Pulsing ring effect */}
                        <div className="absolute inset-0 -m-4 rounded-full border-2 border-fuchsia-500/30 animate-ping" />
                        <div className="absolute inset-0 -m-6 rounded-full border border-fuchsia-500/20 animate-pulse" />
                    </div>
                </div>

                {/* Main message */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 animate-pulse">
                    {message || "Waiting for stream..."}
                </h2>

                {/* Subtitle */}
                <p className="text-sm md:text-base text-gray-400 mb-6">
                    {subtitle}
                </p>

                {/* Loading indicator */}
                <div className="flex justify-center items-center gap-2">
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" />
                </div>

                {/* Status badge */}
                {isInitialized && !isHost && (
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Ready to receive stream</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamPlayerEmptyState;

