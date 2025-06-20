"use client"
import { useSelector, useDispatch } from "react-redux";
import { Player } from "@/components/VideoPlayer";
import { use, useEffect, useRef, useState } from "react";
import type ReactPlayer from "react-player";
import { useFileContext } from "@/context/FileContext";
import { RootState } from "@/lib/store";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import { useVideoSync } from "@/hooks/useVideoSync";
import { setUrls } from "@/lib/store/slices/roomSlice";

type PlayerWrapperProps = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
}
const PlayerWrapper = ({ fullscreenTargetRef }: PlayerWrapperProps) => {
    const { files } = useFileContext();
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const playerRef = useRef<ReactPlayer>(null);
    const dispatch = useDispatch();
    // https://www.youtube.com/watch?v=KJwYBJMSbPI
    const [videoUrl, setVideoUrl] = useState<string>('');
    const {
        socket,
        onPlay,
        onPause,
        onSeeked,
        isPlaying,
        joinRoom,
    } = useVideoSync({ playerRef, isHost: roomState.host });

  // useEffect(() => {
    //     if (roomState.sourceType === 'file') {
    //         if (files[roomState.selectedFileIndex]) {
    //             const url = URL.createObjectURL(files[roomState.selectedFileIndex]);
    //             console.log("source file", url, roomState.sourceType, files[roomState.selectedFileIndex])
    //             setVideoUrl(url);
    //             // console.log('videoUrl', videoUrl);
    //         } else {
    //             // TODO: Need to handle this edge cases
    //             console.log('selected source is file but not getting any file')
    //         }
    //     } 
    // }, [roomState.selectedFileIndex, files, videoUrl, setVideoUrl, files]);

    useEffect(() => {
        // if (roomState.sourceType === 'file') {
        //     if (files[roomState.selectedFileIndex]) {
        //         const url = URL.createObjectURL(files[roomState.selectedFileIndex]);
        //         console.log("filing", url)
        //         setVideoUrl(url);
        //         dispatch(setUrls([url])); // Update the URLs in the room state
        //     } else {
        //         // TODO: Need to handle this edge cases
        //         console.log('selected source is file but not getting any file')
        //     }
        // } 
        // else 
        // if (roomState.sourceType === 'url') {
            if (roomState.urls[roomState.selectedFileIndex])
                setVideoUrl(roomState.urls[roomState.selectedFileIndex]);
            else
                // TODO: Need to handle this edge cases
                console.log('selected source is url but not getting any url');
        // }
    }, [
        // roomState.sourceType,
        roomState.selectedFileIndex,
        roomState.urls,
        // files,
        setVideoUrl]);
    
    useEffect(() => {
        if (socket && authState.isAuthenticated) {
            if (!roomState.roomId) return;
            console.log('Joining room:', roomState.roomId, roomState.host, authState.user?.username);
            joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
        }
    }, [socket, roomState.roomId, roomState.host, authState.isAuthenticated, authState.user?.username!]);

    return (
        <>
            {/* {console.log('assadsadasdas', videoUrl)} */}
            <Player
                // key={videoUrl} // Ensure the player re-renders when the URL changes
                playerRef={playerRef}
                playing={isPlaying}
                onPlay={onPlay}
                onPause={onPause}
                onSeekEnd={onSeeked}
                fullscreenTargetRef={fullscreenTargetRef} 
                url={videoUrl} 
                muted={false}
            >
                <PlayerOverlay />
            </Player>
            {/* <video src={videoUrl} controls></video> */}
        </>
    );
};

export default PlayerWrapper;
