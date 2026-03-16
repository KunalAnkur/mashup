import React from "react";
import { FaTimes, FaVideo, FaPlay } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import { zincGlassInteractiveHoverSurfaceClass } from "@/components/UI/classTokens";

interface UrlCardProps {
  url: AddedUrl;
  index: number;
  platform: Platform | undefined;
  isLoading: boolean;
  onRemove: (index: number) => void;
  getUrlDisplayName: (url: string) => string;
}

const UrlCardThumbnail: React.FC<{
  isLoading: boolean;
  thumbnail?: string;
  title?: string;
  platform: Platform | undefined;
  showPlayIcon: boolean;
}> = ({ isLoading, thumbnail, title, platform, showPlayIcon }) => (
  <div className="relative w-14 h-9 sm:w-16 sm:h-10 md:w-[72px] md:h-[44px] lg:w-20 lg:h-13 rounded-md sm:rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-zinc-800/15 to-zinc-700/15 backdrop-blur-sm border border-zinc-600/20">
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-700/20 animate-pulse">
        <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 border-2 border-zinc-500/30 border-t-purple-500/60 rounded-full animate-spin"></div>
      </div>
    ) : thumbnail ? (
      <img
        src={thumbnail}
        alt={title || "Video thumbnail"}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          if (target.nextElementSibling) {
            (target.nextElementSibling as HTMLElement).style.display = "flex";
          }
        }}
      />
    ) : null}
    <div
      className={`absolute inset-0 flex items-center justify-center ${
        thumbnail && !isLoading ? "hidden" : ""
      } ${
        platform?.iconBg || "bg-gradient-to-br from-pink-500 to-fuchsia-600"
      }`}
    >
      <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg">
        {platform?.smallIcon || <FaVideo className="text-white text-[10px] sm:text-xs" />}
      </span>
    </div>
    {showPlayIcon && thumbnail && !isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <FaPlay className="text-white text-[8px] sm:text-[10px] md:text-xs" />
      </div>
    )}
  </div>
);

const UrlCardMetadata: React.FC<{
  isLoading: boolean;
  hasMetadata: boolean;
  metadata?: AddedUrl["metadata"];
  platform: Platform | undefined;
  urlDisplayName: string;
}> = ({ isLoading, hasMetadata, metadata, platform, urlDisplayName }) => (
  <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden">
    {isLoading ? (
      <div className="space-y-1 sm:space-y-1.5">
        <div className="h-3 sm:h-3.5 bg-zinc-700/20 rounded animate-pulse"></div>
        <div className="h-2 sm:h-2.5 bg-zinc-700/15 rounded w-2/3 animate-pulse"></div>
      </div>
    ) : hasMetadata && metadata ? (
      <>
        <p className="text-white text-[11px] sm:text-xs font-semibold line-clamp-1 leading-tight">
          {metadata.title || urlDisplayName}
        </p>
        {metadata.description && (
          <p className="text-white/60 text-[9px] sm:text-[10px] line-clamp-1 leading-tight">
            {metadata.description}
          </p>
        )}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-white/60 mt-0.5">
          {metadata.author && (
            <span className="truncate max-w-[60px] sm:max-w-[80px]">{metadata.author}</span>
          )}
          {metadata.author && platform && <span>•</span>}
          {platform && <span className="truncate">{platform.name}</span>}
        </div>
      </>
    ) : (
      <>
        <p className="text-white text-[11px] sm:text-xs font-medium truncate">
          {urlDisplayName}
        </p>
        {platform && (
          <p className="text-white/60 text-[9px] sm:text-[10px] truncate">{platform.name}</p>
        )}
      </>
    )}
  </div>
);

export const UrlCard: React.FC<UrlCardProps> = ({
  url,
  index,
  platform,
  isLoading,
  onRemove,
  getUrlDisplayName,
}) => {
  const hasMetadata = !!(
    url.metadata && (url.metadata.title || url.metadata.thumbnail)
  );

  return (
    <div className={`group relative flex items-center gap-1.5 sm:gap-2 md:gap-3 ${zincGlassInteractiveHoverSurfaceClass} rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 transition-all duration-200 h-[60px] sm:h-[64px] md:h-[68px] lg:h-[72px] shrink-0 overflow-hidden`}>
      {/* Order Number - Always visible */}
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium flex-shrink-0 bg-white/5 text-gray-400 group-hover:bg-white/10">
        {index + 1}
      </div>

      <UrlCardThumbnail
        isLoading={isLoading}
        thumbnail={url.metadata?.thumbnail || undefined}
        title={url.metadata?.title || undefined}
        platform={platform}
        showPlayIcon={hasMetadata}
      />

      <UrlCardMetadata
        isLoading={isLoading}
        hasMetadata={hasMetadata}
        metadata={url.metadata}
        platform={platform}
        urlDisplayName={getUrlDisplayName(url.url)}
      />

      <button
        onClick={() => onRemove(index)}
        className="p-1.5 sm:p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-all duration-200 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 self-center"
        aria-label="Remove URL"
      >
        <FaTimes className="text-xs sm:text-sm" />
      </button>
    </div>
  );
};
