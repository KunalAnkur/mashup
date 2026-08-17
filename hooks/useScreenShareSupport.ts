"use client";

import { useEffect, useState } from "react";
import { helper } from "@/utils";

/**
 * Screen-share availability: `true`, `false`, or `null` while it is still unknown.
 *
 * The check behind it reads `navigator`, which the server does not have, so resolving it
 * during render would make the server's markup and the client's first render disagree on
 * every mobile device — React answers that by throwing the subtree away and rebuilding it.
 * The `null` first render keeps both sides identical and is deliberately distinct from
 * `false`: hiding an entry point costs nothing while unknown, but a whole page telling
 * someone their browser can't screen share is worth waiting one frame to be sure of.
 */
export const useScreenShareSupport = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSupported(helper.isScreenShareSupported());
  }, []);

  return isSupported;
};
