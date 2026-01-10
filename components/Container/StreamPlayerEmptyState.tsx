"use client";

import Link from "next/link";
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

    // Special layout when host has left and user is not the host
    if (hostLeft && !isHost) {
        return (
            <div className="relative w-full h-full bg-[#18181b] flex items-center justify-center overflow-hidden">
                {/* Background Effects - Matching sync/stream pages */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#e11d48]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#c026d3]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
                </div>

                {/* Floating Emojis - Hidden on small screens */}
                <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-10">
                    <span className="absolute top-1/4 left-[8%] text-2xl md:text-4xl animate-float opacity-50">🎬</span>
                    <span className="absolute top-1/3 right-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">🍿</span>
                    <span className="absolute bottom-1/3 left-[15%] text-3xl md:text-5xl animate-float opacity-30">😍</span>
                    <span className="absolute top-1/2 right-[8%] text-2xl md:text-4xl animate-float-delayed opacity-40">🎉</span>
                    <span className="absolute bottom-1/4 right-[20%] text-xl md:text-3xl animate-float opacity-50">❤️</span>
                    <span className="absolute top-2/3 left-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">⭐</span>
                    <span className="absolute bottom-1/2 right-[15%] text-2xl md:text-4xl animate-float opacity-40">🎊</span>
                    <span className="absolute top-[15%] left-[25%] text-xl md:text-3xl animate-float-delayed opacity-35">🎞️</span>
                    <span className="absolute bottom-[20%] left-[30%] text-2xl md:text-4xl animate-float opacity-45">🎭</span>
                </div>

                {/* Content - Above Background */}
                <div className="relative z-20 text-center px-4 sm:px-6 max-w-lg">
                    {/* Icon/Emoji with animation - Hand waving */}
                    <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
                        <div className="relative">
                            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-bounce">
                                👋
                            </div>
                            {/* Pulsing ring effect - Updated colors */}
                            <div className="absolute inset-0 -m-3 sm:-m-4 rounded-full border-2 border-purple-500/30 animate-ping" />
                            <div className="absolute inset-0 -m-4 sm:-m-6 rounded-full border border-pink-500/20 animate-pulse" />
                        </div>
                    </div>

                    {/* Fun message - Emphasized and above host left message */}
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                        <span className="text-white/90">That was </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400">
                            fun
                        </span>
                        <span className="text-white/90"> 🎉</span>
                    </p>

                    {/* Main message - Host left */}
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white/80 mb-4 sm:mb-5 md:mb-6">
                        {message || "Host has left the room."}
                    </h2>

                    {/* Question */}
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 mb-5 sm:mb-6 md:mb-8 font-medium">
                        Want to watch something else with friends?
                    </p>

                    {/* Create another room button */}
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        <span>Create another room</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    // Default layout for other states
    return (
        <div className="relative w-full h-full bg-[#18181b] flex items-center justify-center overflow-hidden">
            {/* Background Effects - Matching sync/stream pages */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#e11d48]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#c026d3]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Floating Emojis - Hidden on small screens */}
            <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-10">
                <span className="absolute top-1/4 left-[8%] text-2xl md:text-4xl animate-float opacity-50">🎬</span>
                <span className="absolute top-1/3 right-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">🍿</span>
                <span className="absolute bottom-1/3 left-[15%] text-3xl md:text-5xl animate-float opacity-30">😍</span>
                <span className="absolute top-1/2 right-[8%] text-2xl md:text-4xl animate-float-delayed opacity-40">🎉</span>
                <span className="absolute bottom-1/4 right-[20%] text-xl md:text-3xl animate-float opacity-50">❤️</span>
                <span className="absolute top-2/3 left-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">⭐</span>
                <span className="absolute bottom-1/2 right-[15%] text-2xl md:text-4xl animate-float opacity-40">🎊</span>
                <span className="absolute top-[15%] left-[25%] text-xl md:text-3xl animate-float-delayed opacity-35">🎞️</span>
                <span className="absolute bottom-[20%] left-[30%] text-2xl md:text-4xl animate-float opacity-45">🎭</span>
            </div>

            {/* Content - Above Background */}
            <div className="relative z-20 text-center px-4 sm:px-6 max-w-md">
                {/* Icon/Emoji with animation */}
                <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
                    <div className="relative">
                        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-bounce">
                            {isHost ? "🎬" : "⏳"}
                        </div>
                        {/* Pulsing ring effect - Updated colors */}
                        <div className="absolute inset-0 -m-3 sm:-m-4 rounded-full border-2 border-purple-500/30 animate-ping" />
                        <div className="absolute inset-0 -m-4 sm:-m-6 rounded-full border border-pink-500/20 animate-pulse" />
                    </div>
                </div>

                {/* Main message */}
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
                    {message || "Waiting for stream..."}
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-white/60 mb-4 sm:mb-5 md:mb-6">
                    {subtitle}
                </p>

                {/* Loading indicator - Updated colors */}
                <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-fuchsia-500 rounded-full animate-bounce" />
                </div>

                {/* Host status badge - Show for host */}
                {isHost && (
                    <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-purple-500/30 rounded-full">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse" />
                        <span className="text-[10px] sm:text-xs text-purple-300 font-medium">Preparing your stream</span>
                    </div>
                )}

                {/* Status badge - Updated styling for non-host */}
                {isInitialized && !isHost && (
                    <div className="mt-4 sm:mt-5 md:mt-6 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-full">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] sm:text-xs text-emerald-300 font-medium">Ready to receive stream</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamPlayerEmptyState;

