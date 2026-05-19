"use client";

import { FaBroadcastTower, FaSync } from "react-icons/fa";
import { useState, useCallback } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useRouter } from "next/navigation";
import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { Input } from "../UI";
import {
  appHomeEntryCardSurfaceClass,
  appHomeInputSurfaceClass,
} from "../UI/classTokens";

const titleClass =
  "font-parkinsans text-[29px] font-semibold tracking-tight text-white sm:text-[31px] md:text-[35px]";
const descriptionClass =
  "mx-auto mt-1 max-w-md px-2 text-center text-sm leading-6 text-white/56 sm:text-[15px]";
const cardBaseClass =
  `group relative h-36 w-full overflow-hidden rounded-2xl ${appHomeEntryCardSurfaceClass} transition-all duration-300 sm:h-40 md:h-44`;
const cardInnerClass =
  "relative flex h-full flex-col items-center justify-center px-4 text-white/82 transition-colors duration-300 group-hover:text-white";
const cardIconWrapClass =
  "mb-2.5 flex items-center justify-center rounded-full bg-white/[0.045] p-4 text-white transition-all duration-300 group-hover:bg-white/[0.075] sm:p-5 md:p-6";
const joinInputSurfaceClass =
  `flex flex-1 items-center rounded-2xl px-3.5 sm:px-4 ${appHomeInputSurfaceClass}`;
const joinInputFieldClass =
  "h-[50px] w-full appearance-none bg-transparent text-base text-white outline-none placeholder:text-white/38";
const joinButtonClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold tracking-tight transition-all duration-200 shadow-[0_10px_24px_rgba(190,24,93,0.22)] enabled:bg-gradient-to-r enabled:from-rose-600 enabled:via-pink-600 enabled:to-fuchsia-600 enabled:text-white enabled:hover:shadow-[0_14px_30px_rgba(190,24,93,0.28)] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-gray-600 disabled:shadow-none";

const SourceSelection = () => {
  const t = useTranslations("home");
  const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
  const [roomId, setRoomId] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  const router = useRouter();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

  const handleOnUploadSelection = useCallback(() => {
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
    <>
      <div className="flex flex-1 w-full flex-col items-center justify-center overflow-y-auto bg-transparent px-4 pb-6 pt-20 sm:px-6 sm:pb-6 sm:pt-6">
        <div className="my-auto flex w-full max-w-lg flex-col items-center gap-4 sm:gap-5 md:gap-6">
          <div className="w-full animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="mb-3 flex items-center justify-center gap-2 sm:mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 opacity-85 animate-pulse"></div>
              <h2 className={titleClass}>{t("createParty")}</h2>
              <div
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 opacity-85 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
            <p className={descriptionClass}>{t("createPartyDescription")}</p>

            <div className="mt-4 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={handleOnUploadSelection}
                className={`${cardBaseClass} animate-scale-in sm:w-1/2`}
                style={{ animationDelay: "0.2s" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.12),transparent_42%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                <div className={cardInnerClass}>
                  <div className={`${cardIconWrapClass} text-cyan-200 group-hover:text-white`}>
                    <FaBroadcastTower className="text-xl sm:text-2xl" />
                  </div>
                  <span className="text-base font-medium tracking-tight sm:text-lg">
                    {t("stream")}
                  </span>
                </div>
              </button>

              <button
                onClick={handleOnURLSelection}
                className={`${cardBaseClass} animate-scale-in sm:w-1/2`}
                style={{ animationDelay: "0.3s" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_40%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                <div className={cardInnerClass}>
                  <div className={`${cardIconWrapClass} text-fuchsia-200 group-hover:text-white`}>
                    <FaSync className="text-xl sm:text-2xl" />
                  </div>
                  <span className="text-base font-medium tracking-tight sm:text-lg">
                    {t("sync")}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex w-full animate-fade-in items-center gap-2" style={{ animationDelay: "0.4s" }}>
            <div className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/[0.34]">
              {t("or")}
            </span>
            <div className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />
          </div>

          <div className="w-full animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex flex-col items-center">
              <h2 className={`${titleClass} mb-1`}>{t("joinParty")}</h2>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:gap-3">
              <div className="flex w-full gap-2.5 sm:gap-3">
                <div
                  className={`${joinInputSurfaceClass} ${
                    joinError ? "bg-red-500/[0.08]" : ""
                  } ${isJoining ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Input
                    variant="raw"
                    type="text"
                    autoFocus
                    placeholder={t("roomIdPlaceholder")}
                    value={roomId}
                    onChange={handleOnRoomIdChange}
                    onKeyDown={handleKeyDown}
                    disabled={isJoining}
                    className={joinInputFieldClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoinRoom}
                  className={joinButtonClass}
                  disabled={isJoinDisabled || isJoining}
                >
                  {isJoining ? (
                    <span className="inline-flex items-center gap-2">
                      <ImSpinner2 className="animate-spin" />
                      {t("joining")}
                    </span>
                  ) : (
                    t("join")
                  )}
                </button>
              </div>

              {joinError ? (
                <div className="animate-fade-in flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2.5">
                  <svg
                    className="h-4 w-4 shrink-0 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs text-red-200 sm:text-sm">{joinError}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.55s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default SourceSelection;
