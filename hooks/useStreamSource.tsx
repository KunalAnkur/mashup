import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Playlist } from "@/types/storeTypes";
import { StreamSource, createStreamSource, SourceType } from "@/utils/streamSource";
import { RootState } from "@/lib/store";
import { useSelector } from "react-redux";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import type ReactPlayer from "react-player";
import { useFileContext } from "@/context/FileContext";

/**
 * useStreamSource - The ONLY source-aware layer
 * 
 * This hook abstracts away the source type (file/url/screen) and provides:
 * - getStream(): MediaStream callback for MediaSoup (source-agnostic)
 * - playableSource: What to pass to the Player (URL string, file URL, or MediaStream)
 * - isSourceReady: Whether the source is ready to produce a stream
 * 
 * Usage:
 * ```tsx
 * const { getStream, playableSource, isSourceReady } = useStreamSource({ playerRef, isHost });
 * 
 * // Pass to useStream (MediaSoup doesn't know about sources)
 * const { ... } = useStream({ getStream, ... });
 * 
 * // Render player with playableSource
 * <Player url={playableSource} />
 * ```
 */

interface UseStreamSourceOptions {
    /** Reference to ReactPlayer - needed to capture stream from video element */
    playerRef: React.RefObject<ReactPlayer | null>;
    /** Whether this user is the host (determines if we need to produce streams) */
    isHost: boolean;
    /** Remote stream received from MediaSoup (for consumers) */
    remoteStream?: MediaStream | null;
}

interface UseStreamSourceReturn {
    /** 
     * Get MediaStream for MediaSoup - completely source-agnostic.
     * Host: returns captured stream from local source
     * Consumer: returns null (consumers don't produce)
     */
    getStream: () => MediaStream | null;

    /**
     * What to pass to the Player component:
     * - Host + file: blob URL
     * - Host + url: the URL string
     * - Host + screen: the screen MediaStream
     * - Consumer: the remote MediaStream
     */
    playableSource: string | MediaStream | null;

    /**
     * Whether the source is ready to produce a stream
     */
    isSourceReady: boolean;

    /**
     * Active playlist item (for reference)
     */
    activeItem: Playlist | null;

    /**
     * Whether we're in screen sharing mode
     */
    isScreenSharing: boolean;

    /**
     * Whether the stream has a video track (used to show/hide AudioVisualizer)
     * - Host: checks the captured stream from getStream()
     * - Consumer: checks the remoteStream
     */
    // hasVideoTrack: boolean;

    /**
     * Notify that video element is ready (call from onReady)
     */
    onVideoReady: () => void;

    /**
     * Notify that video track status has changed
     */
    // onStreamHasVideo: (hasVideoTrack: boolean) => void;
}

