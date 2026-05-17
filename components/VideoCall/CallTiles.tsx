"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCallStream } from "@/context/CallStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import CallTile from "./CallTile";

interface CallTilesProps {
  compact?: boolean;
}

/**
 * Tile grid — one tile per room member.
 * Each tile carries its own controls / state indicator overlaid on the video.
 * Only the local user's tile has interactive controls; remote tiles just
 * surface mic / camera status.
 */
export default function CallTiles({ compact = false }: CallTilesProps) {
  const {
    isInCall, isJoining, isMicOn, isCameraOn,
    localStream, remoteParticipants,
    toggleMic, toggleCamera, joinCall,
  } = useCallStream();

  const { participants } = useRoomContext();
  const { socket } = useSocket();
  const auth = useSelector((state: RootState) => state.auth);

  const mySocketId = socket?.id;
  const localUsername = auth.user?.username ?? auth.user?.name ?? "You";

  const localTile = {
    key: "local",
    stream: localStream,
    username: localUsername,
    isLocal: true,
    // appears "in call" the moment we have a stream — so the user sees themselves
    // immediately while the SFU handshake is still completing
    isInCall: isInCall || !!localStream,
    isMuted: !isMicOn,
    isCameraOff: !isCameraOn,
  };

  const remoteTiles = participants
    .filter((p) => p.socketId !== mySocketId)
    .map((p) => {
      const callState = remoteParticipants.get(p.socketId);
      return {
        key: p.socketId,
        stream: callState?.stream ?? null,
        username: p.username,
        isLocal: false,
        isInCall: !!callState,
        isMuted: callState ? !callState.isMicOn : false,
        isCameraOff: callState ? !callState.isCameraOn : false,
      };
    });

  const allTiles = [localTile, ...remoteTiles];

  const gridCols =
    allTiles.length === 1 ? "grid-cols-1" :
    allTiles.length <= 4 ? "grid-cols-2" :
    "grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-1.5 px-2 py-2`}>
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
          // only the local tile receives interactive callbacks
          isJoining={tile.isLocal ? isJoining : false}
          onJoin={tile.isLocal ? joinCall : undefined}
          onToggleMic={tile.isLocal ? toggleMic : undefined}
          onToggleCamera={tile.isLocal ? toggleCamera : undefined}
        />
      ))}
    </div>
  );
}
