// context/MediaStreamContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

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

    return (
        <MediaStreamContext.Provider value={{ stream, setStream }}>
            {children}
        </MediaStreamContext.Provider>
    );
};

export const useMediaStreamContext = () => useContext(MediaStreamContext);