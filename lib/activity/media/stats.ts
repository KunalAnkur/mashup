/**
 * Turning a `RTCStatsReport` into the handful of numbers that answer "why does this
 * look bad", and a game's quality request into what an encoder is told.
 *
 * Shared by both delivery modes. The Couple path reads its own peer connection; the
 * Crowd path reads the MediaSoup transport underneath its producer — different objects,
 * the same report format, and the same five questions worth asking of it.
 */

import type { MediaProfile, MediaStats } from "@movmash/arcade-client";
import type { VideoEncodeProfile } from "@/lib/webrtc/encoder";

export const EMPTY_STATS: MediaStats = {
  rttMs: null,
  bitrateBps: null,
  framesPerSecond: null,
  packetsLost: null,
  qualityLimitation: null,
  candidateType: null,
};

/** Flattens a report into the five numbers a stats overlay can act on. */
export function readLinkStats(report: RTCStatsReport | null | undefined): MediaStats {
  if (!report) return { ...EMPTY_STATS };

  const out = { ...EMPTY_STATS };
  report.forEach((entry: Record<string, unknown>) => {
    if (entry.type === "outbound-rtp" && entry.kind === "video") {
      out.framesPerSecond = num(entry.framesPerSecond);
      out.qualityLimitation = str(entry.qualityLimitationReason);
    }
    if (entry.type === "inbound-rtp" && entry.kind === "video") {
      out.packetsLost = num(entry.packetsLost);
      // A consumer has no outbound entry, so its frame rate comes from here instead.
      out.framesPerSecond ??= num(entry.framesPerSecond);
    }
    if (entry.type === "candidate-pair" && entry.state === "succeeded") {
      const rtt = num(entry.currentRoundTripTime);
      out.rttMs = rtt !== null ? Math.round(rtt * 1000) : null;
      out.bitrateBps = num(entry.availableOutgoingBitrate);
    }
    if (entry.type === "local-candidate" && out.candidateType === null) {
      out.candidateType = str(entry.candidateType);
    }
  });
  return out;
}

/**
 * The game asks in its own terms; the encoder is told in its own.
 *
 * Clamping lives here rather than in the game: what a plan allows and what this machine
 * can encode are platform concerns, and a game should not be able to ask its way past
 * either.
 */
export function toEncodeProfile(profile: MediaProfile): VideoEncodeProfile {
  return {
    maxBitrateBps: Math.min(Math.max(profile.maxBitrateBps, 250_000), 6_000_000),
    targetFps: Math.min(Math.max(profile.targetFps, 15), 60),
  };
}

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
