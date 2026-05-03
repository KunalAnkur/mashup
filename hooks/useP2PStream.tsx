import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { useRoomContext } from "@/context/RoomContext";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";

interface UseP2PStreamParams {
    roomId: string | null;
    getStream: () => MediaStream | null;
    onStreamReceived?: (stream: MediaStream) => void;
    onStreamPaused?: () => void;
    onStreamResumed?: () => void;
    onStreamStopped?: () => void;
    isHost: boolean;
    enabled?: boolean;
    username: string;
    email?: string;
    profile?: string;
}

interface PeerConnection {
    peerId: string;
    connection: RTCPeerConnection;
    stream?: MediaStream;
}

export const useP2PStream = ({
    roomId,
    getStream,
    onStreamReceived,
    onStreamPaused,
    onStreamResumed,
    onStreamStopped,
    isHost,
    enabled = true,
    username,
    email,
    profile,
}: UseP2PStreamParams) => {
    const { socket } = useSocket();
    const { joinResponse } = useRoomContext();
    const tToast = useTranslations("toast");

    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [trackUpdateCounter, setTrackUpdateCounter] = useState(0);

    // Refs for peer connections
    const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const initializingRef = useRef(false);
    const isSeekingRef = useRef(false);
    const iceServersRef = useRef<RTCIceServer[]>([
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]);

    // Callback refs to avoid stale closures
    const getStreamRef = useRef(getStream);
    const onStreamReceivedRef = useRef(onStreamReceived);
    const onStreamPausedRef = useRef(onStreamPaused);
    const onStreamResumedRef = useRef(onStreamResumed);
    const onStreamStoppedRef = useRef(onStreamStopped);

    // Update callback refs
    useEffect(() => { getStreamRef.current = getStream; }, [getStream]);
    useEffect(() => { onStreamReceivedRef.current = onStreamReceived; }, [onStreamReceived]);
    useEffect(() => { onStreamPausedRef.current = onStreamPaused; }, [onStreamPaused]);
    useEffect(() => { onStreamResumedRef.current = onStreamResumed; }, [onStreamResumed]);
    useEffect(() => { onStreamStoppedRef.current = onStreamStopped; }, [onStreamStopped]);
    useEffect(() => {
        if (joinResponse?.iceServers?.length) {
            iceServersRef.current = joinResponse.iceServers;
        } else {
            iceServersRef.current = [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ];
        }
    }, [joinResponse?.iceServers]);

    // ============================================================================
    // Helper Functions
    // ============================================================================

    /**
     * Creates a silent audio track as fallback
     */
    const createSilentAudioTrack = useCallback((): MediaStreamTrack => {
        const ctx = new AudioContext();
        const dst = ctx.createMediaStreamDestination();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(dst);
        const buffer = ctx.createBuffer(1, 128, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        source.start();
        const track = dst.stream.getAudioTracks()[0];
        track.enabled = true;
        return track;
    }, []);

    /**
     * Creates a new RTCPeerConnection
     */
    const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
        console.log(`[P2P] Creating peer connection for ${peerId}`);
        const pc = new RTCPeerConnection({
            iceServers: iceServersRef.current,
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && roomId) {
                console.log(`[P2P] Sending ICE candidate to ${peerId}`);
                socket.emit(SocketEvent.P2P_ICE_CANDIDATE, {
                    roomId,
                    targetPeerId: peerId,
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[P2P] Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                console.warn(`[P2P] Connection with ${peerId} ${pc.connectionState}`);
                // Optionally attempt reconnection here
            }
        };

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`[P2P] ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
        };

        // For consumers: handle incoming tracks
        if (!isHost) {
            pc.ontrack = (event) => {
                console.log(`[P2P] Received track from ${peerId}:`, event.track.kind);
                const peerConn = peerConnectionsRef.current.get(peerId);
                if (peerConn) {
                    if (!peerConn.stream) {
                        peerConn.stream = new MediaStream();
                    }
                    peerConn.stream.addTrack(event.track);
                    
                    // Notify when we have both audio and video (or just one if that's all there is)
                    const audioTracks = peerConn.stream.getAudioTracks();
                    const videoTracks = peerConn.stream.getVideoTracks();
                    
                    if (audioTracks.length > 0 || videoTracks.length > 0) {
                        console.log(`[P2P] Stream ready from ${peerId}:`, {
                            audio: audioTracks.length,
                            video: videoTracks.length
                        });
                        onStreamReceivedRef.current?.(peerConn.stream);
                    }
                }
            };
        }

        return pc;
    }, [socket, roomId, isHost]);

    /**
     * Adds local stream tracks to a peer connection
     */
    const addLocalStreamToPeer = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
        console.log("[P2P] Adding local stream tracks to peer connection");
        stream.getTracks().forEach((track) => {
            console.log(`[P2P] Adding ${track.kind} track:`, track.id);
            pc.addTrack(track, stream);
        });
    }, []);

    /**
     * Creates and sends an offer to a peer
     */
    const createAndSendOffer = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
        try {
            console.log(`[P2P] Creating offer for ${peerId}`);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            if (socket && roomId) {
                console.log(`[P2P] Sending offer to ${peerId}`);
                socket.emit(SocketEvent.P2P_OFFER, {
                    roomId,
                    targetPeerId: peerId,
                    offer: pc.localDescription?.toJSON(),
                });
            }
        } catch (error) {
            console.error(`[P2P] Error creating offer for ${peerId}:`, error);
            showError(tToast("connectionFailed"), tToast("unableToConnect"));
        }
    }, [socket, roomId, tToast]);

    /**
     * Handles incoming offer from a peer
     */
    const handleOffer = useCallback(async (
        fromPeerId: string,
        offer: RTCSessionDescriptionInit
    ) => {
        try {
            console.log(`[P2P] Received offer from ${fromPeerId}`);
            
            let peerConn = peerConnectionsRef.current.get(fromPeerId);
            if (!peerConn) {
                const pc = createPeerConnection(fromPeerId);
                peerConn = { peerId: fromPeerId, connection: pc };
                peerConnectionsRef.current.set(fromPeerId, peerConn);
            }

            const pc = peerConn.connection;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (socket && roomId) {
                console.log(`[P2P] Sending answer to ${fromPeerId}`);
                socket.emit(SocketEvent.P2P_ANSWER, {
                    roomId,
                    targetPeerId: fromPeerId,
                    answer: pc.localDescription?.toJSON(),
                });
            }
        } catch (error) {
            console.error(`[P2P] Error handling offer from ${fromPeerId}:`, error);
        }
    }, [socket, roomId, createPeerConnection]);

    /**
     * Handles incoming answer from a peer
     */
    const handleAnswer = useCallback(async (
        fromPeerId: string,
        answer: RTCSessionDescriptionInit
    ) => {
        try {
            console.log(`[P2P] Received answer from ${fromPeerId}`);
            const peerConn = peerConnectionsRef.current.get(fromPeerId);
            if (peerConn) {
                await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log(`[P2P] Set remote description for ${fromPeerId}`);
            }
        } catch (error) {
            console.error(`[P2P] Error handling answer from ${fromPeerId}:`, error);
        }
    }, []);

    /**
     * Handles incoming ICE candidate from a peer
     */
    const handleIceCandidate = useCallback(async (
        fromPeerId: string,
        candidate: RTCIceCandidateInit
    ) => {
        try {
            const peerConn = peerConnectionsRef.current.get(fromPeerId);
            if (peerConn && peerConn.connection.remoteDescription) {
                await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`[P2P] Added ICE candidate from ${fromPeerId}`);
            }
        } catch (error) {
            console.error(`[P2P] Error adding ICE candidate from ${fromPeerId}:`, error);
        }
    }, []);

    /**
     * Handles new peer joining (host initiates connection)
     */
    const handlePeerJoined = useCallback(async (data: {
        peerId: string;
        username: string;
        isHost: boolean;
    }) => {
        if (!isHost || !roomId) return;
        
        console.log(`[P2P] Peer joined: ${data.peerId} (${data.username})`);
        
        // Get local stream
        const stream = getStreamRef.current();
        if (!stream) {
            console.warn("[P2P] No local stream available to share");
            return;
        }

        // Create peer connection
        const pc = createPeerConnection(data.peerId);
        const peerConn: PeerConnection = {
            peerId: data.peerId,
            connection: pc,
        };
        peerConnectionsRef.current.set(data.peerId, peerConn);

        // Add local stream tracks
        addLocalStreamToPeer(pc, stream);

        // Create and send offer
        await createAndSendOffer(data.peerId, pc);
    }, [isHost, roomId, createPeerConnection, addLocalStreamToPeer, createAndSendOffer]);

    /**
     * Handles peer leaving
     */
    const handlePeerLeft = useCallback((data: { peerId: string }) => {
        console.log(`[P2P] Peer left: ${data.peerId}`);
        const peerConn = peerConnectionsRef.current.get(data.peerId);
        if (peerConn) {
            peerConn.connection.close();
            peerConnectionsRef.current.delete(data.peerId);
        }
    }, []);

    // ============================================================================
    // Stream Control Functions
    // ============================================================================

    const notifyPausedPlayback = useCallback(() => {
        if (isSeekingRef.current || !isHost || !roomId) return;
        socket?.emit(SocketEvent.STREAM_PAUSED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
    }, [isHost, roomId, socket]);

    const resumeProducers = useCallback(async () => {
        if (!isHost || !roomId) return;
        socket?.emit(SocketEvent.STREAM_RESUMED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: true });
    }, [isHost, roomId, socket]);

    const stopHostStream = useCallback((reason: string = "manual") => {
        if (!isHost || !roomId) return;
        console.log(`[P2P] Host stream stopped (${reason})`);
        
        // Close all peer connections
        peerConnectionsRef.current.forEach((peerConn) => {
            peerConn.connection.close();
        });
        peerConnectionsRef.current.clear();
        
        socket?.emit(SocketEvent.STREAM_STOPPED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
    }, [isHost, roomId, socket]);

    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        if (!isHost || !roomId) return;

        console.log("[P2P] Replacing tracks for all peer connections");
        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((peerConn) => {
            const senders = peerConn.connection.getSenders();
            
            senders.forEach((sender) => {
                if (sender.track?.kind === "audio" && audioTrack) {
                    sender.replaceTrack(audioTrack).catch((error) => {
                        console.error("[P2P] Error replacing audio track:", error);
                    });
                } else if (sender.track?.kind === "video" && videoTrack) {
                    sender.replaceTrack(videoTrack).catch((error) => {
                        console.error("[P2P] Error replacing video track:", error);
                    });
                }
            });
        });

        localStreamRef.current = newStream;
        setTrackUpdateCounter((count) => count + 1);
    }, [isHost, roomId]);

    // ============================================================================
    // Initialization
    // ============================================================================

    const initializeFromJoinResponse = useCallback(async () => {
        console.log("[P2P] initializeFromJoinResponse called", { socket, roomId, enabled, isHost });
        
        if (!socket || !roomId || !enabled) return;
        
        if (initializingRef.current || isInitialized) {
            if (!isHost) return;
            
            // For host: replace tracks if stream changed
            const stream = getStreamRef.current();
            if (stream) {
                await replaceProducerTracks(stream);
            }
            return;
        }

        initializingRef.current = true;

        try {
            if (isHost) {
                // Host: Get local stream and prepare to share
                const stream = getStreamRef.current();
                if (stream) {
                    localStreamRef.current = stream;
                    console.log("[P2P] Host initialized with local stream");
                    
                    // Notify room that stream is ready
                    socket.emit(SocketEvent.P2P_STREAM_STARTED, { roomId });
                }
            } else {
                // Consumer: Just mark as initialized, will connect when host sends offer
                console.log("[P2P] Consumer initialized, waiting for host");
            }

            setIsInitialized(true);
        } catch (error) {
            console.error("[P2P] Init error:", error);
            showError(tToast("streamInitializationFailed"), tToast("unableToStartStreaming"));
        } finally {
            initializingRef.current = false;
        }
    }, [socket, roomId, isHost, enabled, isInitialized, replaceProducerTracks, tToast]);

    const resetState = useCallback(() => {
        console.log("[P2P] Resetting state");
        
        // Close all peer connections
        peerConnectionsRef.current.forEach((peerConn) => {
            peerConn.connection.close();
        });
        peerConnectionsRef.current.clear();
        
        localStreamRef.current = null;
        initializingRef.current = false;
        setIsInitialized(false);
    }, []);

    // ============================================================================
    // Event Handlers (useEffects)
    // ============================================================================

    // Listen for P2P signaling events
    useEffect(() => {
        if (!socket || !enabled) return;

        const handleOfferEvent = (data: { roomId: string; fromPeerId: string; offer: RTCSessionDescriptionInit }) => {
            if (data.roomId === roomId) {
                handleOffer(data.fromPeerId, data.offer);
            }
        };

        const handleAnswerEvent = (data: { roomId: string; fromPeerId: string; answer: RTCSessionDescriptionInit }) => {
            if (data.roomId === roomId) {
                handleAnswer(data.fromPeerId, data.answer);
            }
        };

        const handleIceCandidateEvent = (data: { roomId: string; fromPeerId: string; candidate: RTCIceCandidateInit }) => {
            if (data.roomId === roomId) {
                handleIceCandidate(data.fromPeerId, data.candidate);
            }
        };

        const handlePeerJoinedEvent = (data: { roomId: string; peerId: string; username: string; isHost: boolean }) => {
            if (data.roomId === roomId) {
                handlePeerJoined(data);
            }
        };

        const handlePeerLeftEvent = (data: { roomId: string; peerId: string }) => {
            if (data.roomId === roomId) {
                handlePeerLeft(data);
            }
        };

        socket.on(SocketEvent.P2P_OFFER, handleOfferEvent);
        socket.on(SocketEvent.P2P_ANSWER, handleAnswerEvent);
        socket.on(SocketEvent.P2P_ICE_CANDIDATE, handleIceCandidateEvent);
        socket.on(SocketEvent.P2P_PEER_JOINED, handlePeerJoinedEvent);
        socket.on(SocketEvent.P2P_PEER_LEFT, handlePeerLeftEvent);

        return () => {
            socket.off(SocketEvent.P2P_OFFER, handleOfferEvent);
            socket.off(SocketEvent.P2P_ANSWER, handleAnswerEvent);
            socket.off(SocketEvent.P2P_ICE_CANDIDATE, handleIceCandidateEvent);
            socket.off(SocketEvent.P2P_PEER_JOINED, handlePeerJoinedEvent);
            socket.off(SocketEvent.P2P_PEER_LEFT, handlePeerLeftEvent);
        };
    }, [socket, roomId, enabled, handleOffer, handleAnswer, handleIceCandidate, handlePeerJoined, handlePeerLeft]);

    // Listen for stream control events (consumers only)
    useEffect(() => {
        if (!socket || isHost || !enabled) return;

        const onPaused = () => onStreamPausedRef.current?.();
        const onResumed = () => onStreamResumedRef.current?.();
        const onStopped = () => {
            resetState();
            onStreamStoppedRef.current?.();
        };

        socket.on(SocketEvent.STREAM_PAUSED, onPaused);
        socket.on(SocketEvent.STREAM_RESUMED, onResumed);
        socket.on(SocketEvent.STREAM_STOPPED, onStopped);

        return () => {
            socket.off(SocketEvent.STREAM_PAUSED, onPaused);
            socket.off(SocketEvent.STREAM_RESUMED, onResumed);
            socket.off(SocketEvent.STREAM_STOPPED, onStopped);
        };
    }, [socket, isHost, enabled, resetState]);

    // Reset state when enabled changes
    useEffect(() => {
        if (!enabled) {
            console.log("[P2P] Disabled - resetting state");
            resetState();
        }
    }, [enabled, resetState]);

    // Cleanup on unmount
    useEffect(() => () => resetState(), [resetState]);

    // ============================================================================
    // Public API
    // ============================================================================

    return {
        isInitialized,
        initializeFromJoinResponse,
        pauseProducers: notifyPausedPlayback,
        resumeProducers,
        stopStream: stopHostStream,
        resetState,
        onPause: (event?: string) => {
            if (event === 'seekend' || isSeekingRef.current) return;
            notifyPausedPlayback();
        },
        onPlay: (event?: string) => {
            if (isSeekingRef.current) return;
            resumeProducers();
        },
        onSeekStart: () => {
            isSeekingRef.current = true;
        },
        onSeekEnd: () => {
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 100);
        },
    };
};

// Made with Bob
