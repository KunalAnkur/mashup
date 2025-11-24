"use client";

import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useDispatch } from "react-redux";
import { FaUpload, FaLink } from "react-icons/fa";
import { Button } from "../UI";
import { useRef, useState } from "react";
import { useFileContext } from "@/context/FileContext";
import Image from "next/image";
import DeviceModal from "../Modals/DeviceModal";
import UrlModal from "../Modals/UrlModal";
import { useRouter } from "next/navigation";
import { useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";

const SourceSelection = () => {
  const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
  const [roomId, setRoomId] = useState<string>("");
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { setFiles } = useFileContext();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

  const handleOnVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log(files);
    if (files && files.length > 0) {
      setFiles(Array.from(files));
      // setIsDeviceModalOpen(false); // Close modal after file selection
      dispatch(changeStep(OnboardStep.FILE_SELECTION));
    }
  };

  const handleOnUploadSelection = () => {
    setIsDeviceModalOpen(true); // Open the device modal
  };

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
  };

  const handleOnURLSelection = () => {
    setIsUrlModalOpen(true); // Open the URL modal
  };

  const handleCloseUrlModal = () => {
    setIsUrlModalOpen(false);
  };

  const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomId(value);
    setIsJoinDisabled(value.trim().length === 0);
    setJoinError(""); // Clear error when user types
  };

  const handleJoinRoom = async () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId.length === 0 || isJoining) return;

    setIsJoining(true);
    setJoinError("");

    try {
      const response = await getRoomByRoomId(trimmedRoomId).unwrap();

      if (response?.success && response?.data) {
        // Room exists and is active, navigate to it
        router.push(`/room/${trimmedRoomId}`);
      } else {
        setJoinError("Room not found. Please check the Room ID.");
      }
    } catch (error: unknown) {
      // Handle API errors (404, network errors, etc.)
      const err = error as {
        status?: number | string;
        data?: { status?: number };
      };
      if (err?.status === 404 || err?.data?.status === 404) {
        setJoinError("Room not found. Please check the Room ID.");
      } else if (err?.status === "FETCH_ERROR") {
        setJoinError("Network error. Please try again.");
      } else {
        setJoinError("Failed to join room. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isJoinDisabled && !isJoining) {
      handleJoinRoom();
    }
  };

  return (
    <>
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#18181b] px-4 py-6 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-lg flex flex-col items-center gap-3 sm:gap-4 md:gap-5 my-auto">
          {/* LOGO & BRAND */}
          <div className="flex items-center justify-center gap-3 ">
            <Image
              src="/assets/logo.svg"
              alt="Movmash Logo"
              width={36}
              height={36}
              className="sm:w-10 sm:h-10 md:w-12 md:h-12"
            />
            <h3 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-white text-center font-parkinsans tracking-tight">
              Movmash
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
                Create Party
              </h2>
              <div
                className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
            <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2">
              Start a new session by uploading a file or using a URL.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch w-full">
              {/* From Device */}
              <button
                onClick={handleOnUploadSelection}
                className="relative overflow-hidden w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group animate-scale-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="absolute inset-[2px] bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl"></div>
                <div className="relative flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-white transition-colors duration-300">
                  <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 group-hover:from-rose-500 group-hover:to-pink-500 transition-all duration-300 mb-1 md:mb-2 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-500/50">
                    <FaUpload className="text-xl sm:text-2xl text-rose-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">
                    From Device
                  </span>
                </div>
              </button>

              {/* From URL */}
              <button
                onClick={handleOnURLSelection}
                className="relative overflow-hidden w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group animate-scale-in"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="absolute inset-[2px] bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl"></div>
                <div className="relative flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-white transition-colors duration-300">
                  <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 group-hover:from-pink-500 group-hover:to-fuchsia-500 transition-all duration-300 mb-1 md:mb-2 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-fuchsia-500/50">
                    <FaLink className="text-xl sm:text-2xl text-fuchsia-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">
                    From URL
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
              or
            </span>
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-full" />
          </div>

          {/* Join Party */}
          <div
            className="w-full flex flex-col items-center animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-white text-center mb-1 font-parkinsans">
              Join Party
            </h2>
            <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2">
              Enter a Room ID to join an existing session.
            </p>
            <div className="flex flex-col w-full gap-2 sm:gap-3">
              <div className="flex w-full gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomId}
                  onChange={handleOnRoomIdChange}
                  onKeyDown={handleKeyDown}
                  disabled={isJoining}
                  className={`text-sm sm:text-base flex-1 rounded-xl bg-white/5 border text-gray-100 placeholder:text-gray-500 p-2.5 sm:p-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 ${
                    joinError
                      ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                      : "border-white/10"
                  } ${isJoining ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <div className="relative">
                  <div className="group">
                    <Button
                      name={isJoining ? "Joining..." : "Join"}
                      onClick={handleJoinRoom}
                      className="text-sm sm:text-base md:text-lg font-bold px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg whitespace-nowrap
                                      enabled:bg-gradient-to-r enabled:from-rose-600 enabled:via-pink-600 enabled:to-fuchsia-600 enabled:text-white enabled:shadow-pink-500/25
                                      enabled:hover:from-rose-500 enabled:hover:via-pink-500 enabled:hover:to-fuchsia-500 enabled:hover:shadow-pink-500/40
                                      disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                      disabled={isJoinDisabled || isJoining}
                    />
                    {/*  {isJoinDisabled && !isJoining && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2a2a2e] text-gray-200 text-xs md:text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 max-w-[calc(100vw-2rem)] shadow-xl border border-white/10">
                        Room ID must be 4 characters
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2a2a2e]"></div>
                      </div>
                    )} */}
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

      {/* Device Modal */}
      <DeviceModal
        open={isDeviceModalOpen}
        onClose={handleCloseDeviceModal}
        onFileSelect={handleOnVideoChange}
        fileInputRef={fileInputRef}
      />

      <UrlModal open={isUrlModalOpen} onClose={handleCloseUrlModal} />
    </>
  );
};

export default SourceSelection;
