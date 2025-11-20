import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { Button } from "../UI";
import { FaTimes, FaVideo } from "react-icons/fa";
import ReactPlayer from "react-player";
import { UrlModalProps } from "@/types/urlModalProps";
import { Platform } from "@/types/urlPlatformTypes";
import { AddedUrl } from "@/types/addedUrlTypes";
import { platforms } from "@/constants/urlPlatforms";

const UrlModal: React.FC<UrlModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  const [sourceUrlInput, setSourceUrlInput] = useState<string>("");
  const [addedUrls, setAddedUrls] = useState<AddedUrl[]>([]);
  const [isAddDisabled, setAddDisabled] = useState<boolean>(true);
  const [tooltipMessage, setTooltipMessage] = useState<string>("");

  const detectPlatform = (url: string): string => {
    for (const platform of platforms) {
      if (
        platform.urlPatterns.length > 0 &&
        platform.urlPatterns.some((pattern) => pattern.test(url))
      ) {
        return platform.id;
      }
    }
    return "custom";
  };

  const validateUrl = (url: string): { valid: boolean; tooltip: string } => {
    if (!url.trim()) {
      return { valid: false, tooltip: "Enter a URL" };
    }

    if (addedUrls.some((item) => item.url === url.trim())) {
      return { valid: false, tooltip: "URL already added" };
    }

    if (!ReactPlayer.canPlay(url)) {
      return { valid: false, tooltip: "URL is not supported" };
    }

    return { valid: true, tooltip: "" };
  };

  useEffect(() => {
    if (!sourceUrlInput.trim()) {
      setAddDisabled(true);
      setTooltipMessage("");
      return;
    }
    const { valid, tooltip } = validateUrl(sourceUrlInput);
    setAddDisabled(!valid);
    setTooltipMessage(tooltip);
  }, [sourceUrlInput, addedUrls]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleAddUrl = () => {
    const validation = validateUrl(sourceUrlInput);
    if (!validation.valid) {
      return;
    }

    const detectedPlatform = detectPlatform(sourceUrlInput);
    setAddedUrls((prev) => [
      ...prev,
      { url: sourceUrlInput.trim(), platformId: detectedPlatform },
    ]);
    setSourceUrlInput("");
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setAddedUrls((prev) => prev.filter((item) => item.url !== urlToRemove));
  };

  const handleOnEnterRoom = async () => {
    if (addedUrls.length === 0) {
      return;
    }

    dispatch(
      setRefers({
        refer: true,
        sourceType: "url",
        urls: addedUrls.map((item) => item.url),
      })
    );
    if (authState.isAuthenticated) {
      onClose();
    } else {
      onClose();
      dispatch(changeStep(OnboardStep.AUTH_STEP));
    }
  };

  const getUrlDisplayName = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return (
        urlObj.hostname +
        urlObj.pathname.slice(0, 15) +
        (urlObj.pathname.length > 15 ? "..." : "")
      );
    } catch {
      return url.slice(0, 25) + (url.length > 25 ? "..." : "");
    }
  };

  const getPlatformById = (id: string): Platform | undefined => {
    return platforms.find((p) => p.id === id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shrink-0">
          <div className="w-8 sm:w-10" /> {/* Spacer for centering */}
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-100 font-parkinsans text-center">
            Enter Source URL
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-[#27272a] transition-all duration-200"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 w-full overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 xl:gap-12 2xl:gap-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 lg:py-0 lg:items-center lg:justify-center">
            {/* Left Side - Supported Platforms */}
            <div className="w-full lg:w-1/2 flex flex-col shrink-0">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-100 mb-3 sm:mb-4 md:mb-5 lg:mb-6 font-parkinsans text-center">
                Supported platforms
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-2 sm:gap-3 md:gap-3 lg:gap-4 xl:gap-5">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    style={platform.bgStyle}
                    className="aspect-square flex flex-col items-center justify-center rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-2xl shadow-lg p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 transition-all duration-300 hover:scale-105 group"
                  >
                    <div className="text-white group-hover:scale-110 transition-transform duration-300 text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl">
                      {platform.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-xs lg:text-sm xl:text-base font-bold text-white mt-1 sm:mt-2 lg:mt-3 text-center leading-tight">
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block border-r border-white/30 h-[250px] xl:h-[300px] 2xl:h-[350px] self-center shrink-0" />

            {/* Horizontal Divider - Visible on mobile/tablet only */}
            <div className="block lg:hidden w-full h-[1px] bg-white/30 my-2" />

            {/* Right Side - URL Input */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-100 mb-3 sm:mb-4 md:mb-5 lg:mb-6 font-parkinsans text-center">
                Paste your URLs
              </h3>

              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Added URLs List */}
                {addedUrls.length > 0 && (
                  <div className="flex flex-col gap-1.5 sm:gap-2 mb-1 sm:mb-2 max-h-[120px] sm:max-h-[150px] md:max-h-[180px] lg:max-h-[200px] xl:max-h-[220px] overflow-y-auto pr-1 sm:pr-2">
                    {addedUrls.map((item, index) => {
                      const platform = getPlatformById(item.platformId);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-[#27272a] rounded-lg sm:rounded-xl px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div
                              className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full shrink-0 ${
                                platform?.iconBg || "bg-pink-500"
                              }`}
                            >
                              <span className="text-sm sm:text-base md:text-lg text-white">
                                {platform?.smallIcon || (
                                  <FaVideo className="text-white" />
                                )}
                              </span>
                            </div>
                            <span className="text-gray-100 text-xs sm:text-sm truncate">
                              {getUrlDisplayName(item.url)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveUrl(item.url)}
                            className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-[#3f3f46] transition-all shrink-0 ml-2"
                          >
                            <FaTimes className="text-xs sm:text-sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* URL Input Area */}
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="Paste your video URL here"
                      value={sourceUrlInput}
                      onChange={handleOnSourceUrlChange}
                      className="flex-1 min-w-0 rounded-lg sm:rounded-xl bg-[#27272a] text-gray-100 text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-pink-600 transition placeholder:text-gray-500"
                    />
                    <div className="relative group shrink-0">
                      <Button
                        onClick={handleAddUrl}
                        className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition
                          disabled:bg-[#27272a] disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none"
                        name="Add"
                        disabled={isAddDisabled}
                      />
                      {/* Tooltip */}
                      {isAddDisabled && tooltipMessage && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-[#18181b] text-[10px] sm:text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                          {tooltipMessage}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-100"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 md:mt-4">
                  <Button
                    onClick={onClose}
                    className="flex-1 rounded-lg sm:rounded-xl flex items-center justify-center bg-[#27272a] text-gray-100 text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-[#3f3f46] transition-colors"
                    name="Cancel"
                  />
                  <Button
                    onClick={handleOnEnterRoom}
                    className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition
                      disabled:bg-[#27272a] disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none"
                    name="Enter"
                    disabled={addedUrls.length === 0}
                  />
                </div>

                {/* Helper Text */}
                <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium text-center mt-1 sm:mt-2">
                  {addedUrls.length === 0
                    ? "Add URLs to start your party"
                    : `${addedUrls.length} URL${
                        addedUrls.length > 1 ? "s" : ""
                      } added`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlModal;
