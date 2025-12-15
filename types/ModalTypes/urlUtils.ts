import ReactPlayer from "react-player";
import { platforms } from "@/constants/urlPlatforms";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";

/**
 * Normalizes certain URLs into forms that ReactPlayer can actually play.
 * Example: Wistia "watch" URLs -> Wistia embed URL using wmediaid.
 */
export const normalizeUrlForPlayer = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    // Wistia "watch" pages, e.g.
    // https://wistia.com/watch/video-strategy?wmediaid=ab9q6dsg3r
    // ReactPlayer expects: https://fast.wistia.net/embed/iframe/ab9q6dsg3r
    if (hostname.includes("wistia.com") && urlObj.pathname.startsWith("/watch")) {
      const mediaId = urlObj.searchParams.get("wmediaid");
      if (mediaId) {
        return `https://fast.wistia.net/embed/iframe/${mediaId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

export const detectPlatform = (url: string): string => {
  for (const platform of platforms) {
    if (
      platform.urlPatterns.length > 0 &&
      platform.urlPatterns.some((pattern) => pattern.test(url))
    ) {
      return platform.id;
    }
  }
  return "custom";
};

export const validateUrl = (
  url: string
): { valid: boolean; tooltip: string } => {
  const normalized = normalizeUrlForPlayer(url);

  if (!normalized.trim()) return { valid: false, tooltip: "Enter a URL" };
  if (!ReactPlayer.canPlay(normalized))
    return { valid: false, tooltip: "URL is not supported" };
  return { valid: true, tooltip: "" };
};

export const getUrlDisplayName = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return (
      urlObj.hostname +
      urlObj.pathname.slice(0, 15) +
      (urlObj.pathname.length > 15 ? "..." : "")
    );
  } catch {
    return url.slice(0, 25) + (url.length > 25 ? "..." : "");
  }
};

export const getPlatformById = (id: string): Platform | undefined =>
  platforms.find((p) => p.id === id);
