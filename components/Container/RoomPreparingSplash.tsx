"use client";

import Image from "next/image";
import * as constants from "@/constants";

const RoomPreparingSplash = () => {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-transparent">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(244,63,94,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_70%_25%,rgba(168,85,247,0.07),transparent)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: `${[3, 2, 4, 2, 3, 2][i]}px`,
            height: `${[3, 2, 4, 2, 3, 2][i]}px`,
            background: ["#f43f5e", "#a855f7", "#fb923c", "#f43f5e", "#c084fc", "#fb923c"][i],
            left: `${[20, 75, 55, 35, 80, 15][i]}%`,
            top: `${[30, 20, 70, 60, 55, 45][i]}%`,
            opacity: 0.4,
            animation: `float-particle ${[4, 5.5, 4.5, 6, 5, 4.8][i]}s ease-in-out infinite`,
            animationDelay: `${[0, 1.2, 0.6, 2, 1.8, 0.3][i]}s`,
          }}
        />
      ))}

      <div className="relative flex w-[min(92vw,28rem)] flex-col items-center px-8 py-12 text-center">

        {/* Logo with orbital ring */}
        <div className="relative mb-8 flex items-center justify-center" style={{ width: 96, height: 96 }}>
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />

          {/* Spinning orbital ring */}
          <svg
            className="absolute inset-0"
            width="96"
            height="96"
            viewBox="0 0 96 96"
            style={{ animation: "spin-ring 2.4s linear infinite" }}
          >
            <circle
              cx="48" cy="48" r="44"
              fill="none"
              stroke="url(#orbital-grad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="55 221"
              strokeDashoffset="0"
            />
            <defs>
              <linearGradient id="orbital-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
                <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
                <stop offset="80%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Counter-spin ring */}
          <svg
            className="absolute inset-0"
            width="96"
            height="96"
            viewBox="0 0 96 96"
            style={{ animation: "spin-ring-reverse 3.8s linear infinite" }}
          >
            <circle
              cx="48" cy="48" r="36"
              fill="none"
              stroke="url(#orbital-grad-2)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="20 206"
            />
            <defs>
              <linearGradient id="orbital-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Logo container */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0d0e18] ring-1 ring-white/10">
            <Image
              src={constants.assets.logo192}
              alt="Movmash logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>

          {/* Orbiting dot */}
          <div
            className="absolute"
            style={{
              width: "100%",
              height: "100%",
              animation: "spin-ring 2.4s linear infinite",
            }}
          >
            <div
              className="absolute rounded-full bg-rose-400"
              style={{
                width: 6,
                height: 6,
                top: "2px",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px 2px rgba(244,63,94,0.8)",
              }}
            />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-[1.6rem] font-semibold tracking-tight text-white [font-family:var(--parkinsans)]">
          Preparing your room
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Getting everything ready for your watch party
        </p>

        {/* Loading bar — segmented heartbeat style */}
        <div className="mt-8 w-full space-y-2">
          <div className="flex gap-[3px]">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: 3,
                  background: "rgba(255,255,255,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    background: "linear-gradient(90deg, #f43f5e, #a855f7, #fb923c)",
                    animation: `segment-fill 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.08}s`,
                    opacity: 0,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Status label */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] tracking-widest uppercase text-white/25">Initializing</span>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-rose-500" style={{ animation: "pulse 1s ease-in-out infinite" }} />
              <span className="text-[10px] tracking-widest uppercase text-white/25">Live</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-ring-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-12px) translateX(4px); opacity: 0.6; }
          66% { transform: translateY(-6px) translateX(-6px); opacity: 0.4; }
        }
        @keyframes segment-fill {
          0%, 100% { opacity: 0; transform: scaleX(0); transform-origin: left; }
          30% { opacity: 1; transform: scaleX(1); }
          70% { opacity: 1; transform: scaleX(1); }
          90% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RoomPreparingSplash;
