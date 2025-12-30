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
  <div className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-zinc-800/15 to-zinc-700/15 backdrop-blur-sm border border-zinc-600/20">
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-700/20 animate-pulse">
        <div className="w-6 h-6 border-2 border-zinc-500/30 border-t-purple-500/60 rounded-full animate-spin"></div>
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
        <div className="h-3.5 bg-zinc-700/20 rounded animate-pulse"></div>
        <div className="h-2.5 bg-zinc-700/15 rounded w-2/3 animate-pulse"></div>
      </div>
    ) : hasMetadata && metadata ? (
      <>
        <p className="text-white text-xs font-semibold line-clamp-1 leading-tight">
          {metadata.title || urlDisplayName}
        </p>
        {metadata.description && (
          <p className="text-white/60 text-[10px] line-clamp-1 leading-tight">
            {metadata.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-white/60 mt-0.5">
          {metadata.author && (
            <span className="truncate max-w-[80px]">{metadata.author}</span>
          )}
          {metadata.author && platform && <span>•</span>}
          {platform && <span className="truncate">{platform.name}</span>}
        </div>
      </>
    ) : (
      <>
        <p className="text-white text-xs font-medium truncate">
          {urlDisplayName}
        </p>
        {platform && (
          <p className="text-white/60 text-[10px] truncate">{platform.name}</p>
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
    <div className="group relative flex gap-3 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10 rounded-xl p-3 transition-all duration-200 h-[72px] shrink-0 overflow-hidden">
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
        className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 self-start mt-1"
      >
        <FaTimes className="text-sm" />
      </button>
    </div>
  );
};
