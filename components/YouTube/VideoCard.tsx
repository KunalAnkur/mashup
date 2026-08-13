"use client";

import { useState } from "react";
import { LuCheck, LuPlus } from "react-icons/lu";

import { useI18n } from "@/i18n/I18nProvider";
import type { YouTubeVideoCard } from "@/lib/store/api/youtubeApi";
import {
  ytCardAddClass,
  ytCardAvatarClass,
  ytCardClass,
  ytCardPositionClass,
  ytCardSelectedClass,
  ytCardChannelClass,
  ytCardDurationClass,
  ytCardLiveClass,
  ytCardMetaClass,
  ytCardThumbClass,
  ytCardThumbImgClass,
  ytCardTitleClass,
} from "@/components/UI/classTokens";

/**
 * One video, laid out the way YouTube lays one out: a 16:9 thumbnail with the duration
 * in the corner, then the channel avatar beside a two-line title, the channel name, and
 * a views · age line.
 *
 * That arrangement is deliberate rather than imitative — it is the one people can read
 * without being taught, because they have read it ten thousand times.
 */

/** 3730 → "1:02:10", 205 → "3:25". Matches YouTube's own omission of a leading zero. */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** 1_396_076 → "1.4M". `Intl` does the abbreviating so it reads right in every locale. */
function formatViews(count: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

/**
 * "3 days ago". Relative rather than a date, because on a video the interesting fact is
 * how fresh it is, not which Tuesday it landed on.
 */
function formatAge(publishedAt: string, locale: string): string {
  const then = new Date(publishedAt).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((then - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, "second");
}

export function VideoCard({
  video,
  onToggle,
  /** 1-based place in the queue, or 0 when this video is not in it. */
  position = 0,
}: {
  video: YouTubeVideoCard;
  onToggle: (video: YouTubeVideoCard) => void;
  position?: number;
}) {
  const { locale } = useI18n();
  const [avatarFailed, setAvatarFailed] = useState(false);

  const showAvatar = video.channelThumbnail && !avatarFailed;
  const selected = position > 0;

  return (
    <button
      type="button"
      onClick={() => onToggle(video)}
      aria-pressed={selected}
      className={ytCardClass}
      title={video.title}
    >
      <div className={`${ytCardThumbClass} ${selected ? ytCardSelectedClass : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          className={ytCardThumbImgClass}
        />
        {video.isLive ? (
          <span className={ytCardLiveClass}>LIVE</span>
        ) : video.durationSeconds > 0 ? (
          <span className={ytCardDurationClass}>{formatDuration(video.durationSeconds)}</span>
        ) : null}

        {selected ? (
          <>
            {/* Dimmed under the badge so a picked video reads as picked even at the
                edge of vision, where a small marker alone would not. */}
            <span className="absolute inset-0 bg-pink-950/35" />
            <span className={ytCardPositionClass}>{position}</span>
          </>
        ) : (
          <span className={ytCardAddClass}>
            <LuPlus className="text-[14px]" />
          </span>
        )}
      </div>

      <div className="flex gap-3 px-0.5 pt-3">
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.channelThumbnail}
            alt=""
            loading="lazy"
            className={ytCardAvatarClass}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          // A grey disc with the channel's initial, so the row never collapses by 36px
          // when an avatar is missing and the titles stop lining up across the grid.
          <span
            className={`${ytCardAvatarClass} flex items-center justify-center bg-white/[0.08] text-[13px] font-semibold text-white/60`}
          >
            {video.channelTitle?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className={ytCardTitleClass}>
            {selected ? <LuCheck className="mr-1 inline text-[13px] text-pink-400" /> : null}
            {video.title}
          </h3>
          <p className={ytCardChannelClass}>{video.channelTitle}</p>
          <p className={ytCardMetaClass}>
            {video.isLive
              ? formatAge(video.publishedAt, locale)
              : `${formatViews(video.viewCount, locale)} · ${formatAge(video.publishedAt, locale)}`}
          </p>
        </div>
      </div>
    </button>
  );
}

export default VideoCard;
