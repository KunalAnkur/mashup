"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { isCompleteRoomCode, sanitizeRoomCode } from "@/utils/validation";

/**
 * Joining a room by its code — the whole behaviour, with no opinion about how it looks.
 *
 * Two surfaces need it and they are shaped nothing alike: the illustrated card in the home
 * rail, where the field is always open, and the compact tile in the Actions row on narrow
 * screens, which looks like its neighbours until it is tapped. Keeping the state, the
 * sanitising and the error mapping here means the two can never drift into validating or
 * failing differently — only their markup differs.
 *
 * Each caller gets its own instance, so a code half-typed in one does not appear in the
 * other. That is intended: only one of the two is ever mounted at a given width.
 */
export function useJoinRoom() {
  const t = useTranslations("home");
  const router = useRouter();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

  const [roomId, setRoomId] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // A real code is exactly ROOM_CODE_LENGTH characters, so anything shorter cannot match a
  // room and the request is not worth making. Checking only "not empty" let a half-typed
  // code through to come back as "Room not found" — an error that blames the code rather
  // than saying it is unfinished.
  const isJoinDisabled = !isCompleteRoomCode(roomId);

  // Sanitising as it is typed, rather than at submit, keeps the field showing exactly what
  // will be sent: a pasted " a8x2d " becomes A8X2D as it lands instead of looking wrong
  // until someone presses the button.
  const handleRoomIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(sanitizeRoomCode(e.target.value));
    setJoinError("");
  }, []);

  const handleJoinRoom = useCallback(async () => {
    // Already sanitised by handleRoomIdChange. Re-checked because this also runs from the
    // Enter key, and a guard on the one path that issues a request is cheap.
    const trimmedRoomId = roomId.trim();
    if (!isCompleteRoomCode(trimmedRoomId) || isJoining) return;

    setIsJoining(true);
    setJoinError("");

    try {
      const response = await getRoomByRoomId(trimmedRoomId).unwrap();

      // A 401 still means the room exists — it is private, and the room route is what
      // asks for access. Only a genuine miss is an error worth showing here.
      if (response?.statusCode === 401 || (response?.success && response?.data)) {
        trackCTAClicked("join_room", { room_id: trimmedRoomId });
        router.push(`/room/${trimmedRoomId}`);
      } else {
        setJoinError(t("errors.roomNotFound"));
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number | string;
        data?: { status?: number };
      };
      if (err?.status === 404 || err?.data?.status === 404) {
        setJoinError(t("errors.roomNotFound"));
      } else if (err?.status === "FETCH_ERROR") {
        setJoinError(t("errors.networkError"));
      } else {
        setJoinError(t("errors.joinFailed"));
      }
    } finally {
      setIsJoining(false);
    }
  }, [roomId, isJoining, getRoomByRoomId, router, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isJoinDisabled && !isJoining) {
        handleJoinRoom();
      }
    },
    [handleJoinRoom, isJoinDisabled, isJoining]
  );

  return {
    roomId,
    isJoining,
    joinError,
    isJoinDisabled,
    inputRef,
    handleRoomIdChange,
    handleJoinRoom,
    handleKeyDown,
  };
}
