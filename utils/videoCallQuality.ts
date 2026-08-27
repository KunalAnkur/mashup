/**
 * Capture limits for the camera in a video call.
 *
 * Flat for everyone, and deliberately not a plan feature. `screen_share_quality` is a thing
 * people buy; a call tile is not. This is a straight cost-and-smoothness decision that the
 * same numbers serve at every tier.
 *
 * The numbers come from where the video actually ends up: call tiles render at roughly
 * 112–200 CSS px wide (`CallTiles.tsx` sizes them `min-w-[112px] flex-[1_0_132px]`), so even
 * on a 2x display 320px of source is more than the tile can show. Left unconstrained — which
 * is what this was — Chrome hands back 640x480 or 1280x720 at 30fps, so every caller was
 * uploading several times the pixels their tile could display, and in a Couple room that
 * upload competes with the host's screen share for the same connection.
 *
 * 15fps rather than 30 because a talking head is the one thing that survives it. Motion
 * smoothness is what the watch-party video needs, and the call is not that.
 *
 * Both are `ideal` + `max`: `max` is what actually holds the line, and `ideal` keeps a camera
 * that only offers larger modes from being asked for something it cannot do at all.
 */
export const videoCallMaxWidth = 320;
export const videoCallMaxHeight = 180;
export const videoCallMaxFrameRate = 15;

export const videoCallVideoConstraints: MediaTrackConstraints = {
  width: { ideal: videoCallMaxWidth, max: videoCallMaxWidth },
  height: { ideal: videoCallMaxHeight, max: videoCallMaxHeight },
  frameRate: { ideal: videoCallMaxFrameRate, max: videoCallMaxFrameRate },
};
