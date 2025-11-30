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
/**
 * Detects the current browser
 * @returns Object with browser information
 */
export function detectBrowser(): { name: string; version: number; isChrome: boolean; isFirefox: boolean; isSafari: boolean; isEdge: boolean } {
    const ua = navigator.userAgent;
    let name = 'unknown';
    let version = 0;
    let isChrome = false;
    let isFirefox = false;
    let isSafari = false;
    let isEdge = false;

    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
        name = 'chrome';
        isChrome = true;
        const match = ua.match(/Chrome\/(\d+)/);
        version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('Firefox')) {
        name = 'firefox';
        isFirefox = true;
        const match = ua.match(/Firefox\/(\d+)/);
        version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        name = 'safari';
        isSafari = true;
        const match = ua.match(/Version\/(\d+)/);
        version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('Edg')) {
        name = 'edge';
        isEdge = true;
        const match = ua.match(/Edg\/(\d+)/);
        version = match ? parseInt(match[1]) : 0;
    }

    return { name, version, isChrome, isFirefox, isSafari, isEdge };
}

/**
 * Captures a MediaStream from a browser tab with video and audio (cross-browser compatible)
 * @param options - Configuration options for tab capture
 * @param options.audioOnly - If true, only capture audio (video tracks will be removed)
 * @param options.preferredDisplaySurface - Preferred surface to capture ('tab', 'window', 'screen')
 * @returns Promise that resolves to MediaStream or null if capture fails
 */
export async function captureTabStream(options: {
    audioOnly?: boolean;
    preferredDisplaySurface?: 'tab' | 'window' | 'screen';
} = {}): Promise<MediaStream | null> {
    const { audioOnly = false, preferredDisplaySurface = 'tab' } = options;
    const browser = detectBrowser();

    try {
        // Check if getDisplayMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            console.error('captureTabStream: getDisplayMedia is not supported in this browser');
            return null;
        }

        // Build constraints based on browser capabilities
        const constraints: MediaStreamConstraints = {
            video: audioOnly ? false : {
                width: { ideal: 854, max: 854 },
                height: { ideal: 480, max: 480 },
                frameRate: { ideal: 30, max: 30 },
            },
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            }
        };

        // Browser-specific constraint adjustments
        if (!audioOnly && constraints.video && typeof constraints.video === 'object') {
            // Chrome/Edge: Support displaySurface constraint
            if (browser.isChrome || browser.isEdge) {
                (constraints.video as any).displaySurface = preferredDisplaySurface;
            }
            
            // Firefox: May not support displaySurface, but we can try
            if (browser.isFirefox && browser.version >= 66) {
                try {
                    (constraints.video as any).displaySurface = preferredDisplaySurface;
                } catch (e) {
                    // Firefox may not support this constraint
                    console.log('captureTabStream: displaySurface constraint not supported in Firefox');
                }
            }
        }

        // Chrome-specific audio constraints (may not work in other browsers)
        if (browser.isChrome && constraints.audio && typeof constraints.audio === 'object') {
            (constraints.audio as any).googEchoCancellation = false;
            (constraints.audio as any).googNoiseSuppression = false;
            (constraints.audio as any).googAutoGainControl = false;
            (constraints.audio as any).googHighpassFilter = false;
            (constraints.audio as any).googTypingNoiseDetection = false;
            (constraints.audio as any).googAudioMirroring = false;
        }

        console.log(`captureTabStream: Requesting stream (browser: ${browser.name}, audioOnly: ${audioOnly})`);
        
        // Request the stream
        const mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);

        // Post-processing based on browser and options
        if (audioOnly) {
            // Remove video tracks if audio-only mode
            const videoTracks = mediaStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.stop();
                mediaStream.removeTrack(track);
            });
            console.log('captureTabStream: Removed video tracks for audio-only mode');
        }

        // Optimize audio tracks (browser-specific)
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks.forEach(track => {
                // Apply audio quality constraints
                const audioConstraints: any = {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                };

                // Try to apply constraints (may not work in all browsers)
                track.applyConstraints(audioConstraints).then(() => {
                    console.log('captureTabStream: Audio constraints applied successfully');
                    
                    // Try advanced constraints (sampleRate, channelCount) - may not be supported
                    if (browser.isChrome || browser.isEdge) {
                        try {
                            track.applyConstraints({
                                sampleRate: 48000,
                                channelCount: 2,
                            } as any).then(() => {
                                console.log('captureTabStream: Advanced audio constraints applied');
                            }).catch(() => {
                                // Advanced constraints not supported, that's okay
                            });
                        } catch (e) {
                            // Not supported
                        }
                    }
                }).catch(err => {
                    console.warn('captureTabStream: Could not apply audio constraints:', err);
                });
            });
        }

        // Verify we got the expected tracks
        const finalVideoTracks = mediaStream.getVideoTracks();
        const finalAudioTracks = mediaStream.getAudioTracks();
        
        console.log(`captureTabStream: Stream captured successfully`, {
            browser: browser.name,
            videoTracks: finalVideoTracks.length,
            audioTracks: finalAudioTracks.length,
            audioOnly,
            displaySurface: finalVideoTracks[0]?.getSettings()?.displaySurface || 'unknown'
        });

        // Browser-specific validation
        if (browser.isFirefox) {
            // Firefox: Check if we actually got audio (Firefox may not capture tab audio in some cases)
            if (!audioOnly && finalAudioTracks.length === 0) {
                console.warn('captureTabStream: Firefox - No audio tracks captured. User may need to select "Share tab audio" in the browser dialog.');
            }
        }

        if (browser.isSafari) {
            // Safari: Audio capture may have limitations
            if (finalAudioTracks.length === 0 && !audioOnly) {
                console.warn('captureTabStream: Safari - No audio tracks captured. Safari may require specific permissions.');
            }
        }

        return mediaStream;
    } catch (error: any) {
        // Handle user cancellation gracefully
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
            console.log('captureTabStream: User cancelled or permission denied');
            return null;
        }

        // Log other errors
        console.error('captureTabStream: Error capturing tab stream:', error);
        
        // Provide helpful error messages based on browser
        if (browser.isFirefox && error.name === 'NotSupportedError') {
            console.error('captureTabStream: Firefox may require HTTPS or specific permissions');
        }
        
        return null;
    }
}

