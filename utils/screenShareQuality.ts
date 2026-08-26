import type { SubscriptionFeatures } from "@/types/subscriptionTypes";

/**
 * What a screen capture is allowed to be.
 *
 * Every value except `source` caps the capture at that height. `source` asks for no
 * downscale at all and takes the picked tab, window, or display exactly as it is.
 */
export type ScreenShareQuality = "480p" | "720p" | "1080p" | "4k" | "source";

/**
 * The subset guardian stores per plan in `subscription_plans.features`.
 *
 * Deliberately narrower than `ScreenShareQuality`: no plan sells `source`, and `480p` is a
 * manual step-down for a struggling connection rather than something a plan grants.
 */
export type PlanScreenShareQuality = SubscriptionFeatures["screen_share_quality"];

/**
 * Capture ceilings, keyed by the label the rest of the app passes around.
 *
 * `max` is what actually holds the line; `ideal` is paired with it so a smaller source — a
 * half-width window, a portrait phone mirror — is never asked to stretch up to meet it.
 */
export const screenShareResolutions: Record<
    Exclude<ScreenShareQuality, "source">,
    { width: number; height: number }
> = {
    "480p": { width: 854, height: 480 },
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
    "4k": { width: 3840, height: 2160 },
};

/**
 * Frame rate holds at the 30 this has always captured at, for every preset including
 * `source`. Raising it is a separate decision from raising resolution: `useStream` produces
 * a single encoding with no simulcast, so 60fps would arrive at every viewer at once with
 * no lower layer for anyone who cannot carry it.
 */
export const screenShareFrameRate = 30;

/** Lowest to highest. `source` sits above `4k` because it has no ceiling at all. */
export const screenShareQualityOrder: ScreenShareQuality[] = [
    "480p",
    "720p",
    "1080p",
    "4k",
    "source",
];

/**
 * Where quality lands when the plan cannot be read — a subscription still loading, or a
 * plan row that predates the field. It mirrors guardian's `DEFAULT_FEATURES`, which fails
 * closed to the most restrictive tier for the same reason: handing a paid ceiling to
 * someone whose entitlement we could not read is the worse of the two mistakes.
 */
export const fallbackScreenShareQuality: PlanScreenShareQuality = "720p";

const isPlanScreenShareQuality = (value: unknown): value is PlanScreenShareQuality =>
    value === "720p" || value === "1080p" || value === "4k";

/**
 * The ceiling a plan grants. Takes the raw features object because it is fed straight from
 * an API response, where the field can be missing or a string this build does not know.
 */
export function resolvePlanScreenShareQuality(
    features?: Partial<SubscriptionFeatures> | null
): PlanScreenShareQuality {
    const quality = features?.screen_share_quality;
    return isPlanScreenShareQuality(quality) ? quality : fallbackScreenShareQuality;
}

/**
 * Holds a requested quality to what the plan allows. Stepping *down* is always permitted —
 * a host on a bad connection choosing 480p is not something entitlement should block.
 */
export function clampScreenShareQuality(
    requested: ScreenShareQuality,
    allowed: ScreenShareQuality
): ScreenShareQuality {
    return screenShareQualityOrder.indexOf(requested) <= screenShareQualityOrder.indexOf(allowed)
        ? requested
        : allowed;
}

/**
 * Every quality the picker puts on screen, for every user — the ones above a viewer's plan
 * included, shown locked rather than hidden. A ceiling nobody can see is a ceiling nobody
 * knows they could raise.
 *
 * Stops at `1080p` because that is the highest any plan currently sells (guardian's
 * `seed-subscription-plans.ts`: 720p free, 1080p on Couple and Crowd). `4k` and `source` are
 * defined but deliberately absent — offering an upgrade that no amount of money unlocks is
 * worse than not offering it, and `source` additionally waits on simulcast. Extend this list
 * the day a plan grants them, not before.
 */
export const offeredScreenShareQualities: ScreenShareQuality[] = ["480p", "720p", "1080p"];

/**
 * Whether an entitlement reaches a given quality. Anything at or below the plan's ceiling is
 * allowed — stepping down is never gated, since the host whose connection cannot carry the
 * default needs the way down more than anyone needs the way up.
 */
export function isScreenShareQualityAllowed(
    quality: ScreenShareQuality,
    allowed: ScreenShareQuality
): boolean {
    const limit = screenShareQualityOrder.indexOf(allowed);
    const wanted = screenShareQualityOrder.indexOf(quality);
    if (limit < 0 || wanted < 0) return false;
    return wanted <= limit;
}

/**
 * The `video` half of a `getDisplayMedia` request for a given quality.
 */
export function screenShareVideoConstraints(quality: ScreenShareQuality): MediaTrackConstraints {
    const frameRate = { ideal: screenShareFrameRate, max: screenShareFrameRate };

    // Any width/height here is a downscale instruction, and the whole point of `source` is
    // that there is not one — so it sends none rather than sending a very large number.
    if (quality === "source") {
        return { frameRate };
    }

    const { width, height } = screenShareResolutions[quality];
    return {
        width: { ideal: width, max: width },
        height: { ideal: height, max: height },
        frameRate,
    };
}
