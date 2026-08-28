"use client";

import { useEffect, useRef } from "react";
import { useMediaStreamContext } from "@/context/MediaStreamContext";

/**
 * Takes the host's screen share dark while the room's daily watch limit is in force.
 *
 * "Playback paused" is the wrong primitive for a shared screen. A paused `<video>` holding a
 * live MediaStream only freezes the picture it is drawing — the media keeps arriving, and
 * anything that reveals the element again (dismissing the modal, native picture-in-picture,
 * fullscreen) shows a stream nobody ever stopped. The host is not watching through Movmash at
 * all: they are looking at the source screen, which no amount of client state can pause.
 *
 * So the thing that stops is the sharing. Disabling the tracks at the capture makes every
 * receiver get black frames and silence, which is not a presentation trick — there is nothing
 * left behind the modal to reveal.
 *
 * `enabled = false` rather than `stop()` on purpose. Stopping ends the capture, and getting it
 * back costs the host a fresh browser picker and a permission prompt — a real cost for a limit
 * that resets tomorrow or the moment they upgrade. Disabling keeps the track, the peer
 * connection and any SFU producer alive, so flipping it back resumes instantly. It also acts
 * upstream of delivery, which is why one hook covers P2P and SFU without either knowing.
 *
 * The trade-off: black frames still encode and send. It is a trickle rather than nothing.
 */
export const useScreenShareBlackout = ({
  isHost,
  blocked,
}: {
  isHost: boolean;
  blocked: boolean;
}): void => {
  const { stream } = useMediaStreamContext();

  // Only ever re-enable what this hook switched off. The host may have silenced a track
  // themselves, and coming back from the limit should not undo their choice.
  const disabledTracksRef = useRef<Set<MediaStreamTrack>>(new Set());

  useEffect(() => {
    // Guests hold no capture of their own — this context carries the local screen share, not
    // the call — but the guard makes it explicit that this only ever touches the sharer.
    if (!isHost || !stream) return;

    if (blocked) {
      for (const track of stream.getTracks()) {
        if (track.readyState !== "live" || !track.enabled) continue;
        track.enabled = false;
        disabledTracksRef.current.add(track);
      }
      if (disabledTracksRef.current.size > 0) {
        console.log(
          `[ScreenShareBlackout] Daily limit reached — blacked out ${disabledTracksRef.current.size} track(s)`
        );
      }
      return;
    }

    if (disabledTracksRef.current.size === 0) return;

    for (const track of disabledTracksRef.current) {
      // A track that ended while blocked is gone; re-enabling it would achieve nothing and
      // `enabled` on a dead track is meaningless.
      if (track.readyState === "live") track.enabled = true;
    }
    console.log(
      `[ScreenShareBlackout] Limit cleared — restored ${disabledTracksRef.current.size} track(s)`
    );
    disabledTracksRef.current.clear();
  }, [isHost, blocked, stream]);
};
