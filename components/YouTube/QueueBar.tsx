"use client";

import { LuArrowRight, LuX } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { useTranslations } from "@/i18n/I18nProvider";
import type { YouTubeVideoCard } from "@/lib/store/api/youtubeApi";
import {
  dashPrimaryButtonClass,
  ytQueueBarClass,
  ytQueueClearClass,
  ytQueueCountClass,
  ytQueueStripClass,
  ytQueueThumbClass,
  ytQueueThumbRemoveClass,
} from "@/components/UI/classTokens";

/**
 * What is queued, and the button that turns it into a room.
 *
 * Shows the picks themselves rather than just a count: a playlist is an ordered thing,
 * and "4 videos selected" does not tell you whether the one you meant is in it or which
 * plays first. The strip is also where you take something back out — the alternative is
 * hunting the grid for a card you scrolled past.
 */

const formatTotal = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export function QueueBar({
  queue,
  onRemove,
  onClear,
  onCreate,
  creating,
}: {
  queue: YouTubeVideoCard[];
  onRemove: (videoId: string) => void;
  onClear: () => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const t = useTranslations("youtube");

  if (queue.length === 0) return null;

  // Live streams report no duration, so a queue of them would claim "0m". Better to say
  // nothing than to say something wrong.
  const total = queue.reduce((sum, video) => sum + video.durationSeconds, 0);

  return (
    <div className={ytQueueBarClass}>
      <div className={ytQueueStripClass}>
        {queue.map((video, index) => (
          <button
            key={video.videoId}
            type="button"
            onClick={() => onRemove(video.videoId)}
            title={t("removeFromQueue", { title: video.title })}
            className={ytQueueThumbClass}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-0.5 top-0.5 rounded bg-black/75 px-1 text-[10px] font-bold tabular-nums text-white">
              {index + 1}
            </span>
            <span className={ytQueueThumbRemoveClass}>
              <LuX className="text-[13px]" />
            </span>
          </button>
        ))}
      </div>

      <span className={ytQueueCountClass}>
        {t("queueCount", { count: queue.length })}
        {total > 0 ? ` · ${formatTotal(total)}` : ""}
      </span>

      <button type="button" onClick={onClear} className={ytQueueClearClass}>
        {t("clearQueue")}
      </button>

      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className={`${dashPrimaryButtonClass} shrink-0 rounded-full px-5 text-[13.5px] font-bold`}
      >
        {creating ? (
          <ImSpinner2 className="animate-spin text-[14px]" />
        ) : (
          <LuArrowRight className="text-[15px]" />
        )}
        {creating ? t("creatingRoom") : t("createRoom")}
      </button>
    </div>
  );
}

export default QueueBar;
