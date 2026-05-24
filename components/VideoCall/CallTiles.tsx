"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCallStream } from "@/context/CallStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import CallTile from "./CallTile";
import { LuMic, LuMicOff, LuVideo, LuVideoOff } from "react-icons/lu";

interface CallTilesProps {
  compact?: boolean;
  showControls?: boolean;
  layout?: "column" | "row";
  fillContainer?: boolean;
}


/**
 * Live call surface. It can render receive-only remote feeds before the local
 * user publishes, then adds the local preview once the user starts sharing.
 */
export default function CallTiles({
  compact = false,
  showControls = true,
  layout = "column",
  fillContainer = false,
}: CallTilesProps) {
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
  const participantBySocketId = new Map(
    participants.map((participant) => [participant.socketId, participant])
  );

  const getAvatarUrl = (username: string, profile?: string) => {
    if (profile) return profile;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=random&color=fff&size=200`;
  };

  const localTile = isInCall || localStream ? {
    key: "local",
    stream: localStream,
    username: localUsername,
    avatarUrl: getAvatarUrl(localUsername, auth.user?.profile),
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
      const participant = participantBySocketId.get(callState.socketId);
      const username = participant?.username ?? callState.username;
      return {
        key: callState.socketId,
        stream: callState?.stream ?? null,
        username,
        avatarUrl: getAvatarUrl(username, participant?.profile ?? callState.profile),
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

  const btnBase =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60";
  const activeBtn = "bg-white/[0.12] text-white hover:bg-white/[0.18]";
  const offBtn = "bg-red-500 text-white hover:bg-red-400";
  const handleToggleMic = () => {
    if (isMicOn && !isCameraOn) {
      leaveCall();
      return;
    }

    toggleMic();
  };
  const handleToggleCamera = () => {
    if (isCameraOn && !isMicOn) {
      leaveCall();
      return;
    }

    toggleCamera();
  };

  const isRowLayout = layout === "row";
  const rootClass = fillContainer ? "flex h-full min-h-0 flex-col gap-1" : "space-y-2";
  const listClass = isRowLayout
    ? "flex min-h-0 flex-1 flex-row gap-1 overflow-x-auto overflow-y-hidden"
    : fillContainer
      ? "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5"
      : "flex flex-col gap-1.5";
  const tileShellClass = isRowLayout
    ? "h-full min-w-[112px] flex-[1_0_132px]"
    : "w-full";

  return (
    <div className={rootClass}>
      <div className={listClass}>
        {allTiles.map((tile) => (
          <div key={tile.key} className={tileShellClass}>
            <CallTile
              stream={tile.stream}
              username={tile.username}
              isLocal={tile.isLocal}
              isInCall={tile.isInCall}
              isMuted={tile.isMuted}
              isCameraOff={tile.isCameraOff}
              avatarUrl={tile.avatarUrl}
              size={compact ? "sm" : "md"}
              fill={isRowLayout}
            />
          </div>
        ))}
      </div>

      {showControls && localTile && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isJoining}
            className={`${btnBase} ${isMicOn ? activeBtn : offBtn}`}
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicOn ? <LuMic size={14} /> : <LuMicOff size={14} />}
          </button>
          <button
            type="button"
            onClick={handleToggleCamera}
            disabled={isJoining}
            className={`${btnBase} ${isCameraOn ? activeBtn : offBtn}`}
            aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
            title={isCameraOn ? "Turn camera off" : "Turn camera on"}
          >
            {isCameraOn ? <LuVideo size={14} /> : <LuVideoOff size={14} />}
          </button>
        </div>
      )}
    </div>
  );

}
