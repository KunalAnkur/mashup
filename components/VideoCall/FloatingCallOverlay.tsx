"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCallStream } from "@/context/CallStreamContext";
import { useTranslations } from "@/i18n/I18nProvider";
import CallTiles from "./CallTiles";
import { zincGlassBlurredSurfaceClass } from "@/components/UI/classTokens";
import { LuColumns3, LuGripVertical, LuMaximize2, LuMinimize2, LuRows3 } from "react-icons/lu";

const MIN_W = 172;
const MIN_H = 104;
const MAX_W = 900;
const MAX_H = 700;
const DEFAULT_W = 320;
const DEFAULT_H = 152;
const HEADER_H = 22;
const BODY_PAD = 4;

type ResizeDir =
  | "n" | "s" | "e" | "w"
  | "ne" | "nw" | "se" | "sw"
  | null;

/**
 * Draggable, resizable floating call overlay.
 * Tiles can flow as a horizontal strip or vertical stack.
 */
export default function FloatingCallOverlay() {
  const { isInCall, remoteParticipants } = useCallStream();
  const t = useTranslations("room.call");
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );

  const visible = (isInCall || remoteParticipants.size > 0) && panelCollapsed;

  // ─── position + size state ────────────────────────────────────────────────
  const [rect, setRect] = useState({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H });
  const rectRef = useRef(rect); // always-current ref for pointer handlers
  rectRef.current = rect;

  const posInitialised = useRef(false);
  useEffect(() => {
    if (visible && !posInitialised.current && typeof window !== "undefined") {
      setRect({
        x: Math.max(12, window.innerWidth - DEFAULT_W - 16),
        y: Math.max(80, window.innerHeight - DEFAULT_H - 40),
        w: DEFAULT_W,
        h: DEFAULT_H,
      });
      posInitialised.current = true;
    }
  }, [visible]);

  // ─── minimised state ──────────────────────────────────────────────────────
  const [minimised, setMinimised] = useState(false);
  const [layout, setLayout] = useState<"row" | "column">("row");

  // ─── drag ─────────────────────────────────────────────────────────────────
  const dragRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const onDragDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - rectRef.current.x,
      y: e.clientY - rectRef.current.y,
    };
  }, []);

  const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setRect((r) => ({
      ...r,
      x: Math.max(0, Math.min(window.innerWidth - r.w, e.clientX - dragOffsetRef.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffsetRef.current.y)),
    }));
  }, []);

  const onDragUp = useCallback(() => { dragRef.current = false; }, []);

  // ─── resize ───────────────────────────────────────────────────────────────
  const resizeDirRef = useRef<ResizeDir>(null);
  const resizeStartRef = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

  const onResizeDown = useCallback(
    (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeDirRef.current = dir;
      const r = rectRef.current;
      resizeStartRef.current = { mx: e.clientX, my: e.clientY, x: r.x, y: r.y, w: r.w, h: r.h };
    },
    []
  );

  const onResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const dir = resizeDirRef.current;
    if (!dir) return;
    const { mx, my, x, y, w, h } = resizeStartRef.current;
    const dx = e.clientX - mx;
    const dy = e.clientY - my;

    setRect((r) => {
      let nx = r.x, ny = r.y, nw = r.w, nh = r.h;

      if (dir.includes("e")) nw = Math.min(MAX_W, Math.max(MIN_W, w + dx));
      if (dir.includes("s")) nh = Math.min(MAX_H, Math.max(MIN_H, h + dy));
      if (dir.includes("w")) {
        const clamped = Math.min(MAX_W, Math.max(MIN_W, w - dx));
        nx = x + (w - clamped);
        nw = clamped;
      }
      if (dir.includes("n")) {
        const clamped = Math.min(MAX_H, Math.max(MIN_H, h - dy));
        ny = y + (h - clamped);
        nh = clamped;
      }

      return { x: nx, y: ny, w: nw, h: nh };
    });
  }, []);

  const onResizeUp = useCallback(() => { resizeDirRef.current = null; }, []);

  // Combined pointer move/up that handles both drag and resize
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onDragMove(e);
      onResizeMove(e);
    },
    [onDragMove, onResizeMove]
  );

  const onPointerUp = useCallback(() => {
    onDragUp();
    onResizeUp();
  }, [onDragUp, onResizeUp]);

  if (!visible) return null;

  const cursorMap: Record<NonNullable<ResizeDir>, string> = {
    n: "ns-resize", s: "ns-resize",
    e: "ew-resize", w: "ew-resize",
    ne: "nesw-resize", sw: "nesw-resize",
    nw: "nwse-resize", se: "nwse-resize",
  };

  const handle = (dir: ResizeDir, extraStyle: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        cursor: cursorMap[dir!],
        ...extraStyle,
      }}
      onPointerDown={onResizeDown(dir)}
    />
  );

  return (
    <div
      style={{ left: rect.x, top: rect.y, width: rect.w, height: minimised ? undefined : rect.h }}
      className={`
        fixed z-40 overflow-hidden rounded-2xl
        border border-white/[0.08] shadow-xl
        ${zincGlassBlurredSurfaceClass}
        select-none
      `}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* ── Edge resize handles ─────────────────────────────────────────── */}
      {/* Top */}
      {handle("n", { top: 0, left: 8, right: 8, height: 6 })}
      {/* Bottom */}
      {handle("s", { bottom: 0, left: 8, right: 8, height: 6 })}
      {/* Left */}
      {handle("w", { left: 0, top: 8, bottom: 8, width: 6 })}
      {/* Right */}
      {handle("e", { right: 0, top: 8, bottom: 8, width: 6 })}
      {/* Corners */}
      {handle("nw", { top: 0, left: 0, width: 12, height: 12 })}
      {handle("ne", { top: 0, right: 0, width: 12, height: 12 })}
      {handle("sw", { bottom: 0, left: 0, width: 12, height: 12 })}
      {handle("se", { bottom: 0, right: 0, width: 12, height: 12 })}

      {/* ── Drag handle / header ────────────────────────────────────────── */}
      <div
        className="flex h-[22px] touch-none items-center justify-between px-1.5"
        style={{ cursor: "grab" }}
        onPointerDown={onDragDown}
      >
        <div className="flex w-11 items-center gap-0.5">
          <button
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              layout === "row"
                ? "bg-white/12 text-white/85"
                : "text-white/40 hover:text-white/80"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setLayout("row")}
            aria-label={t("layoutHorizontal")}
            title={t("layoutHorizontal")}
          >
            <LuRows3 size={11} />
          </button>
          <button
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              layout === "column"
                ? "bg-white/12 text-white/85"
                : "text-white/40 hover:text-white/80"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setLayout("column")}
            aria-label={t("layoutVertical")}
            title={t("layoutVertical")}
          >
            <LuColumns3 size={11} />
          </button>
        </div>
        <LuGripVertical size={12} className="text-white/24" />
        {/* Minimise / restore button */}
        <button
          className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setMinimised((v) => !v)}
          aria-label={t(minimised ? "expand" : "minimise")}
        >
          {minimised
            ? <LuMaximize2 size={11} />
            : <LuMinimize2 size={11} />}
        </button>
      </div>

      {/* ── Tile area ───────────────────────────────────────────────────── */}
      {!minimised && (
        <div
          className="p-1 pt-0"
          style={{
            height: rect.h - HEADER_H - BODY_PAD,
          } as React.CSSProperties}
        >
          <CallTiles compact layout={layout} fillContainer />
        </div>
      )}
    </div>
  );
}
