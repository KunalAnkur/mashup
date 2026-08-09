"use client";

import { LuMonitor, LuFileUp, LuLink2 } from "react-icons/lu";
import { useState, useCallback } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useRouter } from "next/navigation";
import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { Input } from "../UI";
import {
  dashActionTileClass,
  dashActionTileGlowClass,
  dashActionTileIconWrapClass,
  dashActionTileLabelClass,
  dashActionTileSizeClass,
  dashActionsGridClass,
  dashJoinTileClass,
  dashJoinTileHeaderClass,
  dashJoinTileInputWrapClass,
  dashJoinTileInputClass,
  dashJoinTileSubmitClass,
  dashSectionHeadClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

const tileClass = `group relative ${dashActionTileSizeClass} ${dashActionTileClass}`;
const tileInnerClass = "relative flex h-full flex-col items-center justify-center gap-2.5 px-3";
const tileIconWrapClass = `h-9 w-9 ${dashActionTileIconWrapClass}`;

const SourceSelection = () => {
  const t = useTranslations("home");
  const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
  const [roomId, setRoomId] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  const router = useRouter();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

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
        <button onClick={handleOnScreenShareSelection} className={tileClass}>
          <div className={dashActionTileGlowClass} />
          <div className={tileInnerClass}>
            <div className={tileIconWrapClass}>
              <LuMonitor className="text-xl" />
            </div>
            <span className={dashActionTileLabelClass}>{t("screenShare")}</span>
          </div>
        </button>

        <button onClick={handleOnFileShareSelection} className={tileClass}>
          <div className={dashActionTileGlowClass} />
          <div className={tileInnerClass}>
            <div className={tileIconWrapClass}>
              <LuFileUp className="text-xl" />
            </div>
            <span className={dashActionTileLabelClass}>{t("fileShare")}</span>
          </div>
        </button>

        <button onClick={handleOnURLSelection} className={tileClass}>
          <div className={dashActionTileGlowClass} />
          <div className={tileInnerClass}>
            <div className={tileIconWrapClass}>
              <LuLink2 className="text-xl" />
            </div>
            <span className={dashActionTileLabelClass}>{t("addUrl")}</span>
          </div>
        </button>

        <div className={dashJoinTileClass}>
          <span className={dashJoinTileHeaderClass}>{t("joinWithCode")}</span>
          <div className={dashJoinTileInputWrapClass}>
            <Input
              variant="raw"
              type="text"
              placeholder={t("roomIdPlaceholder")}
              value={roomId}
              onChange={handleOnRoomIdChange}
              onKeyDown={handleKeyDown}
              disabled={isJoining}
              maxLength={8}
              className={dashJoinTileInputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={isJoinDisabled || isJoining}
            className={dashJoinTileSubmitClass}
          >
            {isJoining ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <ImSpinner2 className="animate-spin" />
                {t("joining")}
              </span>
            ) : (
              t("join")
            )}
          </button>
        </div>
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
