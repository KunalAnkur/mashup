import { ControlComponents } from "@/components/VideoPlayer/Player";
import { RoomType } from "@/context/RoomContext";
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
} = {}): Promise<{ mediaStream: MediaStream | null, screenType: string | null }> {
    const { audioOnly = false, preferredDisplaySurface = 'tab' } = options;
    const browser = detectBrowser();

    try {
        // Check if getDisplayMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            console.error('captureTabStream: getDisplayMedia is not supported in this browser');
            return { mediaStream: null, screenType: null };
        }

        // Build constraints based on browser capabilities
        const constraints: MediaStreamConstraints = {
          video: audioOnly
            ? false
            : {
                width: { ideal: 854, max: 854 },
                height: { ideal: 480, max: 480 },
                frameRate: { ideal: 30, max: 30 },
              },
          audio: {
            autoGainControl: false,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 48000,
            sampleSize: 16,
          },
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
        const videoTrack = mediaStream.getVideoTracks()[0];
        const screenType = videoTrack?.getSettings()?.displaySurface as string | null;
        console.log("captureTabStream: Screen type:", screenType);
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

        return { mediaStream, screenType };
    } catch (error: any) {
        // Handle user cancellation gracefully
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
            console.log('captureTabStream: User cancelled or permission denied');
            return { mediaStream: null, screenType: null };
        }

        // Log other errors
        console.error('captureTabStream: Error capturing tab stream:', error);
        
        // Provide helpful error messages based on browser
        if (browser.isFirefox && error.name === 'NotSupportedError') {
            console.error('captureTabStream: Firefox may require HTTPS or specific permissions');
        }
        
        return { mediaStream: null, screenType: null };
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
    console.log(
      "captureStreamFromVideo: Using canvas fallback",
      {captureStream: extendedVideo.captureStream}
    );
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
    console.log(
      "captureStreamFromVideo: Using canvas fallback",
      {mozCaptureStream: extendedVideo.mozCaptureStream}
    );
    // // Fallback for Firefox: use mozCaptureStream (older Firefox)
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
        console.log("captureStreamFromVideo: Using canvas fallback", {
          canvasStream,
        });
        return canvasStream;
    } catch (error) {
        console.error("captureStreamFromVideo: Canvas fallback failed:", error);
        return null;
    }
}
type GetInitialPlayerStateProps = {
    url: string | string[] | SourceProps[] | MediaStream;
    roomType: RoomType;
    host: boolean;
    screenSharing: boolean;
    hostLeft: boolean;
    paused: boolean;
    focused: boolean;
}
// screenSharing: boolean = false, hostLeft: boolean = false, paused: boolean = false
export function getInitialPlayerState({ url, roomType, host, focused, screenSharing = false, hostLeft = false, paused = false }: GetInitialPlayerStateProps) {
    if (roomType === "sync") {
        // if ((url as string).includes('twitch.tv')) {
        //     return {
        //         playing: false,
        //         muted: false,
        //     };
        // }
        if ((url as string).includes('youtube.com')) {
            if (!host) {
                return {
                    playing: false,
                    muted: true,
                };
            }
        }
        return {
            playing: false,
            muted: false,
        };
    }
    if (roomType === "stream") {
        return {
          playing: host ? screenSharing : !paused,
          muted: host ? screenSharing : !focused,
        };
    }
    return {
        playing: false,
        muted: false,
    };
}

/**
 * Determines if seek pause/resume behavior should be disabled for a URL
 * @param url - The URL to check
 * @returns true if seek pause/resume should be disabled
 */
export function shouldDisableSeekPauseResume(url: string | string[] | SourceProps[] | MediaStream): boolean {
    if (typeof url === "string") {
        return url.includes('twitch.tv');
    }
    return false;
}

