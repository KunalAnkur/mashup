import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { Button } from "../UI";
import {
  FaTimes,
  FaVideo,
  FaLink,
  FaCheckCircle,
  FaPlay,
} from "react-icons/fa";
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
  const [loadingMetadata, setLoadingMetadata] = useState<Set<number>>(
    new Set()
  );

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
  }, [sourceUrlInput]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddDisabled) {
      handleAddUrl();
    }
  };

  const fetchUrlMetadata = async (
    url: string
  ): Promise<AddedUrl["metadata"]> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = authState.token;

      const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the response structure from the backend
      return {
        title: data.data?.title || undefined,
        description: data.data?.description || undefined,
        thumbnail: data.data?.thumbnail || undefined,
        author: data.data?.author || data.data?.siteName || undefined,
      };
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return {};
    }
  };

  const handleAddUrl = async () => {
    const validation = validateUrl(sourceUrlInput);
    if (!validation.valid) return;
    const detectedPlatform = detectPlatform(sourceUrlInput);
    const url = sourceUrlInput.trim();

    // Add URL immediately with empty metadata
    const newIndex = addedUrls.length;
    setAddedUrls((prev) => [...prev, { url, platformId: detectedPlatform }]);
    setSourceUrlInput("");

    // Fetch metadata asynchronously
    setLoadingMetadata((prev) => new Set(prev).add(newIndex));
    const metadata = await fetchUrlMetadata(url);
    setAddedUrls((prev) => {
      const updated = [...prev];
      if (updated[newIndex]) {
        updated[newIndex] = { ...updated[newIndex], metadata };
      }
      return updated;
    });
    setLoadingMetadata((prev) => {
      const newSet = new Set(prev);
      newSet.delete(newIndex);
      return newSet;
    });
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setAddedUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
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
        {/* Header - Improved */}
        <div className="w-full flex items-center justify-between px-6 md:px-10 py-5 md:py-6 shrink-0 border-b border-white/5">
          <div className="w-10" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
                <FaLink className="text-white text-lg" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-parkinsans">
                Add Video Source
              </h2>
            </div>
            <p className="text-gray-400 text-xs md:text-sm">
              Import videos from YouTube, Twitch, Vimeo, and more
            </p>
          </div>
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

        {/* Content - Left/Right Layout */}
        <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-6 md:py-10">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-7xl mx-auto px-6 md:px-10">
            {/* Left Side - Supported Platforms */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1 h-6 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></span>
                <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
                  Supported Platforms
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-purple-500 rounded-full"></span>
                <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
                  Paste Your URLs
                </h3>
              </div>

              <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-4 shadow-xl flex flex-col flex-1">
                <div className="flex flex-col h-full gap-3">
                  {/* URL Input Area - TOP */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Paste your video URL here"
                      value={sourceUrlInput}
                      onChange={handleOnSourceUrlChange}
                      onKeyDown={handleKeyDown}
                      className="flex-1 min-w-0 rounded-xl bg-white/5  text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500"
                    />
                    <div className="relative group shrink-0">
                      <Button
                        onClick={handleAddUrl}
                        className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none"
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

                  {/* Added URLs List / Empty State - MIDDLE */}
                  <div className="flex-1 min-h-0 max-h-full overflow-hidden">
                    {addedUrls.length > 0 ? (
                      <div
                        className={`flex flex-col gap-2 pr-1 overflow-y-auto ${
                          addedUrls.length > 3
                            ? "max-h-[230px]"
                            : "max-h-[230px]"
                        }`}
                      >
                        {addedUrls.map((item, index) => {
                          const platform = getPlatformById(item.platformId);
                          const isLoading = loadingMetadata.has(index);
                          const hasMetadata =
                            item.metadata &&
                            (item.metadata.title || item.metadata.thumbnail);

                          return (
                            <div
                              key={`${item.url}-${index}`}
                              className="group flex gap-3 bg-white/5 hover:bg-white/10  rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0"
                            >
                              {/* Thumbnail */}
                              <div className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#1f1f23] to-[#27272a] ">
                                {isLoading ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                  </div>
                                ) : item.metadata?.thumbnail ? (
                                  <img
                                    src={item.metadata.thumbnail}
                                    alt={
                                      item.metadata.title || "Video thumbnail"
                                    }
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      if (target.nextElementSibling) {
                                        (
                                          target.nextElementSibling as HTMLElement
                                        ).style.display = "flex";
                                      }
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`absolute inset-0 flex items-center justify-center ${
                                    item.metadata?.thumbnail && !isLoading
                                      ? "hidden"
                                      : ""
                                  } ${
                                    platform?.iconBg ||
                                    "bg-gradient-to-br from-pink-500 to-fuchsia-600"
                                  }`}
                                >
                                  <span className="text-white text-lg">
                                    {platform?.smallIcon || (
                                      <FaVideo className="text-white text-sm" />
                                    )}
                                  </span>
                                </div>
                                {/* Play icon overlay */}
                                {item.metadata?.thumbnail && !isLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <FaPlay className="text-white text-xs" />
                                  </div>
                                )}
                              </div>

                              {/* Metadata Info */}
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden">
                                {isLoading ? (
                                  <div className="space-y-1.5">
                                    <div className="h-3.5 bg-white/10 rounded animate-pulse"></div>
                                    <div className="h-2.5 bg-white/5 rounded w-2/3 animate-pulse"></div>
                                  </div>
                                ) : hasMetadata && item.metadata ? (
                                  <>
                                    <p className="text-gray-200 text-xs font-semibold line-clamp-1 leading-tight">
                                      {item.metadata.title ||
                                        getUrlDisplayName(item.url)}
                                    </p>
                                    {item.metadata.description && (
                                      <p className="text-gray-500 text-[10px] line-clamp-1 leading-tight">
                                        {item.metadata.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                                      {item.metadata.author && (
                                        <span className="truncate max-w-[80px]">
                                          {item.metadata.author}
                                        </span>
                                      )}
                                      {item.metadata.author && platform && (
                                        <span>•</span>
                                      )}
                                      {platform && (
                                        <span className="truncate">
                                          {platform.name}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-gray-200 text-xs font-medium truncate">
                                      {getUrlDisplayName(item.url)}
                                    </p>
                                    {platform && (
                                      <p className="text-gray-500 text-[10px] truncate">
                                        {platform.name}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveUrl(index)}
                                className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 self-start mt-1"
                              >
                                <FaTimes className="text-sm" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        {/* Preview Placeholder Cards */}
                        <div className="w-full space-y-2 mb-3">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-dashed border-white/10"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 flex items-center justify-center shrink-0">
                                <FaVideo className="text-gray-600 text-xs" />
                              </div>
                              <div className="flex-1 h-3 bg-white/[0.03] rounded-full" />
                              <div className="w-6 h-6 rounded-lg bg-white/[0.02] flex items-center justify-center">
                                <FaTimes className="text-gray-700 text-xs" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tips Section */}
                        <div className="w-full space-y-2">
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
                            <span>
                              Add multiple URLs for a playlist experience
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
                            <span>
                              Supports direct video links from all platforms
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
                            <span>
                              URLs will appear here as cards after adding
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - BOTTOM */}
                  <div className="flex gap-3">
                    <Button
                      onClick={onClose}
                      className="flex-1 rounded-xl flex items-center justify-center bg-white/5  text-gray-300 text-sm px-4 py-3 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                      name="Cancel"
                    />
                    <Button
                      onClick={handleOnEnterRoom}
                      className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none"
                      name="Enter"
                      disabled={addedUrls.length === 0}
                    />
                  </div>
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
