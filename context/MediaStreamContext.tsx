// context/MediaStreamContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type MediaStreamType = {
    stream: MediaStream | null;
    setStream: (stream: MediaStream | null) => void;
};

const MediaStreamContext = createContext<MediaStreamType>({
    stream: null,
    setStream: () => { },
});

export const MediaStreamProvider = ({ children }: { children: ReactNode }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    useEffect(() => {
        if (!stream) return;

        const handleTrackEnded = () => {
            console.log("[SourceTab] Screen sharing stopped by user - track ended");
            setStream(null);
        };

        // Listen to all tracks (video + audio)
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        const allTracks = [...videoTracks, ...audioTracks];

        allTracks.forEach(track => {
            track.addEventListener('ended', handleTrackEnded);
        });

        // Cleanup: remove listeners when stream changes or component unmounts
        return () => {
            allTracks.forEach(track => {
                track.removeEventListener('ended', handleTrackEnded);
            });
        };
    }, [stream, setStream]);
    return (
        <MediaStreamContext.Provider value={{ stream, setStream }}>
            {children}
        </MediaStreamContext.Provider>
    );
};

export const useMediaStreamContext = () => useContext(MediaStreamContext);