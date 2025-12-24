// context/MediaStreamContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

type MediaStreamType = {
    stream: MediaStream | null;
    screenType: string | null;
    setStream: (stream: MediaStream | null) => void;
    setScreenType: (screenType: string | null) => void;
    handleStopScreenSharing: () => void;
};

const MediaStreamContext = createContext<MediaStreamType>({
    stream: null,
    screenType: null,
    setStream: () => { },
    setScreenType: () => { },
    handleStopScreenSharing: () => { },
});

export const MediaStreamProvider = ({ children }: { children: ReactNode }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenType, setScreenType] = useState<string | null>(null);
    const handleStopScreenSharing = useCallback(() => {
        console.log("screen stream mediastream = [SourceTab] Screen sharing stopped by user - track ended");
        stream?.getTracks().forEach((t) => t.stop())
        setStream(null);
        setScreenType(null);
    }, [stream, setStream, setScreenType]);
    useEffect(() => {
        if (!stream) return;
        // Listen to all tracks (video + audio)
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        const allTracks = [...videoTracks, ...audioTracks];

        allTracks.forEach(track => {
            track.addEventListener('ended', handleStopScreenSharing);
        });

        // Cleanup: remove listeners when stream changes or component unmounts
        return () => {
            allTracks.forEach(track => {
                track.removeEventListener('ended', handleStopScreenSharing);
            });
        };
    }, [stream, handleStopScreenSharing]);
    return (
        <MediaStreamContext.Provider value={{ stream, screenType, setStream, setScreenType, handleStopScreenSharing }}>
            {children}
        </MediaStreamContext.Provider>
    );
};

export const useMediaStreamContext = () => useContext(MediaStreamContext);