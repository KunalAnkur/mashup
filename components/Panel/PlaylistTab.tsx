"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { ContentSelection, PlaylistCard } from "./PlaylistTab/";
import { useEffect, useState } from "react";
import { Playlist } from "@/types/storeTypes";
import { LuLock } from "react-icons/lu";
import { useUpdateRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useRoomContext } from "@/context/RoomContext";
import { useTranslations } from "@/i18n/I18nProvider";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import {
    panelEmptyMessageTextClass,
    panelMetaLabelClass,
} from "./panelCardStyles";

const playlistHeaderSectionClass = "mb-3 space-y-1.5";
const playlistListClass =
    "flex h-full flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar md:gap-2";
const playlistEmptyStateClass = "flex h-full items-center justify-center px-4 text-center";

const PlaylistTab = () => {
    const dispatch = useDispatch();
    const roomState = useSelector((state: RootState) => state.room);
    const playlistState = roomState.playlist;
    const [playlist, setPlaylist] = useState<Playlist[]>(playlistState);
    const [updateRoomByRoomId] = useUpdateRoomByRoomIdMutation();
    const { broadcastPlaylist } = useRoomContext();
    const { addPlaylistContent, handleScreenShareStopped: onScreenShareStoppedFromActions } = usePlaylistActions();
    const isHost = roomState.host;
    const t = useTranslations("panel.playlist");
    useEffect(() => {
        setPlaylist(playlistState);
    }, [playlistState]);

    const handleSelect = (id: string, source: "file" | "url" | "screen") => {
        console.log("handleSelect", id, source);
        if (!isHost) return;

        // * UX rule: selecting file/url while screen-sharing should hide screen items from playlist tab.
        const shouldRemoveScreenItems = source !== "screen";
        const basePlaylist = shouldRemoveScreenItems
            ? playlist.filter((item) => item.source !== "screen")
            : playlist;

        // * Build the exact playlist shape that host store, DB and guests should all share.
        const newPlaylist = basePlaylist.map((item) => ({
            ...item,
            selected: item.id === id,
        }));

        // ! Safety: if selected id is not present after filtering, keep one deterministic selected item.
        if (newPlaylist.length && !newPlaylist.some((item) => item.selected)) {
            newPlaylist[0] = { ...newPlaylist[0], selected: true };
        }

        // * Keep all destinations in sync with the same payload to avoid index drift on non-host clients.
        setPlaylist(newPlaylist);
        dispatch(updateRoomInfo({ playlist: newPlaylist }));
        updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: newPlaylist } }).unwrap();
        broadcastPlaylist(newPlaylist);
    }

    const handleAddPlaylistContent = (content: Playlist[], source: "file" | "url" | "screen") => {
        console.log("handleAddPlaylistContent", content);
        addPlaylistContent(content, source);
    }

    const handleScreenShareStopped = (id: string, source: "file" | "url" | "screen" = "screen") => {
        console.log("handleScreenShareStopped", id);
        if (source !== "screen") return;
        onScreenShareStoppedFromActions(id);
    }
    return (
        <div className="flex h-full min-h-0 flex-col">
            {isHost && (
                <div className="mb-3">
                    <ContentSelection
                        onAddContent={handleAddPlaylistContent}
                        onScreenShareStopped={handleScreenShareStopped}
                    />
                </div>
            )}

            <div className={playlistHeaderSectionClass}>
                <div className="flex px-1">
                    <span className={panelMetaLabelClass}>
                        {t("title")} · {playlist.length} {playlist.length === 1 ? t("item") : t("items")}
                    </span>
                </div>
                {!isHost && (
                    <div className="flex items-center justify-end gap-1 px-1 text-[10px] text-white/[0.34]">
                        <LuLock size={10} />
                        <span className="hidden sm:inline">{t("hostControls")}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {playlist.length ? (
                    <div className={playlistListClass}>
                        {playlist.map((content, index) => (
                            <PlaylistCard
                                key={content.id}
                                content={content}
                                host={isHost}
                                index={index}
                                onSelect={handleSelect}
                                onStop={handleScreenShareStopped}
                                isLoading={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={playlistEmptyStateClass}>
                        <p className={panelEmptyMessageTextClass}>{t("noVideos")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistTab;
