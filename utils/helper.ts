import { ControlComponents } from "@/components/VideoPlayer/Player";
import { SourceProps } from "react-player/base";

/**
 * Detects if URL is from a video platform (definitely has video)
 * @param url - The URL to check
 * @returns true if URL is from a known video platform
 */
export function isVideoPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const videoPlatformPatterns = [
        /youtube\.com/i,
        /youtu\.be/i,
        /vimeo\.com/i,
        /dailymotion\.com/i,
        /facebook\.com/i,
        /fb\.watch/i,
        /twitch\.tv/i,
        /soundcloud\.com/i // SoundCloud is audio-only, but treat as platform
    ];
    
    return videoPlatformPatterns.some(pattern => pattern.test(url));
}

/**
 * Detects if URL needs video track checking (HLS, FLV, or direct CDN URLs)
 * @param url - The URL to check
 * @returns true if URL needs video track verification
 */
export function needsVideoCheck(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // If it's a video platform, assume it has video (except SoundCloud)
    if (isVideoPlatform(url)) {
        // SoundCloud is audio-only
        if (/soundcloud\.com/i.test(url)) {
            return true; // Need to check SoundCloud
        }
        return false; // Other platforms definitely have video
    }
    
    // Check for HLS, FLV, or direct URLs (https://...)
    const needsCheckPatterns = [
        /\.m3u8/i, // HLS
        /\.flv/i,  // FLV
        /^https?:\/\//i // Direct CDN URLs
    ];
    
    return needsCheckPatterns.some(pattern => pattern.test(url));
}

export function getPlayerControlsConfig(url: string | string[] | SourceProps[] | MediaStream, host: boolean) {
    if (host) {
        return {
          disableControls: [],
          hideControls: [],
        };
    }

    if (typeof url === "string") {
      // url is a single string
      return {
        disableControls: [ControlComponents.PLAY, ControlComponents.PROGRESS],
        hideControls: [],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "string") {
      // url is string[]
      return {
        disableControls: [],
        hideControls: [],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "object") {
      // url is SourceProps[]
      return {
        disableControls: [],
        hideControls: [],
      };
    } else if (
      typeof MediaStream !== "undefined" &&
      url instanceof MediaStream
    ) {
      // url is MediaStream
      return {
        disableControls: [ControlComponents.PLAY],
        hideControls: [
          ControlComponents.PLAY,
          ControlComponents.PROGRESS,
          ControlComponents.DURATION,
        ],
      };
    }
    return {
      disableControls: [],
      hideControls: [
        ControlComponents.PLAY,
        ControlComponents.PROGRESS,
        ControlComponents.OVERLAY,
        ControlComponents.DURATION,
      ],
    };
    
}
