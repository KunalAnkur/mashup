"use client";

import {
  LuMonitor,
  LuFileUp,
  LuLink2,
  LuYoutube,
  LuArrowRight,
  LuKeyRound,
} from "react-icons/lu";
import { useCallback, useRef, useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useRouter } from "next/navigation";
import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { useScreenShareSupport } from "@/hooks";
import { Input } from "../UI";
import {
  dashActionIconClass,
  dashActionLabelClass,
  dashActionTileClass,
  dashActionsGridClass,
  dashJoinOpenClass,
  dashJoinSubmitIconClass,
  dashJoinTileClass,
  dashJoinTileInputWrapClass,
  dashJoinTileInputClass,
  dashSectionHeadClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

/**
 * One colour per action, so the row can be read by shape and colour before any of it is
 * read as words. Solid rather than tinted — a wash of the same violet four times over is
 * what the previous grid of identical tiles already was.
 */
const ACTION_COLOURS: Record<string, string> = {
  screenShare: "linear-gradient(145deg,#38bdf8,#0284c7)",
  fileShare: "linear-gradient(145deg,#a78bfa,#7c3aed)",
  addUrl: "linear-gradient(145deg,#f472b6,#db2777)",
  youtube: "linear-gradient(145deg,#f87171,#dc2626)",
  join: "linear-gradient(145deg,#34d399,#059669)",
};

const SourceSelection = () => {
  const t = useTranslations("home");
  const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
  const [roomId, setRoomId] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  /** The join cell shows its field only once asked — see dashJoinTileClass. */
  const [joinOpen, setJoinOpen] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();
  const canScreenShare = useScreenShareSupport();

  const handleOnScreenShareSelection = useCallback(() => {
    trackCTAClicked("stream");
    router.push("/stream/screen");
  }, [router]);

  const handleOnFileShareSelection = useCallback(() => {
    trackCTAClicked("stream");
    router.push("/stream");
  }, [router]);

  const handleOnURLSelection = useCallback(() => {
    trackCTAClicked("sync");
    router.push("/sync");
  }, [router]);

  const handleOnYouTubeSelection = useCallback(() => {
    trackCTAClicked("sync");
    router.push("/youtube");
  }, [router]);

  const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setRoomId(value);
    setIsJoinDisabled(value.trim().length === 0);
    setJoinError("");
  };

  const handleJoinRoom = useCallback(async () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId.length === 0 || isJoining) return;

    setIsJoining(true);
    setJoinError("");

    try {
      const response = await getRoomByRoomId(trimmedRoomId).unwrap();

      if (
        response?.statusCode === 401 ||
        (response?.success && response?.data)
      ) {
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

  /**
   * The three ways in, plus the browse page. Data, so the row is one loop.
   *
   * Screen share drops out on mobile — the capture API it leads to does not exist there,
   * so the tile would only walk someone into a dead end.
   */
  const actions = [
    ...(canScreenShare
      ? [{ key: "screenShare", Icon: LuMonitor, onClick: handleOnScreenShareSelection }]
      : []),
    { key: "fileShare", Icon: LuFileUp, onClick: handleOnFileShareSelection },
    { key: "addUrl", Icon: LuLink2, onClick: handleOnURLSelection },
    { key: "youtube", Icon: LuYoutube, onClick: handleOnYouTubeSelection },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isJoinDisabled && !isJoining) {
      handleJoinRoom();
    }
  };

  return (
    <section>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass}>{t("actionsTitle")}</h2>
      </div>

      <div className={dashActionsGridClass}>
        {actions.map(({ key, Icon, onClick }) => (
          <button key={key} onClick={onClick} className={dashActionTileClass}>
            <span className={dashActionIconClass} style={{ background: ACTION_COLOURS[key] }}>
              <Icon className="text-[16px]" />
            </span>
            <span className={dashActionLabelClass}>{t(key)}</span>
          </button>
        ))}

        {joinOpen ? (
          <div className={dashJoinOpenClass}>
            <div className={dashJoinTileInputWrapClass}>
              <Input
                ref={joinInputRef}
                variant="raw"
                type="text"
                placeholder={t("roomIdPlaceholder")}
                value={roomId}
                onChange={handleOnRoomIdChange}
                onKeyDown={handleKeyDown}
                // Closing on blur only when nothing was typed: closing on any blur would
                // throw away a half-entered code the moment someone tabbed to the button.
                onBlur={() => {
                  if (!roomId.trim()) setJoinOpen(false);
                }}
                disabled={isJoining}
                maxLength={8}
                className={dashJoinTileInputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={isJoinDisabled || isJoining}
              aria-label={t("join")}
              className={dashJoinSubmitIconClass}
            >
              {isJoining ? (
                <ImSpinner2 className="animate-spin text-[14px]" />
              ) : (
                <LuArrowRight className="text-[15px]" />
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setJoinOpen(true);
              // Focus after the swap, or the field does not exist yet to focus.
              requestAnimationFrame(() => joinInputRef.current?.focus());
            }}
            className={dashJoinTileClass}
          >
            <span className={dashActionIconClass} style={{ background: ACTION_COLOURS.join }}>
              <LuKeyRound className="text-[15px]" />
            </span>
            <span className={dashActionLabelClass}>{t("joinWithCode")}</span>
          </button>
        )}
      </div>

      {joinError ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-red-200 sm:text-sm">{joinError}</p>
        </div>
      ) : null}
    </section>
  );
};

export default SourceSelection;
