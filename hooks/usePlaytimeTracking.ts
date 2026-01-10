import { useRef, useCallback, useEffect } from "react";
import { useTrackPlaytimeMutation } from "@/lib/store/api/roomApi";

interface UsePlaytimeTrackingOptions {
  roomId: string | null;
  isHost: boolean;
  enabled?: boolean;
}

// Shared ref across all hook instances to accumulate playtime
const sharedAccumulatedSecondsRef = { current: 0 };
const currentRoomIdRef = { current: null as string | null };

/**
 * Hook to track playtime for the host
 * Accumulates seconds while playing and sends them when host leaves the room
 */
export const usePlaytimeTracking = ({
  roomId,
  isHost,
  enabled = true,
}: UsePlaytimeTrackingOptions) => {
  const [trackPlaytime] = useTrackPlaytimeMutation();
  
  // Update current room ID when it changes and reset accumulated seconds
  useEffect(() => {
    if (roomId && roomId !== currentRoomIdRef.current) {
      // Reset accumulated seconds when room changes
      if (currentRoomIdRef.current !== null) {
        sharedAccumulatedSecondsRef.current = 0;
      }
      currentRoomIdRef.current = roomId;
    }
  }, [roomId]);

  // Handle playtime update from player - just accumulate, don't send
  const handlePlaytimeUpdate = useCallback(
    (seconds: number) => {
      if (!enabled || !roomId || !isHost) return;
      // Only accumulate if this is the current room
      if (roomId === currentRoomIdRef.current) {
        sharedAccumulatedSecondsRef.current += seconds;
      }
    },
    [enabled, roomId, isHost]
  );

  // Send accumulated playtime to API (called when host leaves)
  const sendPlaytime = useCallback(async () => {
    const currentRoomId = currentRoomIdRef.current;
    if (!currentRoomId || !isHost || sharedAccumulatedSecondsRef.current === 0) {
      return { success: false, seconds: 0 };
    }

    const secondsToSend = sharedAccumulatedSecondsRef.current;
    sharedAccumulatedSecondsRef.current = 0; // Reset accumulator

    try {
      await trackPlaytime({ roomId: currentRoomId, seconds: parseInt(secondsToSend.toString()) }).unwrap();
      return { success: true, seconds: secondsToSend };
    } catch (error) {
      // Re-add the seconds to accumulator so we can retry later
      sharedAccumulatedSecondsRef.current += secondsToSend;
      console.error("Failed to track playtime:", error);
      return { success: false, seconds: secondsToSend };
    }
  }, [isHost, trackPlaytime]);

  return {
    handlePlaytimeUpdate,
    sendPlaytime,
  };
};
