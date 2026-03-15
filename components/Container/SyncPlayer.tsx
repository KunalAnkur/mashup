"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import type ReactPlayer from "react-player";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import { useSync } from "@/hooks";
import { useRoomContext } from "@/context/RoomContext";
import { helper } from "@/utils";
import type { Playlist } from "@/types/storeTypes";

type Props = {
  fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const SyncPlayer = ({ fullscreenTargetRef }: Props) => {
  const roomState = useSelector((state: RootState) => state.room);
  const activeContent = useSelector((state: RootState) => state.room.playlist.find((item) => item.selected)) as Playlist;
  const playerRef = useRef<ReactPlayer>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [hasVideoTrack, setHasVideoTrack] = useState<boolean | undefined>(true);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isJoined, roomType, isHost, hostLeft, captureWatchTime } = useRoomContext();

  const currentUrl = activeContent?.link ?? "";

  const initialPlayerState = helper.getInitialPlayerState({
    url: currentUrl,
    roomType: roomType || "sync",
    host: isHost,
    focused: roomState.focused,
    screenSharing: false,
    hostLeft: hostLeft ?? false,
    paused: false,
  });

  const {
    onPlay,
    onPause,
    onSeeked,
    onReady: originalOnReady,
    isPlaying,
  } = useSync({
    playerRef,
    isHost,
    roomId: roomState.roomId,
    initialPlaying: initialPlayerState.playing,
    enabled: isJoined && roomType === "sync",
  });

  const handleReady = useCallback(() => {
    originalOnReady();

    if (typeof videoUrl === "string" && helper.needsVideoCheck(videoUrl) && playerRef.current) {
      const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
      if (video) {
        const hasVideo = video.videoWidth > 0 && video.videoHeight > 0;

        if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

        if (hasVideo) {
          setHasVideoTrack(true);
        }
        // else {
        //   delayTimerRef.current = setTimeout(() => setHasVideoTrack(false), 100);
        // }
      }
    } else if (typeof videoUrl === "string" && helper.isVideoPlatform(videoUrl)) {
      setHasVideoTrack(true);
    }
  }, [originalOnReady, videoUrl]);

  useEffect(() => {
    const url = currentUrl;

    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    setHasVideoTrack(true);

    if (url) {
      setVideoUrl(url);
      if (typeof url === "string" && helper.isVideoPlatform(url)) {
        setHasVideoTrack(true);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };
  }, [currentUrl]);

  const initialStateForRender = helper.getInitialPlayerState({
    url: videoUrl,
    roomType: roomType || "sync",
    host: isHost,
    focused: roomState.focused,
    screenSharing: false,
    hostLeft: hostLeft ?? false,
    paused: false,
  });

  const controlsConfig = helper.getPlayerControlsConfig(videoUrl, isHost, hostLeft ?? false);

  return (
    <Player
      playerRef={playerRef}
      playing={isPlaying}
      onPlay={onPlay}
      onProgress={captureWatchTime}
      onPause={onPause}
      onSeekEnd={(seekTime) => onSeeked(seekTime)}
      onReady={handleReady}
      hasVideoTrack={hasVideoTrack}
      fullscreenTargetRef={fullscreenTargetRef}
      url={videoUrl}
      muted={initialStateForRender.muted}
      disableControls={controlsConfig.disableControls}
      hideControls={controlsConfig.hideControls}
      disableSeekPauseResume={helper.shouldDisableSeekPauseResume(videoUrl)}
      autoResumeOnFullscreenExit={!isHost}
    >
      <PlayerOverlay />
    </Player>
  );
};

export default SyncPlayer;
