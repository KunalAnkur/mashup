"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { CatalogEntry } from "@movmash/arcade-client";
import { LuLayoutGrid } from "react-icons/lu";

import Modal, { ModalHeader } from "@/components/UI/Modal";
import { ContentSelection } from "@/components/Panel/PlaylistTab/ContentSelection";
import { YouTubeBrowser } from "@/components/YouTube/YouTubeBrowser";
import { GameCard } from "@/components/Games/GameCard";
import { useGameGallery } from "@/components/Games/useGameGallery";
import { setUpgradeSubscriptionModal } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import { useScreenShareSupport } from "@/hooks";
import type { Playlist } from "@/types/storeTypes";
import type { YouTubeVideoCard } from "@/lib/store/api/youtubeApi";
import {
  gamePickerGridClass,
  roomContentModalPanelClass,
  roomContentPadBodyClass,
  roomContentTabActiveClass,
  roomContentTabBodyClass,
  roomContentTabClass,
  roomContentTabIdleClass,
  roomContentTabRowClass,
} from "@/components/UI/classTokens";

type TabKey = "own" | "youtube" | "games";

/**
 * Everything the room can play, without leaving what is already playing.
 *
 * The room could only ever be given content two ways before this: from the side panel's
 * toolbar, which is three small buttons and no browsing, or by leaving the room for
 * /youtube or /games — which opens a *new* room and abandons the one you were in with
 * your guests still in it. This is the way to change the plan mid-session.
 *
 * Tabs rather than one long scroll because the three are different shapes: browsing
 * YouTube is a grid plus a queue, games is a small gallery, and the rest are three
 * one-tap actions. Stacked, the tap targets people actually came for would be a scroll
 * away on a phone.
 *
 * Every tab hands its result to the same `onAddContent` the panel toolbar uses, so
 * nothing here invents a second path into the playlist — a video added here is a video
 * added there, and guests receive it by the same broadcast.
 */
export function RoomContentModal({
  open,
  onClose,
  onAddContent,
  onScreenShareStopped,
}: {
  open: boolean;
  onClose: () => void;
  onAddContent: (content: Playlist[], source: "file" | "url" | "screen" | "game") => void;
  onScreenShareStopped: (streamId: string) => void;
}) {
  const t = useTranslations("room");
  const tGames = useTranslations("games");
  const tYouTube = useTranslations("youtube");
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const { games } = useGameGallery();
  const canScreenShare = useScreenShareSupport();

  /**
   * Opens on the things you already have.
   *
   * Someone who came here to put a file on, paste a link or share their screen knows
   * exactly what they want before the modal opens — and a browse grid in front of that is
   * a tab to dismiss. YouTube, by contrast, is where you go when you do NOT know, so it
   * reads better as the second stop than the first. It also loads: landing on it fired a
   * trending request every single time the picker opened, whatever you came for.
   */
  const [tab, setTab] = useState<TabKey>("own");

  const tabs = useMemo(
    () => [
      { key: "own" as const, label: t("contentModalOwn") },
      { key: "youtube" as const, label: tYouTube("title") },
      { key: "games" as const, label: tGames("title") },
    ],
    [t, tGames, tYouTube],
  );

  /**
   * A queue of videos becomes playlist entries directly.
   *
   * The cards already carry the title, thumbnail and channel, so this never asks guardian
   * to resolve the links the way pasting a URL has to. `selected` is left false for every
   * one: something is already playing in this room, and adding to the queue must not yank
   * the room off it.
   */
  const handleAddVideos = (videos: YouTubeVideoCard[]) => {
    if (videos.length === 0) return;

    onAddContent(
      videos.map((video) => ({
        id: crypto.randomUUID(),
        type: "sync" as const,
        source: "url" as const,
        link: video.url,
        selected: false,
        onlyAudio: false,
        metadata: {
          title: video.title,
          thumbnail: video.thumbnail,
          author: video.channelTitle,
        },
      })),
      "url",
    );
    onClose();
  };

  // Same rules as the panel's game tile: locked games open the room's upgrade modal
  // rather than navigating a host out of a live room.
  const handlePickGame = (entry: CatalogEntry) => {
    if (!roomState.host || !roomState.roomId) return;

    if (entry.requiresUpgrade) {
      onClose();
      dispatch(setUpgradeSubscriptionModal({ open: true, context: "games" }));
      return;
    }

    onAddContent(
      [
        {
          id: crypto.randomUUID(),
          type: "activity",
          source: "game",
          link: entry.gameId,
          selected: true,
          onlyAudio: false,
          metadata: { title: entry.title },
        },
      ],
      "game",
    );
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} panelClassName={roomContentModalPanelClass}>
      <ModalHeader
        icon={<LuLayoutGrid size={18} />}
        title={t("contentModalTitle")}
        subtitle={t("contentModalSubtitle")}
        onClose={onClose}
      />

      <div className={roomContentTabRowClass}>
        {tabs.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={`${roomContentTabClass} ${
              tab === entry.key ? roomContentTabActiveClass : roomContentTabIdleClass
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "own" ? (
        <div className={roomContentPadBodyClass}>
          {/* The panel toolbar's own buttons, in its roomier layout. Same handlers, so
              adding a file here and adding one from the panel are the same act.
              ContentSelection drops Share Screen by itself where the capture API does not
              exist, which is every phone. */}
          <ContentSelection
            variant="hero"
            showGameOption={false}
            onAddContent={(content, source) => {
              onAddContent(content, source);
              // Files and URLs finish inside their own dialogs, so closing here would
              // pull the modal out from under them. Screen share is done the moment it
              // returns, and leaving the picker open over a live share is just in the way.
              if (source === "screen") onClose();
            }}
            onScreenShareStopped={onScreenShareStopped}
          />

          {!canScreenShare ? (
            <p className="mt-4 text-center text-[12px] leading-relaxed text-white/40">
              {t("contentModalNoScreenShare")}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "youtube" ? (
        <div className={roomContentTabBodyClass}>
          <YouTubeBrowser
            confirmLabel={t("contentModalAddToPlaylist")}
            busyLabel={tYouTube("creatingRoom")}
            onConfirm={handleAddVideos}
          />
        </div>
      ) : null}

      {tab === "games" ? (
        <div className={roomContentPadBodyClass}>
          {games.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/55">{tGames("empty")}</p>
          ) : (
            <div className={gamePickerGridClass}>
              {games.map((entry) => (
                <GameCard key={entry.gameId} entry={entry} onPlay={handlePickGame} />
              ))}
            </div>
          )}
        </div>
      ) : null}

    </Modal>
  );
}

export default RoomContentModal;
