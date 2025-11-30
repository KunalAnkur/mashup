"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import SyncPlayer from "./SyncPlayer";
import StreamPlayer from "./StreamPlayer";

type PlayerWrapperProps = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const PlayerWrapper = ({ fullscreenTargetRef }: PlayerWrapperProps) => {
    const roomState = useSelector((state: RootState) => state.room);

    // StreamPlayer handles streaming (both file and screen sharing)
    // SyncPlayer handles sync (URL-based playback sync)
    if (roomState.type === "stream") {
        return <StreamPlayer fullscreenTargetRef={fullscreenTargetRef} />;
    }

    // type === "sync" uses SyncPlayer
    return <SyncPlayer fullscreenTargetRef={fullscreenTargetRef} />;
};

export default PlayerWrapper;