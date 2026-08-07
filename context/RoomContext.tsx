"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useSelector, useDispatch } from "react-redux";
import { RootState, store } from "@/lib/store";
import { setHostPlaybackPlaying, updateRoomInfo, setUpgradeSubscriptionModal, setPlaybackBlocked, setDailyUsage } from "@/lib/store/slices/roomSlice";
import type { Playlist } from "@/types/storeTypes";
import type { PinnedChatMessage } from "@/types/chatTypes";
import { showError } from "@/utils/toast";
import { trackRoomJoined, trackRoomLeft, trackDailyLimitReached } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";

export type RoomType = "stream" | "sync";
export type StreamDeliveryMode = "p2p" | "sfu";
/** Transport carrying call media. Mirrors StreamDeliveryMode but is decided separately. */
export type CallDeliveryMode = "p2p" | "sfu";
export interface UserInfo {
    socketId: string;
    roomId: string;
    username: string;
    email?: string;
    profile?: string;
    name?: string;
    host: boolean;
    roomType: RoomType;
    joinedAt: number;
}
export interface RoomInformation {
    // Legacy fields kept for socket compatibility
    type?: "stream" | "sync";
    source?: "file" | "url" | "stream";
    urls?: string[];
    files?: string[];
    selectedFileIndex?: number;
}
interface JoinResponse {
    success: boolean;
    type?: string;
    message?: string;
    roomId: string;
    roomType: RoomType;
    streamDeliveryMode?: StreamDeliveryMode | null;
    iceServers?: RTCIceServer[];
    chatHistory?: any[];
    pinnedMessage?: PinnedChatMessage | null;
    rtpCapabilities?: any;
    sendTransportOptions?: any;
    recvTransportOptions?: any;
    room: RoomInformation;
    playlist?: Playlist[];
    users?: UserInfo[];
    hostLeft?: boolean;
    existingProducers?: Record<string, any[]>;
    hostPlayback?: {
        playing: boolean;
    };
    hostIsPremium?: boolean;
    callDeliveryMode?: CallDeliveryMode | null;
    error?: string;
}

