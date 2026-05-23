"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCallStream } from "@/context/CallStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import CallTile from "./CallTile";
import { LuMic, LuMicOff, LuPhoneOff, LuVideo, LuVideoOff } from "react-icons/lu";

interface CallTilesProps {
  compact?: boolean;
  showControls?: boolean;
}


/**
 * Live call surface. It can render receive-only remote feeds before the local
 * user publishes, then adds the local preview once the user starts sharing.
 */
export default function CallTiles({ compact = false, showControls = true }: CallTilesProps) {
  const {
    isInCall, isJoining, isMicOn, isCameraOn,
    localStream, remoteParticipants,
    toggleMic, toggleCamera, leaveCall,
  } = useCallStream();

  const { participants } = useRoomContext();
  const { socket } = useSocket();
  const auth = useSelector((state: RootState) => state.auth);

  const mySocketId = socket?.id;
  const localUsername = auth.user?.username ?? auth.user?.name ?? "You";
  const participantNames = new Map(
    participants.map((participant) => [participant.socketId, participant.username])
  );

  const localTile = isInCall || localStream ? {
    key: "local",
    stream: localStream,
    username: localUsername,
    isLocal: true,
    // appears "in call" the moment we have a stream — so the user sees themselves
    // immediately while the SFU handshake is still completing
    isInCall: isInCall || !!localStream,
    isMuted: !isMicOn,
    isCameraOff: !isCameraOn,
  } : null;

  const remoteTiles = Array.from(remoteParticipants.values())
    .filter((callState) => callState.socketId !== mySocketId)
    .map((callState) => {
      const username = participantNames.get(callState.socketId) ?? callState.username;
      return {
        key: callState.socketId,
        stream: callState?.stream ?? null,
        username,
        isLocal: false,
        isInCall: true,
        isMuted: callState ? !callState.isMicOn : false,
        isCameraOff: callState ? !callState.isCameraOn : false,
      };
    });

  const allTiles = [...(localTile ? [localTile] : []), ...remoteTiles];

  if (allTiles.length === 0) {
    return null;
  }

  const gridCols =
    allTiles.length === 1 ? "grid-cols-1" :
    allTiles.length <= 4 ? "grid-cols-2" :
    "grid-cols-3";
  const btnBase =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60";
  const activeBtn = "bg-white/[0.12] text-white hover:bg-white/[0.18]";
  const offBtn = "bg-red-500 text-white hover:bg-red-400";

  return (
    <div className="rounded-2xl bg-white/[0.035] p-2 ring-1 ring-white/[0.08]">
      <div className={`grid ${gridCols} gap-1.5`}>
        {allTiles.map((tile) => (
          <CallTile
            key={tile.key}
            stream={tile.stream}
            username={tile.username}
            isLocal={tile.isLocal}
            isInCall={tile.isInCall}
            isMuted={tile.isMuted}
            isCameraOff={tile.isCameraOff}
            size={compact ? "sm" : "md"}
          />
        ))}
      </div>

      {showControls && localTile && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            disabled={isJoining}
            className={`${btnBase} ${isMicOn ? activeBtn : offBtn}`}
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicOn ? <LuMic size={14} /> : <LuMicOff size={14} />}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            disabled={isJoining}
            className={`${btnBase} ${isCameraOn ? activeBtn : offBtn}`}
            aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
            title={isCameraOn ? "Turn camera off" : "Turn camera on"}
          >
            {isCameraOn ? <LuVideo size={14} /> : <LuVideoOff size={14} />}
          </button>
          <button
            type="button"
            onClick={leaveCall}
            className={`${btnBase} bg-red-500/95 text-white hover:bg-red-400`}
            aria-label="Stop sharing"
            title="Stop sharing"
          >
            <LuPhoneOff size={14} />
          </button>
        </div>
      )}
    </div>
  );

}
