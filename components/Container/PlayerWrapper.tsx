"use client";
import type React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import SyncPlayer from "./SyncPlayer";
import StreamPlayer from "./StreamPlayer";
import P2PStreamPlayer from "./P2PStreamPlayer";
import { Playlist } from "@/types/storeTypes";
import { useEffect, useState } from "react";
import StreamPlayerEmptyState from "./StreamPlayerEmptyState";
import { RoomType, useRoomContext } from "@/context/RoomContext";
import { setFocused } from "@/lib/store/slices/roomSlice";
import { SubscriptionTier } from "@/types/subscriptionTypes";

type PlayerWrapperProps = {
  fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const PlayerWrapper = ({ fullscreenTargetRef }: PlayerWrapperProps) => {
  const roomState = useSelector((state: RootState) => state.room);
  const dispatch = useDispatch();
  const { streamDeliveryMode } = useRoomContext();
  const [content, setContent] = useState<Playlist | null>(null);
  const [lastKnownType, setLastKnownType] = useState<RoomType>("stream");
  const subscriptionState = useSelector(
    (state: RootState) => state.subscription,
  );
  // const prevOnlyAudioRef = useRef<boolean | null>(null);
  const host = roomState.host;
  useEffect(() => {
    const content = roomState.playlist.find((item) => item.selected);
    console.log("content", content);
    setContent(content ?? null);
  }, [roomState.playlist]);

  useEffect(() => {
    if (content?.type) {
      setLastKnownType(content.type);
    }
  }, [content?.type]);
  const currentType = content?.type ?? lastKnownType; // "stream" | "sync"
  const isPremiumUser =
    false;
  const effectiveStreamDeliveryMode =
    streamDeliveryMode || (roomState.host && isPremiumUser ? "sfu" : "p2p");
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
  if (currentType === "stream") {
    return effectiveStreamDeliveryMode === "sfu" ? (
      <StreamPlayer
        key="stream-premium"
        fullscreenTargetRef={fullscreenTargetRef}
        setFocus={() => dispatch(setFocused(true))}
      />
    ) : (
      <P2PStreamPlayer
        key="stream-free"
        fullscreenTargetRef={fullscreenTargetRef}
        setFocus={() => dispatch(setFocused(true))}
      />
    );
  }
  // ** We will going to use this below one when we implemented monetisation here
  // if (currentType === "stream") {
  //   return (
  //     <P2PStreamPlayer
  //       fullscreenTargetRef={fullscreenTargetRef}
  //       setFocus={() => dispatch(setFocused(true))}
  //     />
  //   );
  // }

  if (!content)
    return (
      <StreamPlayerEmptyState
        isHost={host}
        roomType={currentType as RoomType}
        hostLeft={roomState.host}
        remoteStream={null}
        isInitialized={false}
      />
    );

  // Default to SyncPlayer when type is "sync" or undefined
  return (
    <SyncPlayer
      key={content.id}
      fullscreenTargetRef={fullscreenTargetRef}
      setFocus={() => dispatch(setFocused(true))}
    />
  );
};

export default PlayerWrapper;
