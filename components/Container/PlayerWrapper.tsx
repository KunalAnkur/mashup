"use client";
import type React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import SyncPlayer from "./SyncPlayer";
import StreamPlayer from "./StreamPlayer7";
import { Playlist } from "@/types/storeTypes";
import { useEffect, useState, useRef } from "react";

type PlayerWrapperProps = {
  fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const PlayerWrapper = ({ fullscreenTargetRef }: PlayerWrapperProps) => {
  const roomState = useSelector((state: RootState) => state.room);
  const [content, setContent] = useState<Playlist | null>(null);
  // const prevOnlyAudioRef = useRef<boolean | null>(null);
  const host = roomState.host;
  useEffect(() => {
    const content = roomState.playlist.find((item) => item.selected);
    console.log("content", content);
    setContent(content ?? null);
  }, [roomState.playlist]);

  const currentType = content?.type; // "stream" | "sync"
  // Generate key for StreamPlayer based on host status and onlyAudio transitions
  // const getStreamPlayerKey = (): string => {
  //   // For non-host: check onlyAudio transitions
  //   const currentOnlyAudio = content?.onlyAudio ?? false;
  //   const prevOnlyAudio = prevOnlyAudioRef.current;

  //   // If transitioning from onlyAudio: true -> onlyAudio: true, return content ID
  //   if (prevOnlyAudio === true && currentOnlyAudio === true && content?.id) {
  //     return content.id;
  //   }

  //   if (prevOnlyAudio === false && currentOnlyAudio === true && content?.id) {
  //     return content.id;
  //   }

  //   if (prevOnlyAudio === true && currentOnlyAudio === false && content?.id) {
  //     return content.id;
  //   }
  //   // Otherwise, return currentType
  //   return currentType || "stream";
  // };

  // Update previous onlyAudio ref after rendering
  // useEffect(() => {
  //   if (content?.onlyAudio !== undefined) {
  //     prevOnlyAudioRef.current = content.onlyAudio;
  //   }
  // }, [content?.onlyAudio]);
 // TODO: Need to fix this later. related to replace producer tracks from audio to audio and screen to file.
  if (!content) return null;
  if (currentType === "stream") {
    return (
      <StreamPlayer
        key={currentType}
        fullscreenTargetRef={fullscreenTargetRef}
      />
    );
  }

  // Default to SyncPlayer when type is "sync" or undefined
  return (
    <SyncPlayer
      key={content.id}
      fullscreenTargetRef={fullscreenTargetRef}
    />
  );
};

export default PlayerWrapper;