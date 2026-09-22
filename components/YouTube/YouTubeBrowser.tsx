"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";

import { useTranslations } from "@/i18n/I18nProvider";
import {
  useGetCategoriesQuery,
  useGetTrendingQuery,
  useSearchVideosQuery,
  type YouTubeVideoCard,
} from "@/lib/store/api/youtubeApi";
import { VideoCard } from "./VideoCard";
import { QueueBar } from "./QueueBar";
import {
  ytChipActiveClass,
  ytChipClass,
  ytChipIdleClass,
  ytChipRowClass,
  ytEmptyClass,
  ytGridClass,
  ytSearchInputClass,
  ytSearchWrapClass,
  ytSectionHeadClass,
  ytSkeletonThumbClass,
} from "@/components/UI/classTokens";

/** Typing must not fire a search per keystroke at 101 quota units each. */
const SEARCH_DEBOUNCE_MS = 600;
const SKELETON_COUNT = 8;

/**
 * Browse YouTube and build a queue — the browsing half of /youtube, without the part
 * that decides what the queue is *for*.
 *
 * The page turns its queue into a new room; the in-room picker adds it to the playlist of
 * a room that already exists. Everything up to that point — trending, categories, the
 * debounced search, the queue and its strip — is identical, so it lives here and the
 * caller supplies only `onConfirm` and the word on the button.
 *
 * Deliberately additive: /youtube was left exactly as it was rather than rebuilt on top of
 * this. The duplication is a few lines of query wiring, which is cheaper than the risk of
 * reworking a page that already works.
 */
export function YouTubeBrowser({
  confirmLabel,
  busyLabel,
  busy = false,
  onConfirm,
}: {
  confirmLabel: string;
  busyLabel: string;
  busy?: boolean;
  onConfirm: (videos: YouTubeVideoCard[]) => void;
}) {
  const t = useTranslations("youtube");

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  /** In the order they were picked — that is the order they will play in. */
  const [queue, setQueue] = useState<YouTubeVideoCard[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(draft.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  const { data: categories } = useGetCategoriesQuery();

  const trending = useGetTrendingQuery(
    { categoryId },
    // Skipped entirely while searching, so switching back to browsing is instant from
    // RTK Query's own cache rather than another round trip.
    { skip: query.length > 0 },
  );
  const search = useSearchVideosQuery({ q: query }, { skip: query.length === 0 });

  const active = query ? search : trending;
  const videos = active.data?.items ?? [];

  const toggle = useCallback((video: YouTubeVideoCard) => {
    setQueue((current) =>
      current.some((item) => item.videoId === video.videoId)
        ? current.filter((item) => item.videoId !== video.videoId)
        : [...current, video],
    );
  }, []);

  const remove = useCallback((videoId: string) => {
    setQueue((current) => current.filter((item) => item.videoId !== videoId));
  }, []);

  /** Queue position, 1-based. 0 means "not queued" — see VideoCard. */
  const positionOf = useCallback(
    (videoId: string) => queue.findIndex((item) => item.videoId === videoId) + 1,
    [queue],
  );

  const chips = useMemo(
    () => [{ id: "", title: t("all") }, ...(categories ?? [])],
    [categories, t],
  );

  const handleConfirm = useCallback(() => {
    if (queue.length === 0 || busy) return;
    onConfirm(queue);
    setQueue([]);
  }, [queue, busy, onConfirm]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-2 pt-1">
        <div className={ytSearchWrapClass}>
          <LuSearch className="shrink-0 text-[16px] text-white/38" />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className={ytSearchInputClass}
          />
          {draft ? (
            <button
              type="button"
              onClick={() => setDraft("")}
              aria-label={t("clearSearch")}
              className="shrink-0 text-white/38 transition-colors hover:text-white/70"
            >
              <LuX className="text-[15px]" />
            </button>
          ) : null}
        </div>

        {/* Categories filter trending, not search — YouTube's own search has no category
            facet either, and pretending otherwise would return the same results with a
            chip highlighted. */}
        {!query && chips.length > 1 ? (
          <div className={`${ytChipRowClass} mt-2`}>
            {chips.map((chip) => (
              <button
                key={chip.id || "all"}
                type="button"
                onClick={() => setCategoryId(chip.id)}
                className={`${ytChipClass} ${
                  categoryId === chip.id ? ytChipActiveClass : ytChipIdleClass
                }`}
              >
                {chip.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        {active.isLoading || active.isFetching ? (
          <div className={ytGridClass}>
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className={ytSkeletonThumbClass} />
                <div className="mt-3 flex gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.05]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full rounded bg-white/[0.05]" />
                    <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : active.isError ? (
          <p className={ytEmptyClass}>
            {/* 429 is the shared daily search budget running out, which is a different
                thing from YouTube being down and deserves a different sentence. */}
            {(active.error as { status?: number })?.status === 429
              ? t("searchUnavailable")
              : t("loadFailed")}
          </p>
        ) : videos.length === 0 ? (
          <p className={ytEmptyClass}>{query ? t("noResults", { query }) : t("empty")}</p>
        ) : (
          <>
            <h2 className={ytSectionHeadClass}>
              {query ? t("resultsFor", { query }) : t("trending")}
            </h2>
            <div className={ytGridClass}>
              {videos.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  onToggle={toggle}
                  position={positionOf(video.videoId)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <QueueBar
        queue={queue}
        onRemove={remove}
        onClear={() => setQueue([])}
        onCreate={handleConfirm}
        creating={busy}
        confirmLabel={confirmLabel}
        busyLabel={busyLabel}
      />
    </div>
  );
}

export default YouTubeBrowser;