interface RoomContextType {
    isJoined: boolean;
    isLoading: boolean;
    roomType: RoomType | null;
    streamDeliveryMode: StreamDeliveryMode | null;
    hostLeft: boolean;
    roomClosed: boolean;
    /**
     * Connection dropped mid-session and is recovering. The room is still ours — wait, don't
     * exit. Deliberately does not distinguish a deploy from a network drop: the cause is ours
     * to handle, and the UI says "Reconnecting..." either way.
     */
    isReconnecting: boolean;
    /** Recovery gave up. The room is genuinely lost. */
    connectionFailed: boolean;
    joinResponse: JoinResponse | null;
    roomId: string | null;
    isHost: boolean;
    hostIsPremium: boolean;
    /**
     * How call media travels for this room: `sfu` for Crowd, `p2p` for Couple, null when the
     * host has no paid plan and calls are unavailable. Decided by the host's tier, so it is
     * the same for everyone in the room.
     */
    callDeliveryMode: CallDeliveryMode | null;
    username: string;
    leaveRoom: () => void;
    updatePlaylist: (urls: string[]) => void;
    broadcastPlaylist: (playlist: Playlist[]) => void;
    updateUserName: (username: string, name: string, profile: string) => void;
    captureWatchTime: () => void;
    participants: UserInfo[];
}

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
    const { socket, isConnected, isReconnecting, connectionFailed } = useSocket();
    const dispatch = useDispatch();

    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);

    const roomId = roomState.roomId;
    const isHost = roomState.host;
    // Derive room type from selected playlist item (or first item)
    const roomTypeFromState: RoomType | undefined = (() => {
        const playlist = roomState.playlist || [];
        const selected = playlist.find((p) => p.selected) || playlist[0];
        return selected?.type as RoomType | undefined;
    })();
    const username = authState.user?.username || authState.user?.name || "User";
    const email = authState.user?.email;
    const profile = authState.user?.profile;

    const [isJoined, setIsJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hostIsPremium, setHostIsPremium] = useState(false);
    const [callDeliveryMode, setCallDeliveryMode] = useState<CallDeliveryMode | null>(null);
    const tToast = useTranslations("toast");
    const [roomType, setRoomType] = useState<RoomType | null>(null);
    const [streamDeliveryMode, setStreamDeliveryMode] = useState<StreamDeliveryMode | null>(null);
    const [hostLeft, setHostLeft] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);
    const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);
    const [participants, setParticipants] = useState<UserInfo[]>([]);
    const joinTimeRef = useRef<number | null>(null); // Track when user joined for duration calculation
    // Sync roomType from Redux when it changes (e.g., from room info update)
    useEffect(() => {
        if (roomTypeFromState && roomTypeFromState !== roomType) {
            console.log(`[RoomContext] Room type synced from playlist state: ${roomType} -> ${roomTypeFromState}`);
            if (roomType === "stream" && roomTypeFromState === "sync") {
                console.log("[RoomContext] Room type changed from stream to sync - cleaning up stream resources");
                // Send event to the backend to cleanup MediaSoup resources
                // if (socket && roomId) {
                    
                //     console.log("[RoomContext] Emitted CLEANUP_STREAM_ROOM event");
                // }
            }
            setRoomType(roomTypeFromState);
        }
    }, [roomTypeFromState, roomType]);

    const joinAttemptedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);
    const watchTimeRef = useRef(0); // Seconds watched in the current session
    // Sticky across disconnects, unlike `isJoined`: it records that this user was in the room
    // before the drop, which is what distinguishes "reconnecting" from "not joined yet".
    const hasJoinedRef = useRef(false);

    const joinRoom = useCallback(async () => {
        console.log("flow test - joinRoom called", { socket, roomId, username, playlist: roomState.playlist });
        if (!socket || !roomId || !username) return;
        if (joinAttemptedRef.current && currentRoomRef.current === roomId) return;
        if (isJoined && currentRoomRef.current === roomId) return;

        setIsLoading(true);
        joinAttemptedRef.current = true;

        try {
            console.log("room state while joining", roomState);

            // Derive minimal room info for socket payload from playlist
            const playlist = roomState.playlist || [];
            const selected: Playlist | undefined =
                playlist.find((p) => p.selected) || playlist[0];
            const derivedRoomType: RoomType =
                (selected?.type as RoomType) || roomTypeFromState || "sync";

            const roomPayload: RoomInformation = {
                type: derivedRoomType,
                // Map our playlist `source` to legacy `source` expected by backend
                // - "screen" => "stream" (screen sharing)
                // - "file" or "url" pass through
                source:
                    selected?.source === "screen"
                        ? "stream"
                        : selected?.source ?? (derivedRoomType === "sync" ? "url" : "file"),
            };

            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId,
                host: isHost,
                username,
                email,
                profile,
                // room: roomPayload,
                playlist: roomState.playlist,
            }) as JoinResponse;
            if (response?.success) {
                setIsJoined(true);
                hasJoinedRef.current = true;
                currentRoomRef.current = roomId;
                setRoomType(response.roomType || derivedRoomType);
                setStreamDeliveryMode(response.streamDeliveryMode || null);
                setHostIsPremium(response.hostIsPremium === true);
                setCallDeliveryMode(response.callDeliveryMode ?? null);
                setJoinResponse(response);
                dispatch(setHostPlaybackPlaying(response.hostPlayback?.playing === true));
                setParticipants(response.users || []);
                setHostLeft(response.hostLeft === true);
                setRoomClosed(false);
                
                // Track room joined
                joinTimeRef.current = Date.now();
                trackRoomJoined(roomId, isHost ? "host" : "guest", response.users?.length);
            } else {
                setIsJoined(false);
                setJoinResponse(null);
                joinAttemptedRef.current = false;
                dispatch(setHostPlaybackPlaying(false));
                const errorMessage = response?.error || tToast("checkConnection");
                showError(tToast("failedToJoinRoom"), errorMessage);
                if (response?.type === 'NOT_ALLOWED') {
                    // Open upgrade subscription modal with the message from response
                    console.log("Room joining not allowed", response);
                    dispatch(setUpgradeSubscriptionModal({
                        open: true,
                        message: response?.message,
                        context: "room_full"
                    }));
                }
            }
        } catch (error: any) {
            console.error("Error joining room:", error);
            setIsJoined(false);
            joinAttemptedRef.current = false;
            dispatch(setHostPlaybackPlaying(false));
            const errorMessage = error?.message || tToast("checkConnection");
            showError(tToast("failedToJoinRoom"), errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [socket, roomId, isHost, username, email, profile, roomState.playlist, roomTypeFromState, isJoined, dispatch]);

    // If the socket disconnects (internet drop, or a deploy restarting the service), release
    // only the join guards so the auto-join effect can re-run once the connection is back.
    //
    // Deliberately NOT cleared here: roomType, streamDeliveryMode, joinResponse, participants,
    // hostIsPremium. Wiping those made every blip — including the ~15s gap while the
    // communication service redeploys — render as if the user had been kicked out of the room,
    // even though the client reconnects and rejoins on its own moments later. They are all
    // overwritten by the next successful join ack anyway.
    useEffect(() => {
        if (isConnected) return;

        setIsLoading(false);
        setIsJoined(false);
        // Playback stops while offline: nothing is in sync with the host, and watch time must
        // not accrue against the room's allowance for time nobody is connected for.
        dispatch(setHostPlaybackPlaying(false));
        joinAttemptedRef.current = false;
        currentRoomRef.current = null;
    }, [isConnected, dispatch]);

    // Recovery has actually given up (retries exhausted, or the server rejected us for a
    // reason that will not resolve). Only now is the room genuinely gone, so this is where the
    // teardown that used to run on every disconnect belongs.
    useEffect(() => {
        if (!connectionFailed) return;

        setRoomType(null);
        setStreamDeliveryMode(null);
        setHostLeft(false);
        setRoomClosed(true);
        setJoinResponse(null);
        setParticipants([]);
        setHostIsPremium(false);
    }, [connectionFailed]);

    const updatePlaylist = useCallback(
        async (urls: string[]) => {
            if (!socket || !roomId) return;
            // Emit legacy UPDATE_PLAYLIST with only URL list; backend will broadcast ROOM_INFO_UPDATED
            const roomPayload: RoomInformation = {
                urls,
            };
            await socket.emit(SocketEvent.UPDATE_PLAYLIST, {
                roomId,
                room: roomPayload,
            });
        },
        [socket, roomId]
    );

    const broadcastPlaylist = useCallback(
        (playlist: Playlist[]) => {
            if (!socket || !roomId || !isHost) return;
            // Broadcast full playlist to all users in the room
            socket.emit(SocketEvent.PLAYLIST_UPDATED, {
                roomId,
                playlist,
            });
        },
        [socket, roomId, isHost]
    );

    const updateUserName = useCallback(async (username: string, name: string, profile: string) => {
        if (!socket || !roomId) return;
        socket.emit(SocketEvent.USERNAME_UPDATED, {
            username,
            name,
            profile,
        });
    }, [socket, roomId]);

    const leaveRoom = useCallback(() => {
        if (!socket || !roomId) return;

        // Track room left with duration
        if (joinTimeRef.current) {
            const durationSec = Math.floor((Date.now() - joinTimeRef.current) / 1000);
            trackRoomLeft(roomId, durationSec);
            joinTimeRef.current = null;
        }

        socket.emit(SocketEvent.LEAVE_ROOM, { roomId, room: roomState });
        setIsJoined(false);
        setRoomType(null);
        setStreamDeliveryMode(null);
        setHostLeft(false);
        setRoomClosed(false);
        dispatch(setHostPlaybackPlaying(false));
        setJoinResponse(null);
        joinAttemptedRef.current = false;
        currentRoomRef.current = null;
        hasJoinedRef.current = false;
        // dispatch(exitRoom());
    }, [socket, roomId, roomState, dispatch]);

    // Auto-join
    useEffect(() => {
        console.log("Reconnection test - auto-join called", { roomId, socket, username, isConnected, isJoined, joinAttemptedRef: joinAttemptedRef.current });
        console.log("Reconnection test - auto-join condition", (roomId && socket && username && isConnected && !isJoined && !joinAttemptedRef.current));
        if (roomId && socket && username && isConnected && !isJoined && !joinAttemptedRef.current) {
            console.log("Reconnection test - auto-join calling joinRoom", { roomId, socket, username, isConnected, isJoined, joinAttemptedRef: joinAttemptedRef.current });
            joinRoom();
        }
    }, [roomId, socket, username, isConnected, isJoined, joinRoom]);

    // Reset on room change
    useEffect(() => {
        if (roomId !== currentRoomRef.current) {
            joinAttemptedRef.current = false;
            currentRoomRef.current = null;
            watchTimeRef.current = 0;
            hasJoinedRef.current = false;
            setStreamDeliveryMode(null);
            dispatch(setHostPlaybackPlaying(false));
        }
    }, [roomId, dispatch]);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        const handleHostLeft = (data: { roomId?: string }) => {
            if (!data.roomId || data.roomId === roomId) {
                setHostLeft(true);
                setRoomClosed(true);
                dispatch(setHostPlaybackPlaying(false));
            }
        };

        const handleRoomClosed = (data: { roomId: string }) => {
            if (data.roomId === roomId) {
                setRoomClosed(true);
                setIsJoined(false);
                dispatch(setHostPlaybackPlaying(false));
            }
        };

        // The host arriving is the inverse of them leaving: whatever `hostLeft` closed, this
        // reopens. Setting `roomClosed` true here was a typo for false — a room cannot be
        // closed by its host walking in.
        const handleHostJoined = (data: { roomId: string }) => {
            if (!data.roomId || data.roomId === roomId) {
                setHostLeft(false);
                setRoomClosed(false);
            }
        };

        // Handle room info update when host joins with new videos or different room type
        const handleRoomInfoUpdated = (data: { 
            roomId: string; 
            playlist: Playlist[];
            streamDeliveryMode?: StreamDeliveryMode | null;
        }) => {
            // ! Need to do something here to update the playlist in the redux store
            if (data.roomId === roomId && !isHost) {
                dispatch(updateRoomInfo({ playlist: data.playlist }));
                if (data.streamDeliveryMode) {
                    setStreamDeliveryMode(data.streamDeliveryMode);
                }
                // const newRoomType = data.room.type;
                // const currentRoomType = roomType;
                
                // console.log("[RoomContext] Room info updated from host:", {
                //     ...data.room,
                //     newRoomType,
                //     currentRoomType,
                // });
                
                // Check if room type is changing
                // if (newRoomType && newRoomType !== currentRoomType) {
                //     console.log(`[RoomContext] Room type changed from ${currentRoomType} to ${newRoomType}`);
                    
                //     // If switching room types, we need to rejoin to get proper setup
                //     // Stream rooms need MediaSoup setup, sync rooms need different initialization
                //     if (newRoomType === "stream" && currentRoomType === "sync") {
                //         console.log("[RoomContext] Room type changed to stream - triggering rejoin for MediaSoup setup");
                //         // Reset join state to allow rejoin
                //         setIsJoined(false);
                //         joinAttemptedRef.current = false;
                //         // Clear join response to force fresh initialization
                //         setJoinResponse(null);
                //         // Update room type first
                //         setRoomType(newRoomType);
                //         // Rejoin will happen automatically via the auto-join effect
                //     } else if (newRoomType === "sync" && currentRoomType === "stream") {
                //         console.log("[RoomContext] Room type changed to sync - triggering rejoin");
                //         // Reset join state to allow rejoin
                //         setIsJoined(false);
                //         joinAttemptedRef.current = false;
                //         // Clear join response
                //         setJoinResponse(null);
                //         // Update room type
                //         setRoomType(newRoomType);
                //         // Rejoin will happen automatically via the auto-join effect
                //     } else {
                //         // For other cases, just update the type
                //         setRoomType(newRoomType);
                //     }
                // }
            }
        };

        // Keep playlist selection in sync across host/consumers
        const handleVideoSelected = ({ selectedIndex }: { selectedIndex: number }) => {
            if (isHost) return;

            const state = store.getState() as RootState;
            const playlist = state.room.playlist || [];
            if (!playlist.length) return;
            if (selectedIndex < 0 || selectedIndex >= playlist.length) return;

            const currentSelectedIndex = playlist.findIndex((item) => item.selected);
            if (currentSelectedIndex === selectedIndex) return;

            const updated = playlist.map((item, idx) => ({
                ...item,
                selected: idx === selectedIndex,
            }));

            dispatch(updateRoomInfo({ playlist: updated }));
        };

        // Handle full playlist updates from host
        const handlePlaylistUpdated = (data: { roomId: string; playlist: Playlist[] }) => {
            if (data.roomId === roomId && !isHost && Array.isArray(data.playlist)) {
                console.log("[RoomContext] Received playlist update from host:", data.playlist);
                dispatch(updateRoomInfo({ playlist: data.playlist }));
            }
        };

        const handleHostPlaybackState = (data: { roomId: string; playing: boolean }) => {
            if (data.roomId === roomId) {
                dispatch(setHostPlaybackPlaying(data.playing === true));
            }
        };

        const handleOnNotify = (data: {success: boolean, type: string, message: string}) => {
            if (!data.success) {
                switch (data.type) {
                    case "NOT_ALLOWED":
                        dispatch(setUpgradeSubscriptionModal({
                            open: true,
                            message: data?.message,
                            context: "room_full"
                        }));
                        return
                    case "WATCH_TIME_LIMIT_EXCEEDED":
                        dispatch(setUpgradeSubscriptionModal({
                            open: true,
                            message: data?.message,
                            context: "watch_time_session"
                        }));
                        return;
                
                    default:
                        break;
                }
            }
        }
        // Daily watch-limit hit — applies to host and guest alike, unlike the modal-based
        // per-session cap above. The player components force `playing` to false whenever
        // this flag is set, so this must actually be set, not just shown as a dismissable toast.
        const handleForcePausePlayback = (data: { remainingMinutes: number; limit: number; planName: string }) => {
            dispatch(setPlaybackBlocked(data));
            // Log once per limit hit, not once per person in the room. This event is broadcast
            // room-wide so everyone stops together, but the allowance is the host's — counting
            // it on every client would scale the funnel's denominator with room size.
            if (roomId && isHost) {
                trackDailyLimitReached(roomId, data.remainingMinutes, data.limit);
            }
        };

        // Live "X min left today" countdown for free users — fires on every daily-limit
        // check, independent of whether the limit has actually been reached yet.
        const handleUsageUpdated = (data: { remainingMinutes: number; limit: number }) => {
            dispatch(setDailyUsage(data));
        };

        socket.on(SocketEvent.HOST_LEFT, handleHostLeft);
        socket.on(SocketEvent.LEAVE_ROOM, handleRoomClosed);
        socket.on(SocketEvent.HOST_JOINED, handleHostJoined);
        socket.on(SocketEvent.ROOM_INFO_UPDATED, handleRoomInfoUpdated);
        socket.on(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
        socket.on(SocketEvent.PLAYLIST_UPDATED, handlePlaylistUpdated);
        socket.on(SocketEvent.HOST_PLAYBACK_STATE, handleHostPlaybackState);
        socket.on(SocketEvent.NOTIFY, handleOnNotify);
        socket.on(SocketEvent.FORCE_PAUSE_PLAYBACK, handleForcePausePlayback);
        socket.on(SocketEvent.USAGE_UPDATED, handleUsageUpdated);
        return () => {
            socket.off(SocketEvent.HOST_LEFT, handleHostLeft);
            socket.off(SocketEvent.LEAVE_ROOM, handleRoomClosed);
            socket.off(SocketEvent.HOST_JOINED, handleHostJoined);
            socket.off(SocketEvent.ROOM_INFO_UPDATED, handleRoomInfoUpdated);
            socket.off(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
            socket.off(SocketEvent.PLAYLIST_UPDATED, handlePlaylistUpdated);
            socket.off(SocketEvent.HOST_PLAYBACK_STATE, handleHostPlaybackState);
            socket.off(SocketEvent.NOTIFY, handleOnNotify);
            socket.off(SocketEvent.FORCE_PAUSE_PLAYBACK, handleForcePausePlayback);
            socket.off(SocketEvent.USAGE_UPDATED, handleUsageUpdated);
        };
    }, [socket, roomId, isHost, roomType, dispatch]);
    
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleUsersUpdated = (data: { roomId: string; users: UserInfo[]; hostLeft?: boolean }) => {
            if (data.roomId === roomId && Array.isArray(data.users)) {
                setParticipants(data.users);
                // !Commenting this now.. Because it does not look like it is usefull
                // if (typeof data.hostLeft === "boolean") {
                //     setHostLeft(data.hostLeft);
                // } else {
                //     setHostLeft(!data.users.some((user) => user.host));
                // }
            }
        };

        socket.on(SocketEvent.USERS_UPDATED, handleUsersUpdated);

        return () => {
            socket.off(SocketEvent.USERS_UPDATED, handleUsersUpdated);
        };
    }, [socket, roomId]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isJoined && socket && roomId) {
                // Track room left with duration
                if (joinTimeRef.current) {
                    const durationSec = Math.floor((Date.now() - joinTimeRef.current) / 1000);
                    trackRoomLeft(roomId, durationSec);
                }
                socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
                dispatch(setHostPlaybackPlaying(false));
            }
        };
    }, [isJoined, socket, roomId, dispatch]);

    // Seconds watched in this session only. Deliberately a ref, not Redux: the player
    // reports progress once a second, and nothing renders this value — keeping it in the
    // store re-rendered every consumer of the room slice on every tick.
    const captureWatchTime = useCallback(() => {
        if (!roomState.hostPlayback.playing || !socket) return;
        watchTimeRef.current += 1;
        socket.emit(SocketEvent.WATCH_TIME, {
            watchTime: watchTimeRef.current,
            roomId
        });
    }, [socket, roomId, roomState.hostPlayback.playing]);
    return (
        <RoomContext.Provider value={{
            isJoined,
            isLoading,
            roomType,
            streamDeliveryMode,
            hostLeft,
            roomClosed,
            // Only surfaced as "reconnecting" for someone who was actually in the room; a user
            // who never joined should just see the normal join/loading path.
            isReconnecting: isReconnecting && hasJoinedRef.current,
            connectionFailed,
            joinResponse,
            roomId,
            isHost,
            hostIsPremium,
            callDeliveryMode,
            username,
            leaveRoom,
            updatePlaylist,
            broadcastPlaylist,
            updateUserName,
            participants,
            captureWatchTime
        }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRoomContext must be used within a RoomProvider");
    }
    return context;
};
