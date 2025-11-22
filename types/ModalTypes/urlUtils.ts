import ReactPlayer from "react-player";
import { platforms } from "@/constants/urlPlatforms";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";

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
  if (!url.trim()) return { valid: false, tooltip: "Enter a URL" };
  if (!ReactPlayer.canPlay(url))
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
