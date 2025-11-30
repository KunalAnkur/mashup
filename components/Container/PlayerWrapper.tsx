"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import UrlSyncPlayer from "./SyncPlayer";
import FileStreamPlayer from "./FileStreamPlayer";

type PlayerWrapperProps = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const PlayerWrapper = ({ fullscreenTargetRef }: PlayerWrapperProps) => {
    const roomState = useSelector((state: RootState) => state.room);

    // FileStreamPlayer handles streaming (both file and screen sharing)
    // UrlSyncPlayer handles sync (URL-based playback sync)
    if (roomState.type === "stream") {
        return <FileStreamPlayer fullscreenTargetRef={fullscreenTargetRef} />;
    }

    // type === "sync" uses UrlSyncPlayer
    return <UrlSyncPlayer fullscreenTargetRef={fullscreenTargetRef} />;
};

export default PlayerWrapper;