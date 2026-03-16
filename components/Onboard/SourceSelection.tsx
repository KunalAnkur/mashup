"use client";

import { FaBroadcastTower, FaSync } from "react-icons/fa";
import { Button, Logo } from "../UI";
import { useState, useCallback } from "react";
import { ImSpinner2 } from "react-icons/im";

import { useRouter } from "next/navigation";
import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";

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

  // Navigate to sync - no warning needed (works on mobile)
  const handleOnURLSelection = useCallback(() => {
    trackCTAClicked("sync");
    router.push("/sync");
  }, [router]);

  const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setRoomId(value);
    setIsJoinDisabled(value.trim().length === 0);
    setJoinError(""); // Clear error when user types
  };

  // Join room - no warning needed (can join any room type)
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
        // Room exists and is active, navigate to it
        trackCTAClicked("join_room", { room_id: trimmedRoomId });
        router.push(`/room/${trimmedRoomId}`);
      } else {
        setJoinError(t("errors.roomNotFound"));
      }
    } catch (error: unknown) {
      // Handle API errors (404, network errors, etc.)
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
      setIsJoining(false);
    } finally {
      // setIsJoining(false);
    }
  }, [roomId, isJoining, getRoomByRoomId, router, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isJoinDisabled && !isJoining) {
      handleJoinRoom();
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center bg-transparent px-4 pt-20 sm:pt-6 pb-6 overflow-hidden sm:overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-lg flex flex-col items-center gap-3 sm:gap-4 md:gap-5 my-auto">
          {/* LOGO & BRAND - Hidden on mobile (shown in header instead) */}
          <div className="hidden sm:flex items-center justify-center gap-3 ">
            <Logo height={36} width={36} custom={true} />
            <h3 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-white text-center font-parkinsans tracking-tight">
              {t("brand")}
            </h3>
          </div>

          {/* Create Party */}
          <div
            className="w-full animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse"></div>
              <h2 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-white text-center font-parkinsans">
                {t("createParty")}
              </h2>
              <div
                className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
            <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2 mt-1">
              {t("createPartyDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch w-full">
              {/* Stream */}
              <button
                onClick={handleOnUploadSelection}
                className="relative w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group animate-scale-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 backdrop-blur-5xl  rounded-xl group-hover:from-rose-600/30 group-hover:via-pink-600/30 group-hover:to-fuchsia-600/30 group-hover:border-white/20 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl backdrop-blur-sm"></div>
                <div className="relative flex flex-col items-center justify-center h-full text-white/80 group-hover:text-white transition-colors duration-300">
                  <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-500/15 backdrop-blur-md border border-blue-400/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 group-hover:border-blue-400/40 transition-all duration-300 mb-1 md:mb-2 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/50">
                    <FaBroadcastTower className="text-xl sm:text-2xl text-blue-300 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">
                    {t("stream")}
                  </span>
                </div>
              </button>

              {/* Sync */}
              <button
                onClick={handleOnURLSelection}
                className="relative overflow-hidden w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group animate-scale-in"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-fuchsia-600/20 to-purple-600/20 backdrop-blur-2xl rounded-xl group-hover:from-pink-600/30 group-hover:via-fuchsia-600/30 group-hover:to-purple-600/30 group-hover:border-white/20 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl backdrop-blur-sm"></div>
                <div className="relative flex flex-col items-center justify-center h-full text-white/80 group-hover:text-white transition-colors duration-300">
                  <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/15 backdrop-blur-md border border-indigo-400/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 group-hover:border-indigo-400/40 transition-all duration-300 mb-1 md:mb-2 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/50">
                    <FaSync className="text-xl sm:text-2xl text-indigo-300 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">
                    {t("sync")}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div
            className="flex items-center gap-2 w-full animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-full" />
            <span className="text-gray-500 text-sm sm:text-md font-semibold">
              {t("or")}
            </span>
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-full" />
          </div>

          {/* Join Party */}
          <div
            className="w-full flex flex-col items-center animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-white text-center mb-1 font-parkinsans">
              {t("joinParty")}
            </h2>
            <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2">
              {t("joinPartyDescription")}
            </p>
            <div className="flex flex-col w-full gap-2 sm:gap-3">
              <div className="flex w-full gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder={t("roomIdPlaceholder")}
                  value={roomId}
                  onChange={handleOnRoomIdChange}
                  onKeyDown={handleKeyDown}
                  disabled={isJoining}
                  className={`outline-none text-sm sm:text-base flex-1 rounded-xl bg-white/5 backdrop-blur-2xl border text-white placeholder:text-white/50 p-2.5 sm:p-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 ${
                    joinError
                      ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                      : "border-none"
                  } ${isJoining ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <div className="relative">
                  <div className="group">
                    <Button
                      name={isJoining ? t("joining") : t("join")}
                      icon={isJoining ? <ImSpinner2 className="animate-spin" /> : undefined}

                      onClick={handleJoinRoom}
                      className="text-sm sm:text-base md:text-lg font-bold px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg whitespace-nowrap
                                      enabled:bg-gradient-to-r enabled:from-rose-600 enabled:via-pink-600 enabled:to-fuchsia-600 enabled:text-white enabled:shadow-pink-500/25
                                      enabled:hover:from-rose-500 enabled:hover:via-pink-500 enabled:hover:to-fuchsia-500 enabled:hover:shadow-pink-500/40
                                      disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                      disabled={isJoinDisabled || isJoining}
                    />
                  </div>
                </div>
              </div>
              {joinError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
                  <svg
                    className="w-4 h-4 text-red-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-400 text-xs sm:text-sm">{joinError}</p>
                </div>
              )}
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default SourceSelection;
