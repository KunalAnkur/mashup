/**
 * Telling WebRTC that it is carrying a game, not a film.
 *
 * Every default in this stack is tuned for video calls and video playback, and almost
 * every one of them is wrong for pixel art at 60fps. Nothing here is a micro-
 * optimisation: with the defaults left alone the picture is soft, the frame rate halves
 * under load, and the audio has its tail cut off.
 *
 * There was no encoder tuning anywhere in this codebase before — no `contentHint`, no
 * `setParameters`, no codec preferences — so none of this displaces existing behaviour.
 */

/** What `useStream`'s movie path and this one both need to agree on. */
export const NES_CAPTURE_FPS = 60;

export interface VideoEncodeProfile {
  /** Hard ceiling. Absurdly generous for a tiny frame, which is exactly the point. */
  maxBitrateBps: number;
  targetFps: number;
}

/**
 * Mark the track as motion-critical.
 *
 * `contentHint` is the one signal the encoder takes before it has any statistics. For
 * `motion` it keeps the frame rate and spends resolution; `detail` does the reverse.
 * A game wants the former — dropped frames are felt immediately, a slightly softer
 * sprite is not.
 */
export function hintGameVideo(track: MediaStreamTrack): void {
  track.contentHint = "motion";
}

/**
 * The single most consequential call in this file.
 *
 * `degradationPreference` defaults to `balanced`, which quietly drops a 60fps game to
 * around 20fps on a congested link. A film at 20fps still reads as a film; a game at
 * 20fps is unplayable. `maintain-framerate` tells the encoder to give up resolution
 * first — and at 512x480 there is very little resolution to give up, so in practice it
 * simply holds the line.
 *
 * `scaleResolutionDownBy: 1` stops the bandwidth estimator shrinking the picture behind
 * our backs, which at this size would be visible instantly.
 */
export async function tuneGameVideoSender(
  sender: RTCRtpSender,
  profile: VideoEncodeProfile,
): Promise<void> {
  const params = sender.getParameters();

  // A sender that has not negotiated yet has no encodings. Give it one rather than
  // silently doing nothing — this is called right after `addTrack`, where that happens.
  if (!params.encodings || params.encodings.length === 0) {
    params.encodings = [{}];
  }

  params.degradationPreference = "maintain-framerate";
  params.encodings[0] = {
    ...params.encodings[0],
    active: true,
    maxBitrate: profile.maxBitrateBps,
    maxFramerate: profile.targetFps,
    scaleResolutionDownBy: 1,
    networkPriority: "high",
    priority: "high",
  };

  await sender.setParameters(params);
}

/**
 * Prefer codecs in the order that suits tiny, sharp, fast pictures.
 *
 *  1. VP9  — best detail per bit, software encoder, no surprises at small frame sizes
 *  2. VP8  — universal fallback
 *  3. H.264 — last. Hardware encoders can behave badly at frame sizes that are not
 *     macroblock-aligned, and some silently refuse 60fps
 *
 * Feature-detected against what this browser actually offers, and a no-op where
 * `setCodecPreferences` does not exist. Ordering a codec that is not there is a
 * `InvalidAccessError`, not a graceful degradation, so the list is filtered first.
 */
export function preferGameCodecs(transceiver: RTCRtpTransceiver): void {
  if (typeof transceiver.setCodecPreferences !== "function") return;

  const supported = RTCRtpSender.getCapabilities?.("video")?.codecs;
  if (!supported || supported.length === 0) return;

  const rank = (mime: string): number => {
    const name = mime.toLowerCase();
    if (name.endsWith("vp9")) return 0;
    if (name.endsWith("vp8")) return 1;
    if (name.endsWith("h264")) return 2;
    return 3;
  };

  const ordered = [...supported].sort((a, b) => rank(a.mimeType) - rank(b.mimeType));

  try {
    transceiver.setCodecPreferences(ordered);
  } catch {
    // A browser that refuses the list keeps its own order. Not worth failing over.
  }
}

/**
 * Stop the receiver buffering for smoothness we do not want.
 *
 * The default jitter buffer adds tens to hundreds of milliseconds of deliberate delay
 * so that playback is even. That is right for a film and wrong for something a person
 * is controlling — every millisecond here is added to the input latency budget.
 *
 * Two spellings because browsers are mid-migration: `jitterBufferTarget` is the
 * standard one, `playoutDelayHint` the older Chrome-only property.
 */
export function minimiseReceiverDelay(receiver: RTCRtpReceiver): void {
  const target = receiver as RTCRtpReceiver & {
    jitterBufferTarget?: number | null;
    playoutDelayHint?: number | null;
  };
  try {
    target.jitterBufferTarget = 0;
  } catch {
    /* not supported here */
  }
  try {
    target.playoutDelayHint = 0;
  } catch {
    /* not supported here */
  }
}

/**
 * Capture constraints for the APU's output.
 *
 * All three processors **off**. They exist to make a human voice intelligible and they
 * do it by assuming their input is a human voice: echo cancellation subtracts what it
 * thinks is feedback, noise suppression treats sustained tones as noise, and automatic
 * gain rides over the dynamics chiptune is made of. On game audio the result is audibly
 * wrong.
 */
export const GAME_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 2,
};

/**
 * Persuade Opus to carry stereo music rather than mono speech.
 *
 * The defaults negotiated for a call are mono, low bitrate, and — the one that actually
 * damages this — discontinuous transmission, which stops sending during what it judges
 * to be silence. A sustained chiptune note is exactly what that misjudges, so notes
 * lose their tails.
 *
 * SDP munging is unpleasant and browsers are gradually replacing it with
 * `setParameters`. Until then this is the only way to say it, so it is contained to one
 * function and applied to the local description only.
 */
export function tuneOpusForMusic(sdp: string): string {
  const wanted = [
    "stereo=1",
    "sprop-stereo=1",
    "maxaveragebitrate=128000",
    "useinbandfec=1",
    "usedtx=0",
  ];

  // Find Opus's payload type, then amend (or add) its fmtp line.
  const payload = /a=rtpmap:(\d+)\s+opus\/48000/i.exec(sdp)?.[1];
  if (!payload) return sdp;

  const fmtp = new RegExp(`a=fmtp:${payload} (.*)`);
  const existing = fmtp.exec(sdp);

  if (!existing) {
    return sdp.replace(
      new RegExp(`(a=rtpmap:${payload} opus/48000[^\\r\\n]*)`, "i"),
      `$1\r\na=fmtp:${payload} ${wanted.join(";")}`,
    );
  }

  // Keep whatever the browser asked for, override only the keys we care about.
  const keep = (existing[1] ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !wanted.some((w) => part.startsWith(`${w.split("=")[0]}=`)));

  return sdp.replace(fmtp, `a=fmtp:${payload} ${[...keep, ...wanted].join(";")}`);
}
