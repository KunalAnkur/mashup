"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalOnRoomCreate from "@/components/Modals/ModalOnRoomCreate";
import { useRoomContext } from "@/context/RoomContext";
import { trackInvitePromptShown } from "@/lib/analytics";
import type { RootState } from "@/lib/store";
import { setFocused } from "@/lib/store/slices/roomSlice";

const promptedKey = (roomId: string) => `movmash_invite_prompted_${roomId}`;

/**
 * Hands the host their invite link the moment the room exists.
 *
 * A room is nothing until a second person is in it, and most never got one: the link lived
 * only in the side panel, behind a small icon, so a host who did not go looking sat alone
 * and left. This puts the link in front of them once, while they are still deciding what
 * to do next.
 *
 * Once per room, and only while the host is alone — someone who reloads, or whose partner
 * is already there, has no use for it. Guests never see it; they arrive by the link.
 */
export default function HostInvitePrompt() {
  const dispatch = useDispatch();
  const { isJoined, isHost, roomId, participants } = useRoomContext();
  const [open, setOpen] = useState(false);

  const isAlone = participants.length <= 1;

  // The room's other modals outrank this one. An upgrade prompt or the daily-limit block
  // is about whether the room can play at all, and stacking an invite on top of either
  // would hide it. Waiting costs nothing: the prompt opens once they are out of the way.
  const isAnotherModalOpen = useSelector(
    (state: RootState) =>
      state.room.settings.isPlaybackBlocked ||
      state.room.settings.upgradeSubscriptionModal ||
      state.room.settings.contentModal,
  );

  useEffect(() => {
    if (!isHost || !isJoined || !roomId || !isAlone || isAnotherModalOpen) return;

    try {
      if (window.sessionStorage.getItem(promptedKey(roomId))) return;
    } catch {
      // Storage blocked: showing it again after a reload is the lesser problem.
    }

    // Let the room finish arriving first, so this opens over a settled screen.
    const timer = setTimeout(() => {
      try {
        window.sessionStorage.setItem(promptedKey(roomId), "1");
      } catch {
        // See above.
      }
      setOpen(true);
      trackInvitePromptShown(roomId);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isHost, isJoined, roomId, isAlone, isAnotherModalOpen]);

  // Their person arrived while it was open — it has done its job. Likewise if one of the
  // room's own modals needs the screen.
  useEffect(() => {
    if (!isAlone || isAnotherModalOpen) setOpen(false);
  }, [isAlone, isAnotherModalOpen]);

  const handleClose = () => {
    setOpen(false);
    // The modal took keyboard focus; give the player its shortcuts back.
    dispatch(setFocused(true));
  };

  if (!isHost || !roomId) return null;

  const roomUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;

  return (
    <ModalOnRoomCreate
      isHost
      hostUsername={null}
      showModal={open}
      onClose={handleClose}
      roomUrl={roomUrl}
    />
  );
}
