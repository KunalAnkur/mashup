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

const PlaylistTab = () => {
    const dispatch = useDispatch();
    const roomState = useSelector((state: RootState) => state.room);
    const playlistState = roomState.playlist;
    const [playlist, setPlaylist] = useState<Playlist[]>(playlistState);
    const [updateRoomByRoomId] = useUpdateRoomByRoomIdMutation();
    const { broadcastPlaylist } = useRoomContext();
    const isHost = roomState.host;
    const t = useTranslations("panel.playlist");
    useEffect(() => {
        setPlaylist(playlistState);
    }, [playlistState]);
    const handleSelect = (id: string, source: "file" | "url" | "screen") => {
        console.log("handleSelect", id, source);
        if (!isHost) return;
        const newPlaylist = playlist.filter((item) => item.source !== "screen").map((item) => ({
            ...item,
            selected: item.id === id,
        }));
        setPlaylist(newPlaylist);
        dispatch(updateRoomInfo({ playlist: newPlaylist }));
        updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: newPlaylist } }).unwrap();
        broadcastPlaylist(newPlaylist);
    }

    const handleAddPlaylistContent = (content: Playlist[], source: "file" | "url" | "screen") => {
        console.log("handleAddPlaylistContent", content);
        if (source === "screen") {
            const playlistItems = [...content, ...playlistState.filter((item) => item.source !== "screen").map((item) => ({ ...item, selected: false }))];
            updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: playlistItems } }).unwrap();
            dispatch(updateRoomInfo({ playlist: playlistItems }));
            setPlaylist(playlistItems);
            broadcastPlaylist(playlistItems);
        } else {
            const playlistItems = [...playlistState, ...content];
            updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: playlistItems } }).unwrap();
            dispatch(updateRoomInfo({ playlist: playlistItems }));
            setPlaylist(playlistItems);
            broadcastPlaylist(playlistItems);
        }
    }

    const handleScreenShareStopped = (id: string, source: "file" | "url" | "screen" = "screen") => {
        console.log("handleScreenShareStopped", id);
        const filteredItems = playlistState.filter((item) => item.source !== "screen");
        const playlistItems = filteredItems.map((item, index) => ({
            ...item,
            selected: index === 0
        }));
        dispatch(updateRoomInfo({ playlist: playlistItems }));
        updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: playlistItems } }).unwrap();
        setPlaylist(playlistItems);
        broadcastPlaylist(playlistItems);
    }
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <h3 className="text-white font-semibold text-xs md:text-sm">{t("title")}</h3>
                    <span className="text-gray-500 text-[10px] md:text-xs">
                        ({playlist.length} {playlist.length === 1 ? t("item") : t("items")})
                    </span>
                </div>
                {!isHost && (
                    <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-gray-500">
                        <LuLock size={10} />
                        <span className="hidden sm:inline">{t("hostControls")}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 md:space-y-2 pr-1 custom-scrollbar">
                {playlist.map((content, index) =>
                    <PlaylistCard
                        key={content.id}
                        content={content}
                        host={isHost}
                        index={index}
                        onSelect={handleSelect}
                        onStop={handleScreenShareStopped}
                        isLoading={false} />
                )}

            </div>

            {isHost && (
                <ContentSelection onAddContent={handleAddPlaylistContent} onScreenShareStopped={handleScreenShareStopped} />
            )}
        </div>
    );
};

export default PlaylistTab;
