"use client";
// hover: bg-zinc-700
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useDispatch } from "react-redux";
import { FaUpload, FaLink } from "react-icons/fa";
import { Button } from "../UI";
import { useRef, useState } from "react";
import { useFileContext } from "@/context/FileContext";
import Image from "next/image";

const SourceSelection = () => {
  const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
  const [roomId, setRoomId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { setFiles } = useFileContext();

  const handleOnVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log(files);
    if (files && files.length > 0) {
      // Do something with the files
      // const selectedFile = Array.from(files).map(file => URL.createObjectURL(file))
      setFiles(Array.from(files));
      dispatch(changeStep(OnboardStep.FILE_SELECTION));
    }
  };
  const handleOnUploadSelection = () => {
    // Add your upload logic here
    // dispatch(changeStep(OnboardStep.FILE_SELECTION));
    fileInputRef.current?.click();
  };

  const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value.trim());
    setIsJoinDisabled(e.target.value.trim().length !== 4);
  };
  const handleOnURLSelection = () => {
    // router.push(`#${OnboardStep.SOURCE_INFO}`);
    dispatch(changeStep(OnboardStep.URL_SELECTION));
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#18181b] px-4 py-6 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-lg flex flex-col items-center gap-3 sm:gap-4 md:gap-5 my-auto">
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
          <Image
            src="/assets/logo.svg"
            alt="Create Party"
            width={36}
            height={36}
            className="sm:w-10 sm:h-10 md:w-12 md:h-12"
          />
          <h3 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-gray-100 text-center font-parkinsans">
            Movmash
          </h3>
        </div>

        {/* Create Party */}
        <div className="w-full">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-gray-100 text-center mb-1 font-parkinsans">
            Create Party
          </h2>
          <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2">
            Start a new session by uploading a file or using a URL.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch w-full">
            <input
              ref={fileInputRef}
              onChange={handleOnVideoChange}
              type="file"
              accept="video/*,audio/*,.mp4,.mp3,.mkv,.webm,.3gp,.avi,.mpeg,.mpg,.ogg,.wmv,.wav,.mov"
              multiple
              className="hidden"
            />
            <button
              onClick={handleOnUploadSelection}
              className="flex flex-col items-center text-gray-400 hover:text-gray-100 justify-center bg-[#27272a] hover:bg-gradient-to-r hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 rounded-xl transition-all duration-300 shadow-lg gap-2 group-hover:gap-0 w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group"
            >
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-[#18181b] group-hover:p-0 group-hover:bg-transparent group-hover:opacity-0 transition-all duration-300 group-hover:h-0 group-hover:mb-0 mb-1 md:mb-2">
                <FaUpload className="text-xl sm:text-2xl text-gray-400 group-hover:text-gray-100 transition-all duration-300" />
              </div>
              <span className="text-base sm:text-lg font-semibold">
                From Device
              </span>
            </button>

            <button
              onClick={handleOnURLSelection}
              className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-100 bg-[#27272a] hover:bg-gradient-to-r hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 rounded-xl transition-all duration-300 shadow-lg gap-2 group-hover:gap-0 w-full sm:w-1/2 h-36 sm:h-40 md:h-44 group"
            >
              <div className="flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-full bg-[#18181b] group-hover:p-0 group-hover:bg-transparent group-hover:opacity-0 transition-all duration-300 group-hover:h-0 group-hover:mb-0 mb-1 md:mb-2">
                <FaLink className="text-xl sm:text-2xl text-gray-400 group-hover:text-gray-100 transition-all duration-300" />
              </div>
              <span className="text-base sm:text-lg font-semibold">
                From URL
              </span>
            </button>
          </div>
        </div>

        {/* Divider */}

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-[1.5px] bg-[#27272a] rounded-full" />
          <span className="text-gray-400 text-sm sm:text-md">or</span>
          <div className="flex-1 h-[1.5px] bg-[#27272a] rounded-full" />
        </div>

        {/* Join Party */}
        <div className="w-full flex flex-col items-center">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-gray-100 text-center mb-1 font-parkinsans">
            Join Party
          </h2>
          <p className="text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-2">
            Enter a Room ID to join an existing session.
          </p>
          <div className="flex w-full gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={handleOnRoomIdChange}
              className="text-sm sm:text-base flex-1 rounded-xl bg-[#27272a] text-gray-100 placeholder:text-gray-500 p-2.5 sm:p-3 focus:outline-none focus:ring-1 focus:ring-pink-600 transition"
            />
            <div className="relative">
              <div className="group">
                <Button
                  name="Join"
                  className="text-sm sm:text-base md:text-lg font-bold px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg whitespace-nowrap
                                  enabled:bg-gradient-to-r enabled:from-rose-600 enabled:via-pink-600 enabled:to-fuchsia-600 enabled:text-white
                                  enabled:hover:from-rose-700 enabled:hover:via-pink-700 enabled:hover:to-fuchsia-700
                                  disabled:bg-[#27272a] disabled:text-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                  disabled={isJoinDisabled}
                />
                {isJoinDisabled && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-100 text-[#18181b] text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 max-w-[calc(100vw-2rem)]">
                    Room ID must be 4 characters
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-100"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceSelection;
