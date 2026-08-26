"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useScreenShareQuality } from "./useScreenShareQuality";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackUpgradeClicked } from "@/lib/analytics/events";
import {
  clampScreenShareQuality,
  isScreenShareQualityAllowed,
  screenShareVideoConstraints,
  type ScreenShareQuality,
} from "@/utils/screenShareQuality";

export interface ScreenShareQualityControl {
  /** The quality in force: what the next capture requests, and what the picker marks selected. */
  quality: ScreenShareQuality;
  /** The plan's ceiling, which is what makes an option locked. */
  planQuality: ScreenShareQuality;
  select: (next: ScreenShareQuality) => void;
}

/**
 * Owns capture-quality selection for one surface.
 *
 * A hook rather than state inside the picker because the answer is needed by two different
 * things: the control that renders it, and the `captureTabStream` call that has to request
 * it. Both callers already have to hold it, so holding it here keeps the pair honest —
 * `/stream/screen` and the in-room panel behave identically because there is one
 * implementation, not two that drifted.
 *
 * @param stream The live screen capture, when there is one. A quality change re-constrains
 *   its video track in place instead of re-capturing, so the host keeps the tab they picked
 *   and a share that is already going out to the room is never interrupted.
 */
export const useScreenShareQualityControl = (
  stream: MediaStream | null
): ScreenShareQualityControl => {
  const router = useRouter();
  const tToast = useTranslations("toast");
  const planQuality = useScreenShareQuality();

  // `null` means "whatever the plan grants", which is not the same as pinning today's plan
  // value: the entitlement resolves a beat after mount, and a plan can change under a live
  // session. Clamping on every read keeps an earlier choice honest if the ceiling drops.
  const [requestedQuality, setRequestedQuality] = useState<ScreenShareQuality | null>(null);
  const quality = clampScreenShareQuality(requestedQuality ?? planQuality, planQuality);

  const select = useCallback(
    async (next: ScreenShareQuality) => {
      // A locked option is a live control, not a disabled one: it is the only place in this
      // flow that tells a free host a better stream exists, so the click has to lead somewhere.
      if (!isScreenShareQualityAllowed(next, planQuality)) {
        trackUpgradeClicked("screen_share_quality");
        router.push("/pricing");
        return;
      }

      if (next === quality) return;

      const videoTrack = stream?.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        // Nothing captured yet, or audio-only: the next capture picks this up.
        setRequestedQuality(next);
        return;
      }

      try {
        // The selection is only committed once the track has accepted it. Moving it first
        // would leave the control showing a quality the stream is not actually running at,
        // which on the one control whose job is rescuing a struggling stream is the worst
        // way to be wrong.
        await videoTrack.applyConstraints(screenShareVideoConstraints(next));
        setRequestedQuality(next);

        const settings = videoTrack.getSettings();
        console.log(
          `Screen share quality changed to ${next}`,
          `(${settings.width}x${settings.height}@${settings.frameRate})`
        );
      } catch (error) {
        console.error("Error applying screen share quality:", error);
        showError(
          tToast("screenShareQualityChangeFailed"),
          tToast("screenShareQualityUnchanged")
        );
      }
    },
    [planQuality, quality, router, stream, tToast]
  );

  return { quality, planQuality, select };
};
