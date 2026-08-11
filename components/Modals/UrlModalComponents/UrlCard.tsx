import React from "react";
import { FaTimes, FaVideo } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import {
  appSyncCardClass,
  appSyncCardIndexClass,
  appSyncCardThumbnailClass,
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
  <div className={appSyncCardThumbnailClass}>
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-dashSurfaceAlt">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-pink-500/80" />
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
        <div className="h-2.5 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="h-2 w-2/3 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
    ) : hasMetadata && metadata ? (
      <>
        <p className="line-clamp-1 text-xs font-semibold tracking-tight leading-tight text-dashText sm:text-[13px]">
          {metadata.title || urlDisplayName}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-dashTextMute sm:text-[11px]">
          {metadata.author ? (
            <span className="truncate max-w-[112px]">{metadata.author}</span>
          ) : null}
          {metadata.author && platform ? <span>•</span> : null}
          {platform ? <span className="truncate">{platform.name}</span> : null}
        </div>
      </>
    ) : (
      <>
        <p className="truncate text-xs font-semibold tracking-tight text-dashText sm:text-[13px]">
          {urlDisplayName}
        </p>
        {platform ? (
          <p className="truncate text-[10px] text-dashTextMute sm:text-[11px]">{platform.name}</p>
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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-dashTextMute transition-colors duration-200 hover:text-rose-400"
        aria-label="Remove URL"
      >
        <FaTimes className="text-[11px]" />
      </button>
    </div>
  );
};
