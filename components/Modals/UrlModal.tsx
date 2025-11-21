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
    if (!url.trim()) return { valid: false, tooltip: "Enter a URL" };
    if (addedUrls.some((item) => item.url === url.trim()))
      return { valid: false, tooltip: "URL already added" };
    if (!ReactPlayer.canPlay(url))
      return { valid: false, tooltip: "URL is not supported" };
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
    if (e.target === e.currentTarget) onClose();
  };

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleAddUrl = () => {
    const validation = validateUrl(sourceUrlInput);
    if (!validation.valid) return;
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
    if (addedUrls.length === 0) return;
    dispatch(
      setRefers({
        refer: true,
        sourceType: "url",
        urls: addedUrls.map((item) => item.url),
      })
    );
    onClose();
    if (!authState.isAuthenticated) dispatch(changeStep(OnboardStep.AUTH_STEP));
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

  const getPlatformById = (id: string): Platform | undefined =>
    platforms.find((p) => p.id === id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between px-6 md:px-10 py-5 md:py-6 shrink-0">
          <div className="w-10" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-parkinsans">
            Enter Source URL
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
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
        <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-6 md:py-10">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-7xl mx-auto px-6 md:px-10 ">
            {/* Left Side - Supported Platforms */}
            <div className="w-full lg:w-1/2 flex flex-col flex-1">
              <h3 className="text-lg md:text-xl font-bold text-white mb-6 font-parkinsans text-center lg:text-left">
                Supported Platforms
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    style={platform.bgStyle}
                    className="aspect-square flex flex-col items-center justify-center rounded-2xl shadow-lg p-5 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group cursor-pointer min-h-[120px] md:min-h-[140px]"
                  >
                    <div className="text-white group-hover:scale-110 transition-transform duration-300 text-3xl md:text-4xl">
                      {platform.icon}
                    </div>
                    <span className="text-sm md:text-base font-bold text-white mt-3 text-center">
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - URL Input */}
            <div className="w-full lg:w-1/2 flex flex-col flex-1">
              <h3 className="text-lg md:text-xl font-bold text-white mb-6 font-parkinsans text-center lg:text-left">
                Paste Your URLs
              </h3>

              <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a]  rounded-2xl p-6 md:p-8 shadow-xl flex flex-col justify-center flex-1">
                <div className="flex flex-col gap-3   justify-center">
                  {/* Added URLs List */}
                  {addedUrls.length > 0 && (
                    <div
                      className={`flex flex-col gap-2 mb-2 pr-1 
      ${
        addedUrls.length > 3
          ? "max-h-[150px]  overflow-y-auto"
          : "max-h-[150px]"
      }
    `}
                    >
                      {addedUrls.map((item, index) => {
                        const platform = getPlatformById(item.platformId);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl  px-3 py-2 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                                  platform?.iconBg ||
                                  "bg-gradient-to-br from-pink-500 to-fuchsia-600"
                                }`}
                              >
                                <span className="text-base text-white">
                                  {platform?.smallIcon || (
                                    <FaVideo className="text-white text-sm" />
                                  )}
                                </span>
                              </div>
                              <span className="text-gray-200 text-sm truncate font-medium">
                                {getUrlDisplayName(item.url)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleRemoveUrl(item.url)}
                              className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 shrink-0 ml-2"
                            >
                              <FaTimes className="text-sm" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* URL Input Area */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Paste your video URL here"
                      value={sourceUrlInput}
                      onChange={handleOnSourceUrlChange}
                      className="flex-1 min-w-0 rounded-xl bg-white/5   text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500"
                    />
                    <div className="relative group shrink-0">
                      <Button
                        onClick={handleAddUrl}
                        className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none "
                        name="Add"
                        disabled={isAddDisabled}
                      />
                      {isAddDisabled && tooltipMessage && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2a2a2e] text-gray-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-xl">
                          {tooltipMessage}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2a2a2e]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 ">
                    <Button
                      onClick={onClose}
                      className="flex-1 rounded-xl flex items-center justify-center bg-white/5 text-gray-300 text-sm px-4 py-3 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                      name="Cancel"
                    />
                    <Button
                      onClick={handleOnEnterRoom}
                      className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none"
                      name="Enter"
                      disabled={addedUrls.length === 0}
                    />
                  </div>

                  {/* Helper Text */}
                  {/* <p className="text-gray-500 text-xs font-medium text-center">
                    {addedUrls.length === 0
                      ? "Add URLs to start your party"
                      : `${addedUrls.length} URL${
                          addedUrls.length > 1 ? "s" : ""
                        } added`}
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlModal;
