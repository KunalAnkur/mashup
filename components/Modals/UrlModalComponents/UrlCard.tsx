import React from "react";
import { FaTimes, FaVideo } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import {
  appSyncCardClass,
  appSyncCardIndexClass,
  appSyncCardThumbnailClass,
  zincGlassSoftInsetSurfaceClass,
} from "@/components/UI/classTokens";

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
}> = ({ isLoading, thumbnail, title, platform }) => (
  <div
    className={`${appSyncCardThumbnailClass} ${zincGlassSoftInsetSurfaceClass}`}
  >
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-700/20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500/35 border-t-fuchsia-400/70" />
      </div>
    ) : thumbnail ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt={title || "Video thumbnail"}
        className="h-full w-full object-cover object-center"
      />
    ) : null}

    <div
      className={`absolute inset-0 flex items-center justify-center ${
        thumbnail && !isLoading ? "hidden" : ""
      } ${platform?.iconBg || "bg-gradient-to-br from-pink-500 to-fuchsia-600"}`}
    >
      <span className="text-sm text-white">
        {platform?.smallIcon || <FaVideo className="text-xs text-white" />}
      </span>
    </div>
  </div>
);

const UrlCardMetadata: React.FC<{
  isLoading: boolean;
  hasMetadata: boolean;
  metadata?: AddedUrl["metadata"];
  platform: Platform | undefined;
  urlDisplayName: string;
}> = ({ isLoading, hasMetadata, metadata, platform, urlDisplayName }) => (
  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden">
    {isLoading ? (
      <div className="space-y-1.5">
        <div className="h-3 rounded-full bg-zinc-700/25 animate-pulse" />
        <div className="h-2.5 w-2/3 rounded-full bg-zinc-700/20 animate-pulse" />
      </div>
    ) : hasMetadata && metadata ? (
      <>
        <p className="line-clamp-1 text-[13px] font-medium leading-tight text-white/88 sm:text-sm">
          {metadata.title || urlDisplayName}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-white/48">
          {metadata.author ? (
            <span className="truncate max-w-[112px]">{metadata.author}</span>
          ) : null}
          {metadata.author && platform ? <span>•</span> : null}
          {platform ? <span className="truncate">{platform.name}</span> : null}
        </div>
      </>
    ) : (
      <>
        <p className="truncate text-[13px] font-medium text-white/86 sm:text-sm">
          {urlDisplayName}
        </p>
        {platform ? (
          <p className="truncate text-[11px] text-white/46">{platform.name}</p>
        ) : null}
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
    <div className={appSyncCardClass}>
      <div className={appSyncCardIndexClass}>
        {index + 1}
      </div>

      <UrlCardThumbnail
        isLoading={isLoading}
        thumbnail={url.metadata?.thumbnail || undefined}
        title={url.metadata?.title || undefined}
        platform={platform}
      />

      <UrlCardMetadata
        isLoading={isLoading}
        hasMetadata={hasMetadata}
        metadata={url.metadata}
        platform={platform}
        urlDisplayName={getUrlDisplayName(url.url)}
      />

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/38 transition-colors duration-200 hover:text-rose-300"
        aria-label="Remove URL"
      >
        <FaTimes className="text-xs" />
      </button>
    </div>
  );
};
