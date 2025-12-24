"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { updateRoomInfo, setScreenSharing, setPlaylist } from "@/lib/store/slices/roomSlice";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { helper } from "@/utils";
import { LuPlay, LuFilm, LuLock, LuCrown, LuPlus, LuShare2, LuX } from "react-icons/lu";
import { FaBroadcastTower } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { detectPlatform, getPlatformById, getUrlDisplayName, validateUrl } from "@/types/ModalTypes/urlUtils";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { useUpdateRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import type { Playlist } from "@/types/storeTypes";
import { ExtendedFile } from "@/utils/filePersistence";

// URL playlist card -----------------------------------------------------------
const PlaylistUrlCard = ({
  url,
  index,
  isPlaying,
  isHost,
  isLoading = false,
  onSelect,
}: {
  url: AddedUrl;
  index: number;
  isPlaying: boolean;
  isHost: boolean;
  isLoading?: boolean;
  onSelect: () => void;
}) => {
  const platform = getPlatformById(url.platformId);
  const hasMetadata = url.metadata && (url.metadata.title || url.metadata.thumbnail);

  return (
    <button
      onClick={onSelect}
      disabled={!isHost}
      className={`
        group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0
        ${isPlaying
          ? "bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30"
          : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"}
        ${!isHost ? "cursor-default" : "cursor-pointer"}
      `}
    >
      {/* Thumbnail */}
      <div
        className={`
          relative w-20 h-13 rounded-lg overflow-hidden shrink-0
          ${isPlaying ? "ring-2 ring-pink-500/50" : ""}
          bg-gradient-to-br from-[#1f1f23] to-[#27272a]
        `}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : url.metadata?.thumbnail ? (
          <img
            src={url.metadata.thumbnail}
            alt={url.metadata?.title || "Video thumbnail"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : null}
        {!isLoading && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              url.metadata?.thumbnail ? "hidden" : ""
            } ${platform?.iconBg || "bg-gradient-to-br from-pink-500 to-fuchsia-600"}`}
          >
            <span className="text-white text-lg">
              {platform?.smallIcon || <LuFilm className="text-white text-sm" />}
            </span>
          </div>
        )}
        {isPlaying && !isLoading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
              <LuPlay className="text-white ml-0.5" size={12} />
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3.5 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
        ) : hasMetadata && url.metadata ? (
          <>
            <div className="flex items-center gap-2">
              <p
                className={`text-xs font-semibold line-clamp-1 leading-tight ${
                  isPlaying ? "text-pink-400" : "text-gray-200"
                }`}
              >
                {url.metadata.title || getUrlDisplayName(url.url)}
              </p>
              {isPlaying && (
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                  Playing
                </span>
              )}
            </div>
            {url.metadata.description && (
              <p className="text-gray-500 text-[10px] line-clamp-1 leading-tight">
                {url.metadata.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
              {url.metadata.author && (
                <span className="truncate max-w-[80px]">{url.metadata.author}</span>
              )}
              {url.metadata.author && platform && <span>•</span>}
              {platform && <span className="truncate">{platform.name}</span>}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p
                className={`text-xs font-medium truncate ${
                  isPlaying ? "text-pink-400" : "text-gray-200"
                }`}
              >
                {getUrlDisplayName(url.url)}
              </p>
              {isPlaying && (
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                  Playing
                </span>
              )}
            </div>
            {platform && (
              <p className="text-gray-500 text-[10px] truncate">{platform.name}</p>
            )}
          </>
        )}
      </div>

      {/* Index number */}
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
          ${isPlaying ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-500 group-hover:bg-white/10"}
        `}
      >
        {index + 1}
      </div>
    </button>
  );
};

// Screen share card -----------------------------------------------------------
const PlaylistScreenShareCard = ({
  platformName,
  platformLogo,
  platformBgStyle,
  isPlaying,
  onStop,
  isHost,
}: {
  platformName: string;
  platformLogo: React.ReactNode;
  platformBgStyle: React.CSSProperties;
  isPlaying: boolean;
  onStop?: () => void;
  isHost: boolean;
}) => (
  <div
    className={`
      w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0 relative group
      ${isPlaying
        ? "bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30"
        : "bg-white/5 border border-transparent"}
    `}
  >
    <div
      className={`
        relative w-20 h-13 rounded-lg overflow-hidden shrink-0 flex items-center justify-center
        ${isPlaying ? "ring-2 ring-pink-500/50" : ""}
      `}
      style={platformBgStyle}
    >
      <div className="text-white text-2xl">{platformLogo}</div>
      {isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
              <FaBroadcastTower className="text-white" size={10} />
            </div>
            <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
          </div>
        </div>
      )}
    </div>

    <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
      <div className="flex items-center gap-2">
        <p
          className={`text-xs font-semibold line-clamp-1 leading-tight ${
            isPlaying ? "text-pink-400" : "text-gray-200"
          }`}
        >
          {platformName}
        </p>
        {isPlaying && (
          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
            Streaming
          </span>
        )}
      </div>
      <p className="text-gray-500 text-[10px] truncate">Screen sharing active</p>
    </div>

    {isHost && onStop ? (
      <button
        onClick={onStop}
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 group-hover:scale-110"
        title="Stop screen sharing"
      >
        <LuX size={12} />
      </button>
    ) : (
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
          ${isPlaying ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-500"}
        `}
      >
        <FaBroadcastTower size={12} />
      </div>
    )}
  </div>
);

// File card -------------------------------------------------------------------
const PlaylistFileCard = async ({
  name,
  size,
  index,
  isPlaying,
  isHost,
  thumbnail,
  onSelect,
}: {
  name: string;
  size: number;
  index: number;
  isPlaying: boolean;
  isHost: boolean;
  thumbnail: string | null;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    disabled={!isHost}
    className={`
      group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0
      ${isPlaying
        ? "bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30"
        : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"}
      ${!isHost ? "cursor-default" : "cursor-pointer"}
    `}
  >
    <div
      className={`
        relative w-20 h-13 rounded-lg overflow-hidden shrink-0
        ${isPlaying ? "ring-2 ring-pink-500/50" : ""}
        bg-gradient-to-br from-zinc-700 to-zinc-800
      `}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <LuFilm className="text-gray-500" size={20} />
        </div>
      )}
      {isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
            <LuPlay className="text-white ml-0.5" size={12} />
          </div>
        </div>
      )}
    </div>

    <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
      <div className="flex items-center gap-2">
        <p
          className={`text-xs font-semibold line-clamp-1 leading-tight ${
            isPlaying ? "text-pink-400" : "text-gray-200"
          }`}
        >
          {name}
        </p>
        {isPlaying && (
          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
            Playing
          </span>
        )}
      </div>
      <p className="text-gray-500 text-[10px] truncate">{formatFileSize(size)} • Local file</p>
    </div>

    <div
      className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
        ${isPlaying ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-500 group-hover:bg-white/10"}
      `}
    >
      {index + 1}
    </div>
  </button>
);

// Main component --------------------------------------------------------------
const PlaylistTab = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const authState = useSelector((state: RootState) => state.auth);
  const { files, getThumbnail, requestFilePicker, setFiles, isPersistenceSupported, showPermissionPrompt } =
    useFileContext();
  const { stream: screenStream, screenType, setStream: setScreenStream, setScreenType } = useMediaStreamContext();
  const { socket } = useSocket();
  const { updatePlaylist, broadcastPlaylist } = useRoomContext();
  const [updateRoom] = useUpdateRoomMutation();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

  const playlist = roomState.playlist || [];
  const selectedIndex = Math.max(
    0,
    playlist.findIndex((p) => p.selected)
  );
  const currentItem: Playlist | undefined = playlist[selectedIndex];

  // Debug: Log playlist changes
  useEffect(() => {
    console.log("[PlaylistTab] Playlist updated:", {
      length: playlist.length,
      selectedIndex,
      selectedItem: currentItem,
      allItems: playlist.map((p, i) => ({ index: i, id: p.id, link: p.link, selected: p.selected, source: p.source })),
    });
  }, [playlist, selectedIndex, currentItem]);

  const isHost = roomState.host;

  // Find screen sharing item
  const screenItem = playlist.find((p) => p.source === "screen");
  const isScreenSharing = !!screenItem && !!screenStream;

  // Ensure screen is always at top and selected when present
  useEffect(() => {
    if (isScreenSharing && screenItem && screenStream) {
      const screenIndex = playlist.findIndex((p) => p.id === screenItem.id);
      if (screenIndex !== 0 || !screenItem.selected) {
        // Move screen to top and select it
        const otherItems = playlist.filter((p) => p.id !== screenItem.id).map((p) => ({ ...p, selected: false }));
        const updatedPlaylist = [{ ...screenItem, selected: true }, ...otherItems];
        dispatch(updateRoomInfo({ playlist: updatedPlaylist }));
        // Broadcast playlist update when screen is moved to top
        if (isHost && roomState.roomId) {
          broadcastPlaylist(updatedPlaylist);
        }
      }
    }
  }, [isScreenSharing, screenItem, screenStream, playlist, dispatch, isHost, roomState.roomId, broadcastPlaylist]);

  // Handle screen stream ending - remove from playlist and select first item
  useEffect(() => {
    if (!screenStream && screenItem && isHost) {
      const updatedPlaylist = playlist
        .filter((p) => p.id !== screenItem.id)
        .map((p, idx) => ({ ...p, selected: idx === 0 }));
      dispatch(updateRoomInfo({ playlist: updatedPlaylist }));
      
      // Broadcast playlist update
      broadcastPlaylist(updatedPlaylist);
      
      console.log("[PlaylistTab] Screen sharing stopped, removed from playlist");
    }
  }, [screenStream, screenItem, isHost, playlist, dispatch, broadcastPlaylist]);

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isAddingFiles, setIsAddingFiles] = useState(false);
  const [isAddingUrls, setIsAddingUrls] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const failedUrlsRef = useRef<Set<string>>(new Set());

  // Organize playlist: screen at top, then others
  const orderedPlaylist = React.useMemo(() => {
    const screenItems = playlist.filter((item) => item.source === "screen");
    const otherItems = playlist.filter((item) => item.source !== "screen");
    return [...screenItems, ...otherItems];
  }, [playlist]);

  // Streaming platform for screen share
  const streamingPlatform = React.useMemo(() => {
    if (!isScreenSharing || !screenType) return null;
    return STREAMING_PLATFORMS.find((p) => p.url === screenType);
  }, [isScreenSharing, screenType]);

  // Fetch metadata for URL playlist items that don't have it yet -----------------
  useEffect(() => {
    const urlItems = playlist.filter((p) => p.source === "url");
    if (!urlItems.length) return;

    const urlsToFetch = urlItems
      .map((item) => item.link)
      .filter((u): u is string => !!u)
      .filter((url) => {
        const item = playlist.find((p) => p.link === url && p.source === "url");
        return item && !item.metadata && !loadingUrls.has(url) && !failedUrlsRef.current.has(url);
      });

    if (!urlsToFetch.length) return;

    setLoadingUrls((prev) => {
      const next = new Set(prev);
      urlsToFetch.forEach((u) => next.add(u));
      return next;
    });

    const fetchMetadata = async () => {
      console.log("[PlaylistTab] Fetching metadata for URLs:", urlsToFetch);
      for (const url of urlsToFetch) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const token = authState.token;

          const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ url }),
          });

          if (response.ok) {
            const data = await response.json();
            // Ensure thumbnail is always present (string or null)
            const thumbnail = data.data?.thumbnail;
            const metadata: Playlist["metadata"] = {
              ...(data.data?.title && { title: data.data.title }),
              ...(data.data?.description && { description: data.data.description }),
              thumbnail: (typeof thumbnail === "string" && thumbnail.length > 0) ? thumbnail : null,
              ...(data.data?.author && { author: data.data.author }),
              ...(data.data?.siteName && !data.data?.author && { author: data.data.siteName }),
            };

            const updated = playlist.map((item) =>
              item.source === "url" && item.link === url
                ? {
                    ...item,
                    metadata: metadata || {},
                  }
                : item
            );
            dispatch(updateRoomInfo({ playlist: updated }));
            
            // Broadcast playlist update with metadata
            broadcastPlaylist(updated);
            
            // Update backend with metadata
            if (roomState.roomId) {
              try {
                const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
                const databaseId = roomInfo?.data?.id;
                if (databaseId) {
                  await updateRoom({ id: databaseId, body: { playlist: updated } }).unwrap();
                }
              } catch (apiErr) {
                console.error("[PlaylistTab] Error updating room playlist with metadata via API:", apiErr);
              }
            }
            
            failedUrlsRef.current.delete(url);
          } else {
            console.warn(`[PlaylistTab] Failed to fetch metadata for ${url}: ${response.status}`);
            failedUrlsRef.current.add(url);
          }
        } catch (err) {
          console.error("Error fetching metadata for URL:", url, err);
          failedUrlsRef.current.add(url);
        } finally {
          setLoadingUrls((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        }
      }
    };

    fetchMetadata();
  }, [playlist, authState.token, dispatch, loadingUrls, roomState.roomId, getRoomByRoomId, updateRoom]);

  // Utilities ------------------------------------------------------------------
  const getUrlData = (url: string, metadata?: Playlist["metadata"]): AddedUrl => ({
    url,
    platformId: detectPlatform(url),
    metadata: metadata as AddedUrl["metadata"],
  });

  const isUrlLoading = (url: string): boolean => loadingUrls.has(url);

  const handleSelectVideo = (playlistIndex: number) => {
    if (!isHost) return;
    console.log("[PlaylistTab] Host selecting video:", { playlistIndex, playlistLength: playlist.length, item: playlist[playlistIndex] });
    // Let useSync/useVideoSync handle broadcasting selection. Here we only update local playlist.
    const updated = playlist.map((item, idx) => ({ ...item, selected: idx === playlistIndex }));
    dispatch(updateRoomInfo({ playlist: updated }));
    
    // Broadcast playlist update (selection change)
    broadcastPlaylist(updated);
    
    if (socket && roomState.roomId) {
      console.log("[PlaylistTab] Emitting SELECT_VIDEO:", { roomId: roomState.roomId, selectedIndex: playlistIndex });
      socket.emit(SocketEvent.SELECT_VIDEO, { roomId: roomState.roomId, selectedIndex: playlistIndex });
    } else {
      console.warn("[PlaylistTab] Cannot emit SELECT_VIDEO - socket or roomId missing:", { socket: !!socket, roomId: roomState.roomId });
    }
  };

  // Stop screen sharing --------------------------------------------------------
  const handleStopScreenSharing = useCallback(() => {
    if (!isHost || !isScreenSharing || !screenItem) return;

    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setScreenType(null);
    }

    // Remove screen from playlist and select first item
    const updatedPlaylist = playlist
      .filter((p) => p.id !== screenItem.id)
      .map((p, idx) => ({ ...p, selected: idx === 0 }));

    dispatch(updateRoomInfo({ playlist: updatedPlaylist }));

    // Broadcast playlist update to all users
    broadcastPlaylist(updatedPlaylist);

    // Notify others via socket if needed
    if (socket && roomState.roomId && updatedPlaylist.length > 0) {
      socket.emit(SocketEvent.SELECT_VIDEO, { roomId: roomState.roomId, selectedIndex: 0 });
    }

    console.log("[PlaylistTab] Screen sharing stopped and removed from playlist");
  }, [isHost, isScreenSharing, screenItem, screenStream, setScreenStream, setScreenType, playlist, dispatch, socket, roomState.roomId]);

  // Share screen ---------------------------------------------------------
  const handleShareScreen = useCallback(async () => {
    if (!isHost) return;

    setIsSharingScreen(true);
    try {
      // Stop existing stream if any
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
        setScreenType(null);
      }

      const { mediaStream, screenType: newType } = await helper.captureTabStream({
        audioOnly: false,
        preferredDisplaySurface: "tab",
      });

      if (!mediaStream) {
        // User cancelled
        return;
      }

      // Create screen playlist item
      const screenItem: Playlist = {
        id: crypto.randomUUID(),
        type: "stream",
        source: "screen",
        link: "Screen Share",
        selected: true,
        onlyAudio: false,
        metadata: {
          title: "Screen Share",
          description: "Live screen sharing session",
          thumbnail: undefined,
          author: authState.user?.name || authState.user?.username || "You",
        },
      };

      // Add to playlist at top and select it
      const otherItems = playlist.map((p) => ({ ...p, selected: false }));
      const updatedPlaylist = [screenItem, ...otherItems];
      
      dispatch(setPlaylist(updatedPlaylist));
      
      // Broadcast playlist update to all users
      broadcastPlaylist(updatedPlaylist);
      
      setScreenStream(mediaStream);
      setScreenType(newType);

      // Notify others via socket
      if (socket && roomState.roomId) {
        socket.emit(SocketEvent.SELECT_VIDEO, { roomId: roomState.roomId, selectedIndex: 0 });
      }

      console.log("[PlaylistTab] Screen sharing started");
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        console.log("Screen sharing cancelled or permission denied");
        return;
      }
      console.error("Screen sharing error:", err);
      if (err.name !== "NotFoundError" && err.name !== "NotReadableError") {
        alert("Screen sharing failed. Please try again.");
      }
    } finally {
      setIsSharingScreen(false);
    }
  }, [isHost, screenStream, setScreenStream, setScreenType, playlist, dispatch, authState.user, socket, roomState.roomId, broadcastPlaylist]);

  // Add files ------------------------------------------------------------
  const handleAddFiles = useCallback(async () => {
    if (!isHost || !roomState.roomId) return;

    setIsAddingFiles(true);
    try {
      let newFiles: ExtendedFile[] = [];

      if (isPersistenceSupported) {
        const selectedFiles = await requestFilePicker(true);
        if (selectedFiles.length > 0) {
          newFiles = selectedFiles;
        }
      } else {
        showPermissionPrompt();
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = "video/*";

        await new Promise<void>((resolve, reject) => {
          input.onchange = async (e) => {
            try {
              const target = e.target as HTMLInputElement;
              const fileList = target.files ? Array.from(target.files) : [];
              if (fileList.length > 0) {
                newFiles = fileList.map((f) => ({
                  id: crypto.randomUUID(),
                  selected: false,
                  file: f,
                })) as ExtendedFile[];
              }
              resolve();
            } catch (err) {
              reject(err);
            } finally {
              input.remove();
            }
          };

          input.oncancel = () => {
            resolve();
            input.remove();
          };

          input.click();
        });
      }

      if (newFiles.length > 0) {
        // Add to FileContext
        const combined = [...files, ...newFiles];
        await setFiles(combined);

        // Add to playlist
        const newPlaylistItems: Playlist[] = await Promise.all(newFiles.map(async (extFile) => ({
          id: extFile.id,
          type: "stream",
          source: "file",
          link: extFile.file.name,
          selected: false,
          onlyAudio: extFile.onlyAudio,
          metadata: {
            title: extFile.file.name,
            description: extFile.file.name,
            thumbnail: await getThumbnail(extFile.file) || null,
            author: extFile.file.name,
          },
        })));

        const updatedPlaylist = [...playlist, ...newPlaylistItems];

        // Persist to backend
        try {
          const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
          const databaseId = roomInfo?.data?.id;
          if (databaseId) {
            await updateRoom({ id: databaseId, body: { playlist: updatedPlaylist } }).unwrap();
          }
        } catch (apiErr) {
          console.error("[PlaylistTab] Error updating room playlist via API:", apiErr);
        }

        dispatch(updateRoomInfo({ playlist: updatedPlaylist }));
        
        // Broadcast playlist update to all users
        broadcastPlaylist(updatedPlaylist);
        
        console.log(`[PlaylistTab] Added ${newFiles.length} new file(s) to playlist`);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Error adding files:", err);
      alert("Failed to add files. Please try again.");
    } finally {
      setIsAddingFiles(false);
    }
  }, [isHost, roomState.roomId, isPersistenceSupported, files, requestFilePicker, setFiles, showPermissionPrompt, getThumbnail, playlist, getRoomByRoomId, updateRoom, dispatch]);

  // Add URLs ------------------------------------------------------
  const handleOpenAddUrlModal = useCallback(() => {
    if (!isHost || !roomState.roomId) return;
    setShowAddUrlModal(true);
    setUrlInput("");
    setUrlError("");
  }, [isHost, roomState.roomId]);

  const handleCloseAddUrlModal = useCallback(() => {
    setShowAddUrlModal(false);
    setUrlInput("");
    setUrlError("");
  }, []);

  const handleUrlInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    setUrlError("");
  }, []);

  const handleAddUrl = useCallback(async () => {
    if (!isHost || !roomState.roomId) return;

    const url = urlInput.trim();
    if (!url) {
      setUrlError("Please enter a URL");
      return;
    }
    const validation = validateUrl(url);
    if (!validation.valid) {
      setUrlError(validation.tooltip || "Invalid URL. Please enter a supported video URL.");
      return;
    }

    setIsAddingUrls(true);
    setUrlError("");

    try {
      // Fetch metadata first
      let metadata: Playlist["metadata"] = {
        thumbnail: null, // Always include thumbnail field
      };
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = authState.token;

        const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure thumbnail is always present (string or null)
          const thumbnail = data.data?.thumbnail;
          metadata = {
            ...(data.data?.title && { title: data.data.title }),
            ...(data.data?.description && { description: data.data.description }),
            thumbnail: (typeof thumbnail === "string" && thumbnail.length > 0) ? thumbnail : null,
            ...(data.data?.author && { author: data.data.author }),
            ...(data.data?.siteName && !data.data?.author && { author: data.data.siteName }),
          };
          console.log("[PlaylistTab] Fetched metadata for URL:", url, metadata);
        } else {
          console.warn(`[PlaylistTab] Failed to fetch metadata for ${url}: ${response.status}`);
          // Continue with empty metadata if fetch fails
        }
      } catch (metadataErr) {
        console.error("[PlaylistTab] Error fetching metadata for URL:", url, metadataErr);
        // Continue with empty metadata if fetch fails
      }

      // Build new playlist entry with metadata
      const newEntry: Playlist = {
        id: crypto.randomUUID(),
        type: "sync",
        source: "url",
        link: url,
        selected: false, // Don't auto-select
        onlyAudio: false,
        metadata: metadata || {}, // Ensure it's an object, not null
      };

      const updatedPlaylist = [...playlist, newEntry];

      // Persist to backend
      try {
        const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
        const databaseId = roomInfo?.data?.id;
        if (databaseId) {
          await updateRoom({ id: databaseId, body: { playlist: updatedPlaylist } }).unwrap();
        }
      } catch (apiErr) {
        console.error("[PlaylistTab] Error updating room playlist via API:", apiErr);
        throw apiErr; // Re-throw to show error to user
      }

      dispatch(updateRoomInfo({ playlist: updatedPlaylist }));

      // Broadcast full playlist update to all users
      broadcastPlaylist(updatedPlaylist);

      // Also notify via legacy URL list for backward compatibility
      const urlList = updatedPlaylist
        .filter((p) => p.source === "url")
        .map((p) => p.link);
      await updatePlaylist(urlList);

      handleCloseAddUrlModal();
    } catch (err: any) {
      console.error("Error adding URL to room:", err);
      const msg = err?.message || "Failed to add URL. Please try again.";
      setUrlError(msg);
    } finally {
      setIsAddingUrls(false);
    }
  }, [
    isHost,
    roomState.roomId,
    urlInput,
    playlist,
    authState.token,
    getRoomByRoomId,
    updateRoom,
    dispatch,
    updatePlaylist,
    broadcastPlaylist,
    handleCloseAddUrlModal,
  ]);

  const handleUrlInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !urlError && urlInput.trim()) {
        handleAddUrl();
      } else if (e.key === "Escape") {
        handleCloseAddUrlModal();
      }
    },
    [urlInput, urlError, handleAddUrl, handleCloseAddUrlModal]
  );

  // Empty state
  if (!playlist.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
            <LuFilm className="text-white/70" size={24} />
          </div>
        </div>
        <h3 className="text-white font-semibold mb-2">No videos</h3>
        <p className="text-white/60 text-sm">Add files, URLs, or share your screen to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">Playlist</h3>
            <span className="text-gray-500 text-xs">
              ({playlist.length} {playlist.length === 1 ? "item" : "items"})
            </span>
          </div>
          {!isHost && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <LuLock size={12} />
              <span>Host controls</span>
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {orderedPlaylist.map((item, displayIndex) => {
            if (!item) return null;

            // Find actual index in original playlist for selection
            const actualIndex = playlist.findIndex((p) => p.id === item.id);
            const isPlaying = actualIndex === selectedIndex;

            // Render screen sharing card
            if (item.source === "screen") {
              const platform = streamingPlatform || STREAMING_PLATFORMS[0]; // Fallback to first platform
              const platformName = item.metadata?.title || platform?.name || "Screen Share";
              return (
                <PlaylistScreenShareCard
                  key={item.id}
                  platformName={platformName}
                  platformLogo={platform?.logo || <FaBroadcastTower />}
                  platformBgStyle={platform?.bgStyle || {}}
                  isPlaying={isPlaying}
                  onStop={handleStopScreenSharing}
                  isHost={isHost}
                />
              );
            }

            // Render file card
            if (item.source === "file") {
              const ext = files.find((f) => f.id === item.id);
              if (!ext) return null;
              const file = ext.file;
              const thumbnail = getThumbnail(file);

              return (
                <PlaylistFileCard
                  key={item.id}
                  name={file.name}
                  size={file.size}
                  index={displayIndex}
                  isPlaying={isPlaying}
                  isHost={isHost}
                  thumbnail={thumbnail}
                  onSelect={() => handleSelectVideo(actualIndex)}
                />
              );
            }

            // Render URL card
            if (item.source === "url") {
              const urlStr = item.link;
              const addedUrl = getUrlData(urlStr, item.metadata);
              const loading = isUrlLoading(urlStr);

              return (
                <PlaylistUrlCard
                  key={item.id}
                  url={addedUrl}
                  index={displayIndex}
                  isPlaying={isPlaying}
                  isHost={isHost}
                  isLoading={loading}
                  onSelect={() => handleSelectVideo(actualIndex)}
                />
              );
            }

            return null;
          })}
        </div>

        {/* Host actions - Three buttons */}
        {isHost && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={handleOpenAddUrlModal}
              disabled={isAddingUrls}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingUrls ? (
                <>
                  <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Adding...</span>
                </>
              ) : (
                <>
                  <LuPlus size={16} />
                  <span className="text-sm font-medium">Add URL</span>
                </>
              )}
            </button>

            <button
              onClick={handleAddFiles}
              disabled={isAddingFiles}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingFiles ? (
                <>
                  <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Adding...</span>
                </>
              ) : (
                <>
                  <LuPlus size={16} />
                  <span className="text-sm font-medium">Add Files</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareScreen}
              disabled={isSharingScreen}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharingScreen ? (
                <>
                  <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Sharing...</span>
                </>
              ) : (
                <>
                  <LuShare2 size={16} />
                  <span className="text-sm font-medium">Share Screen</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Add URL Modal */}
      {showAddUrlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseAddUrlModal}
        >
          <div
            className="relative w-full max-w-md mx-4 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 shadow-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
                  <LuPlus className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-bold text-white">Add Video URL</h3>
              </div>
              <button
                onClick={handleCloseAddUrlModal}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Close"
              >
                <LuX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Paste your video URL here"
                  value={urlInput}
                  onChange={handleUrlInputChange}
                  onKeyDown={handleUrlInputKeyDown}
                  className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
                  disabled={isAddingUrls}
                  autoFocus
                />
                {urlError && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{urlError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseAddUrlModal}
                  disabled={isAddingUrls}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUrl}
                  disabled={isAddingUrls || !urlInput.trim() || !!urlError}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAddingUrls ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <LuPlus size={16} />
                      <span>Add URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default PlaylistTab;
