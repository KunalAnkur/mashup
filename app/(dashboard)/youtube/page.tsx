"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { LuSearch, LuX } from "react-icons/lu";

import { RootState } from "@/lib/store";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackCTAClicked } from "@/lib/analytics";
import {
  useGetCategoriesQuery,
  useGetTrendingQuery,
  useSearchVideosQuery,
  type YouTubeVideoCard,
} from "@/lib/store/api/youtubeApi";
import { VideoCard } from "@/components/YouTube/VideoCard";
import { QueueBar } from "@/components/YouTube/QueueBar";
import {
  appSectionTitleTextClass,
  dashPageContentWrapClass,
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
  ytToolbarClass,
  ytToolbarTitleWrapClass,
  ytToolbarTopRowClass,
} from "@/components/UI/classTokens";

/**
 * Browse YouTube, build a queue, open a room with it.
 *
 * Picking is a two-step on purpose. One click one room would mean a watch party can only
 * ever start with a single video, and the thing people actually want on a Friday night is
 * three trailers and a music video queued up. So a click adds to the queue, the queue is
 * visible and reorderable-by-removal at the foot of the page, and one button turns the
 * whole thing into a room.
 *
 * Trending first, also deliberately: an empty search box asks a question most people have
 * no answer to, and trending costs a single quota unit that every visitor in a region
 * shares through guardian's cache. Search is the expensive path — a hundred times the
 * cost — so it only runs when somebody actually submits one.
 */

/** Typing must not fire a search per keystroke at 101 quota units each. */
const SEARCH_DEBOUNCE_MS = 600;

const SKELETON_COUNT = 12;

/** Long enough for a slow room creation, short enough to still feel like a retry. */
const CREATE_TIMEOUT_MS = 12000;

export default function YouTubePage() {
  const t = useTranslations("youtube");
  const dispatch = useDispatch();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  /** In the order they were picked — that is the order they will play in. */
  const [queue, setQueue] = useState<YouTubeVideoCard[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(draft.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  /**
   * Let the button recover if the room never opens.
   *
   * Creating is a handoff — this page dispatches, `AuthGuard` builds the room and
   * navigates — so there is no promise here to catch. When that fails, nothing tells
   * this component, and without a floor the button sits on "Creating…" until the page
   * is reloaded. A retry the user can actually reach beats a spinner that never ends.
   */
  useEffect(() => {
    if (!creating) return;
    const timer = setTimeout(() => setCreating(false), CREATE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [creating]);

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

  /**
   * Turns the queue into a room.
   *
   * The cards already carry everything a playlist entry needs, so this never asks
   * guardian to resolve the links — it is the dispatch `/sync` makes after its metadata
   * lookup, minus the lookup. First in the queue is the one that starts playing.
   */
  const createRoom = useCallback(() => {
    if (queue.length === 0 || creating) return;
    setCreating(true);
    trackCTAClicked("sync", { source: "youtube_browse", count: queue.length });

    dispatch(
      setPlaylist(
        queue.map((video, index) => ({
          id: crypto.randomUUID(),
          type: "sync" as const,
          source: "url" as const,
          link: video.url,
          selected: index === 0,
          onlyAudio: false,
          metadata: {
            title: video.title,
            thumbnail: video.thumbnail,
            author: video.channelTitle,
          },
        })),
      ),
    );
    dispatch(setRefers({ refer: true }));

    if (!isAuthenticated) router.push("/login");
    // Authenticated: AuthGuard creates the room and navigates.
  }, [queue, creating, dispatch, isAuthenticated, router]);

  /** Queue position, 1-based. 0 means "not queued" — see VideoCard. */
  const positionOf = useCallback(
    (videoId: string) => queue.findIndex((item) => item.videoId === videoId) + 1,
    [queue],
  );

  const chips = useMemo(
    () => [{ id: "", title: t("all") }, ...(categories ?? [])],
    [categories, t],
  );

  return (
    <div className={dashPageContentWrapClass}>
      <div className={ytToolbarClass}>
        <div className={ytToolbarTopRowClass}>
          <div className={ytToolbarTitleWrapClass}>
            <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
          </div>

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
        </div>

        {/* Categories filter trending, not search — YouTube's own search has no category
            facet either, and pretending otherwise would return the same results with a
            chip highlighted. */}
        {!query && chips.length > 1 ? (
          <div className={ytChipRowClass}>
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

      <QueueBar
        queue={queue}
        onRemove={remove}
        onClear={() => setQueue([])}
        onCreate={createRoom}
        creating={creating}
      />
    </div>
  );
}
