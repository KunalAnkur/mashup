"use client";

import { LuClock } from "react-icons/lu";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  playbackBlockedOverlayBodyClass,
  playbackBlockedOverlayClass,
  playbackBlockedOverlayIconClass,
  playbackBlockedOverlayTitleClass,
} from "@/components/UI/classTokens";

/**
 * Explains the stopped picture, in place, for as long as it is stopped.
 *
 * The modal already says this, but a viewer can dismiss it — deliberately, since upgrading
 * their own account would not unblock someone else's room. What they were left with was a
 * black rectangle and no reason for it, because the host's screen-share tracks are now
 * sending black frames rather than being paused mid-picture.
 *
 * Says the same thing the modal does, from the same keys, so the two can never drift into
 * telling a room two different stories about why it stopped.
 */
export interface PlaybackBlockedOverlayProps {
  /**
   * Which allowance ran out, in the words the person was actually spending it on.
   *
   * The same minutes, the same pool, the same event — but "watch time" is the wrong
   * phrase in front of somebody who was playing Contra, and "game paused" is the wrong
   * phrase in front of a film. One prop rather than a second component, so the two can
   * never drift into explaining the same stop differently.
   */
  variant?: "watch" | "play";
}

const PlaybackBlockedOverlay = ({ variant = "watch" }: PlaybackBlockedOverlayProps) => {
  const t = useTranslations("room");
  const isHost = useSelector((state: RootState) => state.room.host);
  const info = useSelector((state: RootState) => state.room.settings.playbackBlockedInfo);

  // `limit` is what both messages interpolate; without it there is no sentence to show.
  if (!info) return null;

  const group = variant === "play" ? "playLimit" : "watchLimit";

  return (
    <div className={playbackBlockedOverlayClass} role="status" aria-live="polite">
      <div className={playbackBlockedOverlayIconClass}>
        <LuClock size={20} />
      </div>
      <h3 className={playbackBlockedOverlayTitleClass}>
        {isHost ? t(`${group}.title`) : t(`${group}.viewerTitle`)}
      </h3>
      <p className={playbackBlockedOverlayBodyClass}>
        {isHost
          ? t(`${group}.message`, { limit: info.limit, planName: info.planName })
          : t(`${group}.viewerMessage`, { limit: info.limit })}
      </p>
    </div>
  );
};

export default PlaybackBlockedOverlay;
