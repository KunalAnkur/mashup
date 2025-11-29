"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import type ReactPlayer from "react-player";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import { useVideoSync } from "@/hooks/useVideoSync";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const SyncPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const playerRef = useRef<ReactPlayer>(null);

    const [videoUrl, setVideoUrl] = useState("");
    const [hasVideoTrack, setHasVideoTrack] = useState<boolean | undefined>(true); // Default to true (hide visualizer)
    const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

    const {
        socket,
        onPlay,
        onPause,
        onSeeked,
        onReady: originalOnReady,
        isPlaying,
        joinRoom,
    } = useVideoSync({ playerRef, isHost: roomState.host });

    // Handle video ready to check dimensions for direct URLs
    const handleReady = useCallback(() => {
        originalOnReady();
        
        // Only check video dimensions for URLs that need verification (not video platforms)
        // Video platforms (YouTube, Vimeo, etc.) are assumed to have video
        if (typeof videoUrl === 'string' && helper.needsVideoCheck(videoUrl) && playerRef.current) {
            const videoElement = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
            if (videoElement) {
                const hasVideo = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
                
                // Update with delay to prevent flash
                if (delayTimerRef.current) {
                    clearTimeout(delayTimerRef.current);
                }
                if (hasVideo) {
                    setHasVideoTrack(true); // Immediately hide visualizer if video detected
                } else {
                    // Delay 100ms before showing visualizer (audio-only)
                    delayTimerRef.current = setTimeout(() => {
                        setHasVideoTrack(false);
                    }, 100);
                }
                
                console.log("SyncPlayer - Video ready - dimensions:", {
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                    hasVideo,
                    url: videoUrl
                });
            }
        } else if (typeof videoUrl === 'string' && helper.isVideoPlatform(videoUrl)) {
            // For video platforms, ensure hasVideoTrack stays true (no dimension check needed)
            setHasVideoTrack(true);
            console.log("SyncPlayer - Video platform detected, keeping hasVideoTrack=true:", videoUrl);
        }
    }, [originalOnReady, videoUrl]);

    useEffect(() => {
        const url = roomState.urls[roomState.selectedFileIndex];
        
        // Clear any pending delay timer
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
        }
        
        // Immediately hide visualizer on URL change
        setHasVideoTrack(true);
        
        if (url) {
            setVideoUrl(url);
            
            // Determine hasVideoTrack based on URL
            if (typeof url === 'string') {
                if (helper.isVideoPlatform(url)) {
                    // Video platforms (YouTube, Vimeo, etc.) definitely have video
                    // SoundCloud is also a platform but may be audio-only, will check on ready if needed
                    setHasVideoTrack(true);
                } else if (helper.needsVideoCheck(url)) {
                    // HLS, FLV, or direct URLs - need to check (will check on ready)
                    // Keep as true for now, will update on ready if audio-only
                } else {
                    // Unknown format - assume has video to be safe
                    setHasVideoTrack(true);
                }
            } else {
                // Non-string URL - assume has video
                setHasVideoTrack(true);
            }
        }
        
        return () => {
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current);
            }
        };
    }, [roomState.urls, roomState.selectedFileIndex]);

    useEffect(() => {
        if (socket && authState.isAuthenticated && roomState.roomId) {
            joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
        }
    }, [socket, authState.isAuthenticated, roomState.roomId, roomState.host]);

    return (
        <Player
            playerRef={playerRef}
            playing={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSeekEnd={onSeeked}
            onReady={handleReady}
            hasVideoTrack={hasVideoTrack}
            fullscreenTargetRef={fullscreenTargetRef}
            url={videoUrl}
            muted={false}
            disableControls={helper.getPlayerControlsConfig(videoUrl, roomState.host).disableControls}
            hideControls={helper.getPlayerControlsConfig(videoUrl, roomState.host).hideControls}
        >
            <PlayerOverlay />
        </Player>
    );
};

export default SyncPlayer;