export function getPlayerControlsConfig(url: string | string[] | SourceProps[] | MediaStream, host: boolean, hostLeft: boolean = false) {
    if (host) {
        if (typeof MediaStream !== "undefined" && url instanceof MediaStream) {
          // url is MediaStream
          return {
            disableControls: [ControlComponents.PLAY],
            hideControls: [
              ControlComponents.PLAY,
              ControlComponents.PROGRESS,
              ControlComponents.DURATION,
              ControlComponents.HIDE_CONTROLS,
            ],
          };
        }
        if (typeof url === "string"){
            if (url.includes('twitch.tv')) {
                if (url.includes('videos')) {
                    return {
                        disableControls: [],
                        hideControls: [ControlComponents.OVERLAY],
                    };
                }
                return {
                  disableControls: [],
                  hideControls: [
                    ControlComponents.OVERLAY,
                    ControlComponents.PROGRESS,
                    ControlComponents.DURATION,
                    ControlComponents.HIDE_CONTROLS,
                  ],
                };
            }
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return {
                  disableControls: [],
                  hideControls: [],
                };
            }
        }
          return {
            disableControls: [],
            hideControls: [ControlComponents.HIDE_CONTROLS],
          };
    }

    if (typeof url === "string") {
        if (url.includes('twitch.tv')) {
            if (url.includes("videos")) {
              return {
                disableControls: [],
                hideControls: [ControlComponents.OVERLAY],
              };
            }
            // Twitch live stream
            return {
              disableControls: [ControlComponents.PLAY],
              hideControls: [
                ControlComponents.OVERLAY,
                ControlComponents.PLAY,
                ControlComponents.PROGRESS,
                ControlComponents.DURATION,
                ControlComponents.HIDE_CONTROLS,
              ],
            };
        }
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          return {
            disableControls: [
              ControlComponents.PLAY,
              ControlComponents.PROGRESS,
              ControlComponents.BROADCAST_SYNC
            ],
            hideControls: [],
          };
        }
      // url is a single string
      return {
        disableControls: hostLeft
          ? []
          : [ControlComponents.PLAY, ControlComponents.PROGRESS],
        hideControls: [ControlComponents.HIDE_CONTROLS],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "string") {
      // url is string[]
      return {
        disableControls: hostLeft
          ? []
          : [ControlComponents.PLAY, ControlComponents.PROGRESS],
        hideControls: [ControlComponents.HIDE_CONTROLS],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "object") {
      // url is SourceProps[]
      return {
        disableControls: [],
        hideControls: [ControlComponents.HIDE_CONTROLS],
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
          ControlComponents.HIDE_CONTROLS,
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
        ControlComponents.HIDE_CONTROLS,
      ],
    };
    
}

const createSilentAudioTrack = (): MediaStreamTrack => {
  const ctx = new AudioContext();
  const dst = ctx.createMediaStreamDestination();

  // Create a gain node set to 0 for complete silence
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0; // Zero gain = no sound output
  gainNode.connect(dst);

  // Create a silent buffer (filled with zeros by default)
  // Use a small buffer to minimize memory usage
  const buffer = ctx.createBuffer(1, 128, ctx.sampleRate);

  // Create a buffer source with the silent buffer
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true; // Loop the silent buffer to keep the track "live"
  source.connect(gainNode);
  source.start();

  const track = dst.stream.getAudioTracks()[0];
  track.enabled = true; // Track is enabled but produces silence (gain is 0)

  return track;
};
const createVideoTrack = (): MediaStreamTrack => {
  const canvas = document.createElement("canvas");
  canvas.width = 1; // Tiny resolution
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No context");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1, 1);

  // Very low frame rate - only 1 frame per second
  const stream = canvas.captureStream(1);
  return stream.getVideoTracks()[0];
};

export function getStreamTracks(stream: MediaStream) {
    const tracks: MediaStreamTrack[] = [];
    const videoTracks = stream.getVideoTracks()[0];
    const audioTracks = stream.getAudioTracks()[0];
    const hasVideoTrack = videoTracks && videoTracks.readyState === 'live';
    const hasAudioTrack = audioTracks && audioTracks.readyState === 'live';

    if (hasVideoTrack && hasAudioTrack) {
        tracks.push(videoTracks);
        tracks.push(audioTracks);
        return tracks;
    }

    if (hasVideoTrack && !hasAudioTrack) {
        tracks.push(videoTracks);
        tracks.push(createSilentAudioTrack());
        return tracks;
    }

    if (hasAudioTrack && !hasVideoTrack) {
        tracks.push(audioTracks);
        // tracks.push(createVideoTrack());
        return tracks;
    }

    if (!hasVideoTrack && !hasAudioTrack) {
        tracks.push(createSilentAudioTrack());
        // tracks.push(createVideoTrack());
        return tracks;
    }

    return tracks;
}
