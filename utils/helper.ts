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
// TODO: Need to work here to get good and proper stream for browser compatibility.
/**
 * Captures a MediaStream from a video element using canvas fallback (for Firefox compatibility)
 * @param videoElement - The HTML video element to capture from
 * @returns MediaStream with video and audio tracks, or null if capture fails
 */
export function captureStreamFromVideo(videoElement: HTMLVideoElement): MediaStream | null {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 1920;
        canvas.height = videoElement.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error("captureStreamFromVideo: Could not get 2d context from canvas");
            return null;
        }
        
        // Capture video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Get video stream from canvas (supported in Firefox)
        const canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Set up continuous frame capture using requestAnimationFrame
        let animationFrameId: number;
        const captureFrame = () => {
            if (videoElement.readyState >= 2 && !videoElement.paused) { // HAVE_CURRENT_DATA or higher
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(captureFrame);
        };
        captureFrame();
        
        // Try to capture audio from video element using AudioContext (Firefox)
        // Note: createMediaElementSource disconnects the video from its default audio output,
        // so we need to reconnect it to the destination to maintain audio playback
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaElementSource(videoElement);
            const destination = audioContext.createMediaStreamDestination();
            
            // Connect source to destination (for streaming) AND to audioContext.destination (for playback)
            source.connect(destination);
            source.connect(audioContext.destination); // Reconnect for playback
            
            // Combine canvas video stream with audio stream
            const audioTracks = destination.stream.getAudioTracks();
            audioTracks.forEach(track => {
                canvasStream.addTrack(track);
            });
            
            console.log("captureStreamFromVideo: Using canvas.captureStream() + AudioContext for Firefox (with audio)");
        } catch (audioError) {
            console.warn("captureStreamFromVideo: Could not capture audio, video only:", audioError);
            console.log("captureStreamFromVideo: Using canvas.captureStream() fallback for Firefox (video only)");
        }
        
        // Store cleanup function and canvas reference for cleanup
        (canvasStream as any)._cleanup = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
        (canvasStream as any)._canvas = canvas; // Keep canvas reference to prevent GC
        
        return canvasStream;
    } catch (error) {
        console.error("captureStreamFromVideo: Canvas fallback failed:", error);
        return null;
    }
}

export function getPlayerControlsConfig(url: string | string[] | SourceProps[] | MediaStream, host: boolean) {
    if (host) {
        if (typeof MediaStream !== "undefined" && url instanceof MediaStream) {
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