export function useStreamSource({
    playerRef,
    isHost,
    remoteStream,
}: UseStreamSourceOptions): UseStreamSourceReturn {
    const sourceRef = useRef<StreamSource | null>(null);
    const [isSourceReady, setIsSourceReady] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    // const [hasVideoTrack, setHasVideoTrack] = useState(true); // Default to true (assume video exists)

    // Redux state
    const playlist = useSelector((state: RootState) => state.room.playlist);
    const activeItem = useMemo(
        () => playlist.find((p) => p.selected) || null,
        [playlist]
    );

    // Contexts
    const { stream: screenStream } = useMediaStreamContext();
    const { files } = useFileContext();

    // Derived state
    const isScreenSharing = activeItem?.source === "screen" && screenStream !== null;

    /**
     * Get stream for MediaSoup (source-agnostic)
     */
    const getStream = useCallback((): MediaStream | null => {
        if (!isHost) return null; // Consumers don't produce

        // Screen sharing: return screen stream directly
        if (isScreenSharing && screenStream) {
            console.log("debug ==[useStreamSource] getStream: Returning screen stream");
            return screenStream;
        }

        // File/URL: capture from video element via source
        if (!sourceRef.current) {
            console.warn("debug ==[useStreamSource] getStream: sourceRef.current is null!");
            return null;
        }

        const stream = sourceRef.current.getStream();
        if (!stream) {
            console.warn("debug ==[useStreamSource] getStream: source.getStream() returned null");
        } else {
            console.log("debug ==[useStreamSource] getStream: Got stream with", stream.getTracks().length, "tracks");
        }
        return stream;
    }, [isHost, isScreenSharing, screenStream]);

    /**
     * Called when video element is ready
     */
    const onVideoReadyInternal = useCallback(() => {
        if (!isHost || !activeItem) return;

        const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        if (!video) return;

        // Create or update source
        const existingSource = sourceRef.current;
        if (existingSource && 'updateVideoElement' in existingSource) {
            (existingSource as any).updateVideoElement(video);
        } else {
            sourceRef.current?.cleanup();
            sourceRef.current = createStreamSource({
                source: activeItem.source,
                screenStream,
                videoElement: video,
            });
        }

        setIsSourceReady(sourceRef.current?.isReady() ?? false);
    }, [isHost, activeItem, screenStream, playerRef]);

    /**
     * Create file URL for file sources
     */
    useEffect(() => {
        if (!isHost || activeItem?.source !== "file") {
            setFileUrl(null);
            return;
        }

        const file = files.find((f) => f.id === activeItem.id);
        if (!file) {
            setFileUrl(null);
            return;
        }

        const url = URL.createObjectURL(file.file);
        setFileUrl(url);

        return () => {
            URL.revokeObjectURL(url);
            setFileUrl(null);
        };
    }, [isHost, activeItem?.id, activeItem?.source, files]);

    /**
     * Setup source when active item or screen stream changes
     */
    useEffect(() => {
        if (!activeItem || !isHost) return;

        // For screen source, create immediately (no video element needed)
        if (activeItem.source === "screen" && screenStream) {
            sourceRef.current?.cleanup();
            sourceRef.current = createStreamSource({
                source: "screen",
                screenStream,
            });
            setIsSourceReady(true);
            return;
        }

        // For file/url, source will be created in onVideoReady
        // Reset ready state until video is ready
        setIsSourceReady(false);
    }, [activeItem?.id, activeItem?.source, screenStream, isHost]);

    /**
     * Cleanup on unmount or when switching items
     */
    useEffect(() => {
        return () => {
            sourceRef.current?.cleanup();
            sourceRef.current = null;
        };
    }, [activeItem?.id]);

    /**
     * Determine what to pass to the Player
     */
    const playableSource = useMemo((): string | MediaStream | null => {
        // Consumer: use remote stream
        if (!isHost) {
            return remoteStream ?? null;
        }

        // Host
        if (!activeItem) return null;

        switch (activeItem.source) {
            case "screen":
                return screenStream ?? null;

            case "file":
                return fileUrl;

            case "url":
                return activeItem.link || null;

            default:
                return null;
        }
    }, [isHost, activeItem, screenStream, fileUrl, remoteStream]);

    /**
     * Check if stream has video track
     * - For host: check the stream from getStream() or screenStream
     * - For consumer: check the remoteStream whenever activeItem.id changes
     */
    // * commenting this below useeffect because we are anymore going to use from redux slice
    // useEffect(() => {
    //     if (!isHost) {
    //         // Consumer: check remoteStream whenever activeItem.id changes
    //         if (remoteStream) {
    //             // Add a small delay to ensure tracks are fully added after stream replacement
    //             const timeoutId = setTimeout(() => {
    //                 const videoTracks = remoteStream.getVideoTracks();
    //                 const audioTracks = remoteStream.getAudioTracks();
    //                 const hasVideo = videoTracks.length > 0;
                    
    //                 console.log("[useStreamSource] Consumer - Checking tracks (activeItem.id changed):", {
    //                     activeItemId: activeItem?.id,
    //                     hasVideo,
    //                     videoTracks: videoTracks.length,
    //                     audioTracks: audioTracks.length,
    //                     videoTrackIds: videoTracks.map(t => t.id),
    //                     audioTrackIds: audioTracks.map(t => t.id),
    //                 });
                    
    //                 setHasVideoTrack(hasVideo);
    //             }, 200); // Small delay to ensure tracks are added after stream replacement
                
    //             return () => {
    //                 clearTimeout(timeoutId);
    //             };
    //         } else {
    //             // No remote stream yet, default to true
    //             setHasVideoTrack(true);
    //         }
    //         return;
    //     }

    //     // Host: check based on source type
    //     if (isScreenSharing && screenStream) {
    //         // Screen sharing: check screenStream directly
    //         const hasVideo = screenStream.getVideoTracks().length > 0;
    //         setHasVideoTrack(hasVideo);
    //         console.log("[useStreamSource] Host screen - hasVideoTrack:", hasVideo, "video tracks:", screenStream.getVideoTracks().length);
    //     } else if (activeItem?.source === "file") {
    //         // For files, check the stream from getStream() if available
    //         const stream = getStream();
    //         if (stream) {
    //             const hasVideo = stream.getVideoTracks().length > 0;
    //             setHasVideoTrack(hasVideo);
    //             console.log("[useStreamSource] Host file stream - hasVideoTrack:", hasVideo, "video tracks:", stream.getVideoTracks().length);
    //         }
    //         // If no stream yet, will be updated in onVideoReady when video element is ready
    //     } else {
    //         // Default to true for other sources
    //         setHasVideoTrack(true);
    //     }
    // }, [isHost, remoteStream, getStream, isScreenSharing, screenStream, activeItem?.source, activeItem?.id, activeItem]);

    /**
     * Called when video element is ready - includes hasVideoTrack check
     */
    const onVideoReady = useCallback(() => {
        // Call the internal function to setup the source
        onVideoReadyInternal();
        
        if (!isHost) return;
        // * commenting this below useeffect because we are anymore going to use from redux slice
        // For file sources, check the video element dimensions
        // If it's a file and has no video dimensions, it's audio-only
        // if (activeItem?.source === "file") {
        //     const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        //     if (video) {
        //         const hasVideo = video.videoWidth > 0 && video.videoHeight > 0;
        //         setHasVideoTrack(hasVideo);
        //     }
        // } else if (activeItem?.source === "screen" && screenStream) {
        //     // For screen sharing, check the stream directly
        //     const hasVideo = screenStream.getVideoTracks().length > 0;
        //     setHasVideoTrack(hasVideo);
        // }
    }, [onVideoReadyInternal, isHost, activeItem?.source, playerRef, screenStream]);

    return {
        getStream,
        playableSource,
        isSourceReady,
        activeItem,
        isScreenSharing,
        // hasVideoTrack,
        onVideoReady,
        // onStreamHasVideo: setHasVideoTrack,
    };
}
