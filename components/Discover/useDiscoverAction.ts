"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "@/lib/store";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import { useGetUrlMetadataMutation } from "@/lib/store/api/urlApi";
import { useOpenActivityRoom } from "@/components/Activity/useOpenActivityRoom";
import { trackDiscoverSlideClicked } from "@/lib/analytics";
import { isBoosted, type DiscoverSlide } from "@/lib/discover";

/**
 * What pressing a slide does.
 *
 * One case per action kind, and nothing else in the carousel knows there is more than
 * one kind. Adding a source to the CMS is a case here — the card, the feed and the sort
 * are all untouched by it.
 *
 * Neither room-opening path is new. Both end where `/sync`, `/stream` and the games
 * gallery end: a playlist in the store and `refer` set, after which `AuthGuard` creates
 * the room and navigates. That is what buys the sign-in redirect, the guest prompt and
 * persistence without writing any of them again.
 */
export function useDiscoverAction() {
  const router = useRouter();
  const dispatch = useDispatch();
  const openActivityRoom = useOpenActivityRoom();
  const [getUrlMetadata] = useGetUrlMetadataMutation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  /** The slide currently opening a room, so its button can say so. */
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (slide: DiscoverSlide, position: number) => {
      if (pending) return;

      trackDiscoverSlideClicked({
        slideId: slide.id,
        category: slide.category,
        position,
        action: slide.action.kind,
        boosted: isBoosted(slide),
      });

      switch (slide.action.kind) {
        case "game":
          setPending(slide.id);
          openActivityRoom(slide.action.gameId);
          return;

        case "watch": {
          setPending(slide.id);
          try {
            // Guardian normalises the link and expands a playlist into its videos, so a
            // playlist slide opens a room with the whole list in it, in order — exactly
            // what pasting the same link into /sync does today.
            const items = await getUrlMetadata(slide.action.url).unwrap();
            const entries = items.length > 0 ? items : [{ url: slide.action.url }];

            dispatch(
              setPlaylist(
                entries.map((item, index) => ({
                  id: crypto.randomUUID(),
                  type: "sync" as const,
                  source: "url" as const,
                  link: item.url,
                  selected: index === 0,
                  onlyAudio: false,
                  metadata: {
                    ...(item.title ? { title: item.title } : {}),
                    ...(item.description ? { description: item.description } : {}),
                    ...(item.thumbnail ? { thumbnail: item.thumbnail } : {}),
                    ...(item.author ? { author: item.author } : {}),
                  },
                })),
              ),
            );
            dispatch(setRefers({ refer: true }));

            if (!isAuthenticated) router.push("/login");
            // Authenticated: AuthGuard creates the room and navigates.
          } catch {
            // The link is the one thing we can still honour when guardian is unreachable:
            // send them to /sync with nothing lost rather than failing in place.
            setPending(null);
            router.push("/sync");
          }
          return;
        }

        case "link": {
          const { href, external } = slide.action;
          if (external) window.open(href, "_blank", "noopener,noreferrer");
          else router.push(href);
          return;
        }
      }
    },
    [pending, openActivityRoom, getUrlMetadata, dispatch, isAuthenticated, router],
  );

  return { run, pending };
}
