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

    if (roomState.sourceType === "file") {
        return <FileStreamPlayer fullscreenTargetRef={fullscreenTargetRef} />;
    }

    return <UrlSyncPlayer fullscreenTargetRef={fullscreenTargetRef} />;
};

export default PlayerWrapper;