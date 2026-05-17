"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { LuSparkles, LuVideo } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import { useCallStream } from "@/context/CallStreamContext";
import CallTile from "./CallTile";

/**
 * Free-tier preview — shown when the room host is not Premium.
 * Renders the same tile grid everyone else sees, but every tile is dimmed
 * and the controls are inert. A compact CTA below hints at the feature
 * and (for the host) routes to /subscription.
 */
export default function CallUpsellTeaser() {
  const router = useRouter();
  const { participants } = useRoomContext();
  const { socket } = useSocket();
  const { isHost } = useCallStream();
  const auth = useSelector((state: RootState) => state.auth);

  const mySocketId = socket?.id;
  const localUsername = auth.user?.username ?? auth.user?.name ?? "You";

  const tiles = [
    { key: "local", username: localUsername, isLocal: true },
    ...participants
      .filter((p) => p.socketId !== mySocketId)
      .map((p) => ({ key: p.socketId, username: p.username, isLocal: false })),
  ];

  const gridCols =
    tiles.length === 1 ? "grid-cols-1" :
    tiles.length <= 4 ? "grid-cols-2" :
    "grid-cols-3";

  const handleUpgrade = () => router.push("/subscription");

  return (
    <div className="flex flex-col">
      {/* Inert preview tiles — emphasises "this is what you're missing" */}
      <div className={`grid ${gridCols} gap-1.5 px-2 pt-2 pb-1.5 pointer-events-none`}>
        {tiles.map((t) => (
          <CallTile
            key={t.key}
            stream={null}
            username={t.username}
            isLocal={t.isLocal}
            isInCall={false}
            size="sm"
          />
        ))}
      </div>

      {/* Compact upgrade CTA */}
      <div className="mx-2 mb-2 rounded-xl bg-gradient-to-r from-amber-500/[0.08] via-amber-400/[0.06] to-transparent
                      ring-1 ring-amber-400/15 px-3 py-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <LuVideo size={13} className="text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white/85 leading-tight truncate">
            Video &amp; audio calls
          </p>
          <p className="text-[10px] text-white/45 leading-tight mt-0.5 truncate">
            {isHost
              ? "Upgrade your plan to enable calls for the room"
              : "Host needs Premium to enable calls"}
          </p>
        </div>
        {isHost && (
          <button
            onClick={handleUpgrade}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold
                       text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 ring-1 ring-amber-400/20 transition-colors"
          >
            <LuSparkles size={10} />
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
