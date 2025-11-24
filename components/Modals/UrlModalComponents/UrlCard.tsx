import React from "react";
import { FaTimes, FaVideo, FaPlay } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";

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
  <div className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#1f1f23] to-[#27272a]">
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
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
      <span className="text-white text-lg">
        {platform?.smallIcon || <FaVideo className="text-white text-sm" />}
      </span>
    </div>
    {showPlayIcon && thumbnail && !isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <FaPlay className="text-white text-xs" />
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
      <div className="space-y-1.5">
        <div className="h-3.5 bg-white/10 rounded animate-pulse"></div>
        <div className="h-2.5 bg-white/5 rounded w-2/3 animate-pulse"></div>
      </div>
    ) : hasMetadata && metadata ? (
      <>
        <p className="text-gray-200 text-xs font-semibold line-clamp-1 leading-tight">
          {metadata.title || urlDisplayName}
        </p>
        {metadata.description && (
          <p className="text-gray-500 text-[10px] line-clamp-1 leading-tight">
            {metadata.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
          {metadata.author && (
            <span className="truncate max-w-[80px]">{metadata.author}</span>
          )}
          {metadata.author && platform && <span>•</span>}
          {platform && <span className="truncate">{platform.name}</span>}
        </div>
      </>
    ) : (
      <>
        <p className="text-gray-200 text-xs font-medium truncate">
          {urlDisplayName}
        </p>
        {platform && (
          <p className="text-gray-500 text-[10px] truncate">{platform.name}</p>
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
  const hasMetadata =
    url.metadata && (url.metadata.title || url.metadata.thumbnail);

  return (
    <div className="group flex gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0">
      <UrlCardThumbnail
        isLoading={isLoading}
        thumbnail={url.metadata?.thumbnail}
        title={url.metadata?.title}
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
        className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 self-start mt-1"
      >
        <FaTimes className="text-sm" />
      </button>
    </div>
  );
};