// Extended type for video element with browser-specific capture methods
interface ExtendedVideoElement extends HTMLVideoElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
}

// TODO: Need to work here to get good and proper stream for browser compatibility.
/**
 * Captures a MediaStream from a video element using native methods first, then canvas fallback (for Firefox compatibility)
 * @param videoElement - The HTML video element to capture from
 * @returns MediaStream with video and audio tracks, or null if capture fails
 */
export function captureStreamFromVideo(videoElement: HTMLVideoElement): MediaStream | null {
    // Cast to extended type to access browser-specific methods
    const extendedVideo = videoElement as ExtendedVideoElement;
    
    // Try native captureStream first (Chrome/Edge/Safari)
    if (extendedVideo.captureStream) {
        try {
            const stream = extendedVideo.captureStream();
            console.log("captureStreamFromVideo: Using native captureStream()");
            return stream;
        } catch (error) {
            console.warn("captureStreamFromVideo: captureStream() failed:", error);
        }
    }
    
    // Fallback for Firefox: use mozCaptureStream (older Firefox)
    if (extendedVideo.mozCaptureStream) {
        try {
            const stream = extendedVideo.mozCaptureStream();
            console.log("captureStreamFromVideo: Using mozCaptureStream()");
            return stream;
        } catch (error) {
            console.warn("captureStreamFromVideo: mozCaptureStream() failed:", error);
        }
    }
    
    // Final fallback: Use canvas to capture video frames (works in Firefox)
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
