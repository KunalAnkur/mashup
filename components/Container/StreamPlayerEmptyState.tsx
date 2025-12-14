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
        ? "Loading video..." 
        : getPlayerMessage(isHost, roomType || "sync", hostLeft, remoteStream);
    
    const subtitle = isHost 
        ? "Preparing to stream" 
        : `Connecting... ${isInitialized ? '(Ready)' : ''}`;

    return (
        <div className="relative w-full h-full bg-[#18181b] flex items-center justify-center overflow-hidden">
            {/* Background Effects - Matching sync/stream pages */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e11d48]/20 rounded-full blur-[128px] animate-pulse-glow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c026d3]/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Floating Emojis - Behind All Components */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                <span className="absolute top-1/4 left-[8%] text-4xl animate-float opacity-50">🎬</span>
                <span className="absolute top-1/3 right-[12%] text-3xl animate-float-delayed opacity-40">🍿</span>
                <span className="absolute bottom-1/3 left-[15%] text-5xl animate-float opacity-30">😍</span>
                <span className="absolute top-1/2 right-[8%] text-4xl animate-float-delayed opacity-40">🎉</span>
                <span className="absolute bottom-1/4 right-[20%] text-3xl animate-float opacity-50">❤️</span>
                <span className="absolute top-2/3 left-[12%] text-3xl animate-float-delayed opacity-40">⭐</span>
                <span className="absolute bottom-1/2 right-[15%] text-4xl animate-float opacity-40">🎊</span>
                <span className="absolute top-[15%] left-[25%] text-3xl animate-float-delayed opacity-35">🎞️</span>
                <span className="absolute bottom-[20%] left-[30%] text-4xl animate-float opacity-45">🎭</span>
            </div>

            {/* Content - Above Background */}
            <div className="relative z-20 text-center px-6 max-w-md">
                {/* Icon/Emoji with animation */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="text-6xl md:text-7xl animate-bounce">
                            {isHost ? "🎬" : hostLeft ? "👋" : "⏳"}
                        </div>
                        {/* Pulsing ring effect - Updated colors */}
                        <div className="absolute inset-0 -m-4 rounded-full border-2 border-purple-500/30 animate-ping" />
                        <div className="absolute inset-0 -m-6 rounded-full border border-pink-500/20 animate-pulse" />
                    </div>
                </div>

                {/* Main message */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {message || "Waiting for stream..."}
                </h2>

                {/* Subtitle */}
                <p className="text-sm md:text-base text-white/60 mb-6">
                    {subtitle}
                </p>

                {/* Loading indicator - Updated colors */}
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" />
                </div>

                {/* Host status badge - Show for host */}
                {isHost && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-purple-500/30 rounded-full">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        <span className="text-xs text-purple-300 font-medium">Preparing your stream</span>
                    </div>
                )}

                {/* Status badge - Updated styling for non-host */}
                {isInitialized && !isHost && (
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-full">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-300 font-medium">Ready to receive stream</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamPlayerEmptyState;

