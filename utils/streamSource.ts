import { helper } from ".";

/**
 * StreamSource Interface
 * 
 * This is the ONLY abstraction that knows about source types.
 * Everything downstream (MediaSoup, Player) just sees a MediaStream.
 */
export interface StreamSource {
    /**
     * Returns a MediaStream for MediaSoup to transmit.
     * Called by useStream when it needs to produce/replace tracks.
     */
    getStream(): MediaStream | null;

    /**
     * Cleanup resources when source changes or component unmounts.
     */
    cleanup(): void;

    /**
     * Whether the source is ready to produce a stream.
     */
    isReady(): boolean;
}

/**
 * ScreenSource - for screen sharing via getDisplayMedia
 * 
 * The MediaStream is already provided externally (from MediaStreamContext).
 */
export class ScreenSource implements StreamSource {
    constructor(private stream: MediaStream) { }

    getStream(): MediaStream | null {
        if (!this.stream || this.stream.getTracks().every(t => t.readyState === 'ended')) {
            return null;
        }
        return this.stream;
    }

    isReady(): boolean {
        return !!this.stream && this.stream.getVideoTracks().some(t => t.readyState === 'live');
    }

    cleanup(): void {
        // Don't stop tracks here - MediaStreamContext manages the lifecycle
        // this.stream.getTracks().forEach((t) => t.stop());
    }
}

/**
 * FileSource - for local file playback
 * 
 * Captures stream from video element using captureStream().
 */
export class FileSource implements StreamSource {
    private videoElement: HTMLVideoElement | null = null;

    constructor(video: HTMLVideoElement) {
        this.videoElement = video;
    }

    getStream(): MediaStream | null {
        if (!this.videoElement) return null;
        return helper.captureStreamFromVideo(this.videoElement);
    }

    isReady(): boolean {
        if (!this.videoElement) return false;
        return this.videoElement.readyState >= 2; // HAVE_CURRENT_DATA
    }

    cleanup(): void {
        this.videoElement = null;
    }

    /**
     * Update the video element reference (when player re-renders)
     */
    updateVideoElement(video: HTMLVideoElement): void {
        this.videoElement = video;
    }
}

/**
 * UrlSource - for URL-based content (YouTube, HLS, etc.)
 * 
 * Similar to FileSource - captures from the underlying video element.
 * ReactPlayer handles the actual URL playback.
 */
export class UrlSource implements StreamSource {
    private videoElement: HTMLVideoElement | null = null;

    constructor(video?: HTMLVideoElement) {
        this.videoElement = video || null;
    }

    getStream(): MediaStream | null {
        if (!this.videoElement) return null;
        return helper.captureStreamFromVideo(this.videoElement);
    }

    isReady(): boolean {
        if (!this.videoElement) return false;
        return this.videoElement.readyState >= 2; // HAVE_CURRENT_DATA
    }

    cleanup(): void {
        this.videoElement = null;
    }

    /**
     * Update the video element reference (when player re-renders)
     */
    updateVideoElement(video: HTMLVideoElement): void {
        this.videoElement = video;
    }
}

/**
 * Factory function to create the appropriate source based on playlist item
 */
export type SourceType = "file" | "url" | "screen";

export interface CreateSourceOptions {
    source: SourceType;
    screenStream?: MediaStream | null;
    videoElement?: HTMLVideoElement | null;
}

export function createStreamSource(options: CreateSourceOptions): StreamSource | null {
    const { source, screenStream, videoElement } = options;

    switch (source) {
        case "screen":
            if (!screenStream) return null;
            return new ScreenSource(screenStream);

        case "file":
            if (!videoElement) return null;
            return new FileSource(videoElement);

        case "url":
            if (!videoElement) return null;
            return new UrlSource(videoElement);

        default:
            console.warn(`[StreamSource] Unknown source type: ${source}`);
            return null;
    }
}
