"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  resolvePlanScreenShareQuality,
  type PlanScreenShareQuality,
} from "@/utils/screenShareQuality";

/**
 * The capture ceiling this user's plan grants.
 *
 * The pricing and subscription pages have always rendered this number as a selling point —
 * `{quality} screen sharing` — while capture stayed pinned at 480p for everyone, so a paying
 * host was told 1080p and given 854x480. This is the read that closes that gap, and it is
 * deliberately the only place the entitlement is interpreted: capture sites should ask here
 * rather than reaching into the subscription slice and each deciding what a missing plan means.
 *
 * Resolves through `resolvePlanScreenShareQuality`, so an absent or still-loading
 * subscription fails closed to the most restrictive tier instead of the most generous.
 */
export const useScreenShareQuality = (): PlanScreenShareQuality =>
  useSelector((state: RootState) =>
    resolvePlanScreenShareQuality(state.subscription.subscription?.plan?.features)
  );
