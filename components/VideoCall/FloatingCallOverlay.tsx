"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCallStream } from "@/context/CallStreamContext";
import CallTiles from "./CallTiles";
import { zincGlassBlurredSurfaceClass } from "@/components/UI/classTokens";
import { LuGripVertical } from "react-icons/lu";

/**
 * Draggable floating call overlay.
 * Rendered only when panelCollapsed=true AND isInCall=true.
 */
export default function FloatingCallOverlay() {
  const { isInCall } = useCallStream();
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );

  const visible = isInCall && panelCollapsed;

  // ─── drag state ──────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Initialise position to bottom-right on first render
  const posInitialised = useRef(false);
  useEffect(() => {
    if (visible && !posInitialised.current && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - 340, y: window.innerHeight - 360 });
      posInitialised.current = true;
    }
  }, [visible]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const next = {
      x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - offsetRef.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - offsetRef.current.y)),
    };
    setPos(next);
  }, []);

  const onPointerUp = useCallback(() => { draggingRef.current = false; }, []);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{ left: pos.x, top: pos.y }}
      className={`
        fixed z-40 w-[300px] rounded-2xl overflow-hidden
        border border-white/10 shadow-2xl
        ${zincGlassBlurredSurfaceClass}
        select-none
      `}
    >
      {/* drag handle */}
      <div
        className="flex items-center justify-center py-1 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <LuGripVertical size={14} className="text-white/30" />
      </div>

      <CallTiles compact />
    </div>
  );
}
