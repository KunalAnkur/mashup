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

/**
 * The `purpose` a viewer's readiness announcement carries.
 *
 * These relays are shared and the server never interprets `purpose` — it copies it
 * across and the clients demultiplex. Streaming's own offers/answers/candidates carry
 * none (they are the original path), so this tag is only ever on the one message type
 * added here: "I am a viewer, I am listening, offer me the stream."
 */
const STREAM_VIEWER = "stream-viewer";

/**
 * How long after offering to a viewer we ignore a second request to.
 *
 * Long enough to swallow the cluster of signals that legitimately arrive together when
 * somebody's player mounts, short enough that a viewer whose connection genuinely
 * failed can ask again and be heard.
 */
const REOFFER_COOLDOWN_MS = 3_000;

interface PeerConnection {
    peerId: string;
    connection: RTCPeerConnection;
    stream?: MediaStream;
    /**
     * ICE candidates that arrived before this connection had a remote description.
     *
     * Trickle ICE starts the instant a peer sets its *local* description, so its candidates
     * are on the wire well before the other end has applied the offer or answer they belong
     * to. `addIceCandidate` throws with no remote description set, so they wait here and are
     * flushed the moment one exists. Dropping them instead leaves both ends with no candidate
     * pairs, and the connection negotiates perfectly, delivers tracks, and then carries no
     * media at all.
     */
    pendingCandidates: RTCIceCandidateInit[];
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
    const { joinResponse, participants } = useRoomContext();
    const tToast = useTranslations("toast");

    /** When we last offered to each viewer. See `REOFFER_COOLDOWN_MS`. */
    const lastOfferAtRef = useRef<Map<string, number>>(new Map());

    /** The offer we are currently waiting on, per viewer. See `createAndSendOffer`. */
    const negotiationRef = useRef<Map<string, string>>(new Map());

    // State
    const [isInitialized, setIsInitialized] = useState(false);
    /**
     * Synchronous mirror of `isInitialized`.
     *
     * The guard below has to be correct the instant it runs. React state is only correct after
     * the next render, so two calls landing in the same tick both saw `false`, both ran a full
     * initialisation, and each replaced the peer connection of the one before — leaving orphans
     * that keep gathering and trickling ICE for a connection nobody uses.
     */
    const isInitializedRef = useRef(false);
    const [trackUpdateCounter, setTrackUpdateCounter] = useState(0);

    // Refs for peer connections
    const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const initializingRef = useRef(false);
    const isSeekingRef = useRef(false);
    // Set when playback started before this socket was in the room, so the announcement can be
    // replayed once it is. See resumeProducers.
    const pendingPlaybackAnnounceRef = useRef(false);
    const iceServersRef = useRef<RTCIceServer[]>([
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]);
    /**
     * Candidates that arrived for a peer we have no connection object for yet — a candidate can
     * overtake the offer that would have created it. Merged into the connection's own queue as
     * soon as one exists.
     */
    const orphanCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    // Callback refs to avoid stale closures
    const getStreamRef = useRef(getStream);
    const onStreamReceivedRef = useRef(onStreamReceived);
    const onStreamPausedRef = useRef(onStreamPaused);
    const onStreamResumedRef = useRef(onStreamResumed);
    const onStreamStoppedRef = useRef(onStreamStopped);
    const participantsRef = useRef(participants);

    // Update callback refs
    useEffect(() => { getStreamRef.current = getStream; }, [getStream]);
    useEffect(() => { onStreamReceivedRef.current = onStreamReceived; }, [onStreamReceived]);
    useEffect(() => { onStreamPausedRef.current = onStreamPaused; }, [onStreamPaused]);
    useEffect(() => { onStreamResumedRef.current = onStreamResumed; }, [onStreamResumed]);
    useEffect(() => { onStreamStoppedRef.current = onStreamStopped; }, [onStreamStopped]);
    useEffect(() => { participantsRef.current = participants; }, [participants]);
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
     * Close and forget any connection we already hold for this peer.
     *
     * Replacing the map entry without this leaves the previous RTCPeerConnection alive and
     * unreferenced: it keeps its transports open and keeps trickling ICE candidates for a
     * session neither side is using, which is what filled the console with duplicate
     * "Sending ICE candidate" lines.
     */
    const closeExistingPeer = useCallback((peerId: string) => {
        const existing = peerConnectionsRef.current.get(peerId);
        if (!existing) return;

        try {
            existing.connection.close();
        } catch {
            // Already closed by the browser; nothing to do.
        }
        peerConnectionsRef.current.delete(peerId);
        console.log(`[P2P] Closed stale connection for ${peerId} before replacing it`);
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

            /*
             * Every offer is stamped, so its answer can be recognised.
             *
             * Each `RTCPeerConnection` allocates RTP header extension ids of its own
             * choosing. Applying an answer built against a *different* connection asks
             * the browser to reassign an id that is already live on that m-line, and it
             * refuses outright: "RTP extension ID reassignment not supported (collision
             * on active MID 0)". Worse, the connection is unusable afterwards, so the
             * next `createOffer` fails with the same message and nothing recovers.
             *
             * Matching on the signalling state alone is not enough — a fresh connection
             * mid-offer is in exactly the state a stale answer is accepted in.
             */
            const nonce = crypto.randomUUID();
            negotiationRef.current.set(peerId, nonce);

            if (socket && roomId) {
                console.log(`[P2P] Sending offer to ${peerId}`);
                socket.emit(SocketEvent.P2P_OFFER, {
                    roomId,
                    targetPeerId: peerId,
                    offer: pc.localDescription?.toJSON(),
                    nonce,
                });
            }
        } catch (error) {
            console.error(`[P2P] Error creating offer for ${peerId}:`, error);
            showError(tToast("connectionFailed"), tToast("unableToConnect"));
        }
    }, [socket, roomId, tToast]);

    /**
     * Apply every candidate held for a peer. Called immediately after a remote description is
     * set, which is the first moment the connection will accept them.
     */
    const flushPendingCandidates = useCallback(async (peerConn: PeerConnection) => {
        const orphaned = orphanCandidatesRef.current.get(peerConn.peerId);
        if (orphaned?.length) {
            peerConn.pendingCandidates.push(...orphaned);
            orphanCandidatesRef.current.delete(peerConn.peerId);
        }

        if (!peerConn.pendingCandidates.length) return;

        const queued = peerConn.pendingCandidates;
        peerConn.pendingCandidates = [];
        console.log(`[P2P] Flushing ${queued.length} queued ICE candidate(s) for ${peerConn.peerId}`);

        for (const candidate of queued) {
            try {
                await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error(`[P2P] Error adding queued ICE candidate from ${peerConn.peerId}:`, error);
            }
        }
    }, []);

    /**
     * Handles incoming offer from a peer
     */
    const handleOffer = useCallback(async (
        fromPeerId: string,
        offer: RTCSessionDescriptionInit,
        nonce?: string,
    ) => {
        try {
            console.log(`[P2P] Received offer from ${fromPeerId}`);
            
            /*
             * Always a fresh connection, never the one already filed under this peer.
             *
             * Every offer the host sends is for a connection it has just built — both
             * of its offer paths call `closeExistingPeer` and then `createPeerConnection`
             * before offering, so there is no such thing as a renegotiation offer here.
             * Reusing our side therefore means applying a brand-new session to a
             * connection negotiated for a previous one: the ICE credentials and the DTLS
             * fingerprint both belong to a peer that no longer exists, so it stays in
             * `connecting` and delivers nothing. It does not throw, which is why it
             * looked like the stream simply never arrived.
             */
            closeExistingPeer(fromPeerId);
            const pc0 = createPeerConnection(fromPeerId);
            const peerConn: PeerConnection = { peerId: fromPeerId, connection: pc0, pendingCandidates: [] };
            peerConnectionsRef.current.set(fromPeerId, peerConn);

            const pc = peerConn.connection;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            // The offering side has been trickling candidates since before this point; apply
            // whatever arrived while we had nothing to attach them to.
            await flushPendingCandidates(peerConn);

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (socket && roomId) {
                console.log(`[P2P] Sending answer to ${fromPeerId}`);
                socket.emit(SocketEvent.P2P_ANSWER, {
                    roomId,
                    targetPeerId: fromPeerId,
                    answer: pc.localDescription?.toJSON(),
                    // Straight back, untouched: it identifies their offer, not ours.
                    nonce,
                });
            }
        } catch (error) {
            console.error(`[P2P] Error handling offer from ${fromPeerId}:`, error);
        }
    }, [socket, roomId, createPeerConnection, flushPendingCandidates, closeExistingPeer]);

    /**
     * Handles incoming answer from a peer
     */
    const handleAnswer = useCallback(async (
        fromPeerId: string,
        answer: RTCSessionDescriptionInit,
        nonce?: string,
    ) => {
        try {
            console.log(`[P2P] Received answer from ${fromPeerId}`);
            const peerConn = peerConnectionsRef.current.get(fromPeerId);
            if (peerConn) {
                /*
                 * Only when we are still waiting for one.
                 *
                 * A stale answer is normal here, not a fault. The host rebuilds a peer
                 * connection and re-offers whenever a viewer says it is ready, and a
                 * viewer can legitimately say so more than once — on mount and again
                 * when the host announces it has started sharing. Two offers in flight
                 * means two answers coming back, and the second one arrives at a
                 * connection that is already `stable`.
                 *
                 * Without this the browser throws `InvalidStateError: Called in wrong
                 * state: stable`, which is alarming, useless, and describes a situation
                 * the code should simply shrug at. `PeerLink` has ignored exactly this
                 * for the same reason since it was written; this path never learned to.
                 */
                const expected = negotiationRef.current.get(fromPeerId);
                if (expected !== undefined && nonce !== undefined && nonce !== expected) {
                    // Somebody else's answer: it belongs to an offer we have replaced.
                    console.log(
                        `[P2P] Ignoring answer from ${fromPeerId} for a superseded negotiation`
                    );
                    return;
                }

                if (peerConn.connection.signalingState !== "have-local-offer") {
                    console.log(
                        `[P2P] Ignoring stale answer from ${fromPeerId} (state: ${peerConn.connection.signalingState})`
                    );
                    return;
                }

                await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log(`[P2P] Set remote description for ${fromPeerId}`);
                // The answering side started trickling as soon as it set its local description,
                // so its candidates were already queued before this line ran.
                await flushPendingCandidates(peerConn);
            }
        } catch (error) {
            console.error(`[P2P] Error handling answer from ${fromPeerId}:`, error);
        }
    }, [flushPendingCandidates]);

    /**
     * Handles incoming ICE candidate from a peer
     */
    const handleIceCandidate = useCallback(async (
        fromPeerId: string,
        candidate: RTCIceCandidateInit
    ) => {
        try {
            const peerConn = peerConnectionsRef.current.get(fromPeerId);

            // The connection may not exist yet: candidates can overtake the offer that
            // created it. Hold them keyed by peer so they survive until it does.
            if (!peerConn) {
                const queued = orphanCandidatesRef.current.get(fromPeerId) ?? [];
                queued.push(candidate);
                orphanCandidatesRef.current.set(fromPeerId, queued);
                console.log(`[P2P] Queued early ICE candidate from ${fromPeerId} (no connection yet)`);
                return;
            }

            // `addIceCandidate` throws without a remote description, and the remote one arrives
            // after the peer has already started trickling. Queue rather than drop — discarding
            // them leaves no candidate pairs, and the call then negotiates and delivers tracks
            // while carrying no media whatsoever.
            if (!peerConn.connection.remoteDescription) {
                peerConn.pendingCandidates.push(candidate);
                console.log(`[P2P] Queued ICE candidate from ${fromPeerId} (awaiting remote description)`);
                return;
            }

            await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`[P2P] Added ICE candidate from ${fromPeerId}`);
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

        /*
         * One negotiation per viewer at a time.
         *
         * This runs both when the server says somebody joined the room and when a
         * viewer announces that it is listening — and a viewer announces on mount and
         * again when the host says it has started sharing, because either side can be
         * first. Landing together, those produce two offers seconds apart, each from a
         * connection built by the line below that closes the previous one.
         *
         * Two offers means two answers, and the second belongs to a connection that no
         * longer exists. The guard in `handleAnswer` keeps that from throwing, but the
         * real fix is not to start the second negotiation: re-offering to somebody we
         * are already mid-offer with does not help them connect, it only gives them a
         * connection to throw away.
         */
        // "Never offered" is asked as a question rather than encoded as time zero: the
        // arithmetic happens to work on a real clock, but it reads as though the first
        // offer to anybody is on cooldown, which is the opposite of what is meant.
        const lastOffer = lastOfferAtRef.current.get(data.peerId);
        if (lastOffer !== undefined && Date.now() - lastOffer < REOFFER_COOLDOWN_MS) {
            console.log(`[P2P] Already offering to ${data.peerId}; skipping duplicate`);
            return;
        }
        lastOfferAtRef.current.set(data.peerId, Date.now());

        console.log(`[P2P] Peer joined: ${data.peerId} (${data.username})`);
        
        // Get local stream
        const stream = getStreamRef.current();
        if (!stream) {
            console.warn("[P2P] No local stream available to share");
            return;
        }

        // Create peer connection
        closeExistingPeer(data.peerId);
        const pc = createPeerConnection(data.peerId);
        const peerConn: PeerConnection = {
            peerId: data.peerId,
            connection: pc,
            pendingCandidates: [],
        };
        peerConnectionsRef.current.set(data.peerId, peerConn);

        // Add local stream tracks
        addLocalStreamToPeer(pc, stream);

        // Create and send offer
        await createAndSendOffer(data.peerId, pc);
    }, [isHost, roomId, createPeerConnection, addLocalStreamToPeer, createAndSendOffer, closeExistingPeer]);

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
        // Somebody who has gone and come back is a new negotiation, not a duplicate of
        // the one they left behind — so their cooldown goes with them.
        lastOfferAtRef.current.delete(data.peerId);
        negotiationRef.current.delete(data.peerId);
    }, []);

    // ============================================================================
    // Stream Control Functions
    // ============================================================================

    const notifyPausedPlayback = useCallback(() => {
        if (isSeekingRef.current || !isHost || !roomId) return;
        // Drop any deferred "playing" announcement: pausing before the join lands means it is no
        // longer true, and replaying it on join would report the room as playing while it is not.
        pendingPlaybackAnnounceRef.current = false;
        socket?.emit(SocketEvent.STREAM_PAUSED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
    }, [isHost, roomId, socket]);

    const resumeProducers = useCallback(async () => {
        if (!isHost || !roomId) return;

        // `enabled` is the room join having been acknowledged. The server resolves both events
        // below through its in-memory room membership and silently drops anything from a socket
        // it has not yet seen join, so emitting early is the same as not emitting at all.
        //
        // A screen share hits exactly that window: the player mounts and starts before the join
        // ack lands (see the pending-initialization retry in P2PStreamPlayer), so the room never
        // learned playback had started and the host's daily watch minutes never drained.
        // Re-sharing later worked only because the join was long since done.
        if (!enabled) {
            pendingPlaybackAnnounceRef.current = true;
            return;
        }

        socket?.emit(SocketEvent.STREAM_RESUMED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: true });
    }, [isHost, roomId, socket, enabled]);

    // Replay the announcement the moment the join lands. Also covers a reconnect: the rejoin
    // rebuilds the room's membership, and the host's playback state has to be restated for it.
    useEffect(() => {
        if (!enabled || !pendingPlaybackAnnounceRef.current) return;
        pendingPlaybackAnnounceRef.current = false;
        void resumeProducers();
    }, [enabled, resumeProducers]);

    const stopHostStream = useCallback((reason: string = "manual") => {
        if (!isHost || !roomId) return;
        console.log(`[P2P] Host stream stopped (${reason})`);

        // Close all peer connections
        peerConnectionsRef.current.forEach((peerConn) => {
            peerConn.connection.close();
        });
        peerConnectionsRef.current.clear();
        localStreamRef.current = null;
        // Reset initialized so a reshare triggers full re-initialization
        setIsInitialized(false);
        isInitializedRef.current = false;

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
        
        if (initializingRef.current || isInitializedRef.current) {
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

                    // Notify room that stream is ready (handles newly joining peers)
                    socket.emit(SocketEvent.P2P_STREAM_STARTED, { roomId });

                    // Re-offer to all participants already in the room (reshare case)
                    const currentParticipants = participantsRef.current;
                    for (const participant of currentParticipants) {
                        if (!participant.host && participant.socketId) {
                            console.log(`[P2P] Re-offering to existing participant ${participant.socketId}`);
                            // Recorded so a viewer announcing itself a moment later is
                            // treated as the duplicate it is — see `handlePeerJoined`.
                            lastOfferAtRef.current.set(participant.socketId, Date.now());
                            closeExistingPeer(participant.socketId);
                            const pc = createPeerConnection(participant.socketId);
                            const peerConn: PeerConnection = { peerId: participant.socketId, connection: pc, pendingCandidates: [] };
                            peerConnectionsRef.current.set(participant.socketId, peerConn);
                            addLocalStreamToPeer(pc, stream);
                            await createAndSendOffer(participant.socketId, pc);
                        }
                    }
                }
            } else {
                // Consumer: Just mark as initialized, will connect when host sends offer
                console.log("[P2P] Consumer initialized, waiting for host");
            }

            setIsInitialized(true);
            isInitializedRef.current = true;
        } catch (error) {
            console.error("[P2P] Init error:", error);
            showError(tToast("streamInitializationFailed"), tToast("unableToStartStreaming"));
        } finally {
            initializingRef.current = false;
        }
    }, [socket, roomId, isHost, enabled, replaceProducerTracks, createPeerConnection, addLocalStreamToPeer, createAndSendOffer, closeExistingPeer, tToast]);

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
        isInitializedRef.current = false;
    }, []);

    // ============================================================================
    // Event Handlers (useEffects)
    // ============================================================================

    // Listen for P2P signaling events
    useEffect(() => {
        if (!socket || !enabled) return;

        /**
         * Is this signalling ours?
         *
         * These three relays are shared. A `purpose` rides along on each of them so that
         * more than one peer connection can use the same path between the same two
         * people — today, movie-night streaming and a game's media link at the same
         * time. The server never interprets it: it copies it across and expects the
         * clients to demultiplex. Streaming is the original path and sends no `purpose`,
         * so anything that carries one belongs to somebody else.
         *
         * This hook did not check, and the consequences outlived the thing that caused
         * them. Every offer the game sent was answered here too, which left a peer
         * connection in `peerConnectionsRef` under the host's socket id holding the
         * *game's* SDP. Nothing cleaned it up when the game closed, because as far as
         * this hook knew it was a real viewer. The next real screen share found that
         * entry, reused it — `handleOffer` reuses any existing connection for the peer —
         * and applied a fresh offer to a connection negotiated for something else. The
         * participant saw nothing until they reloaded and the map was emptied.
         */
        const notOurs = (data: { purpose?: string }) => data.purpose !== undefined;

        const handleOfferEvent = (data: { roomId: string; fromPeerId: string; offer: RTCSessionDescriptionInit; purpose?: string; nonce?: string }) => {
            if (notOurs(data)) return;
            if (data.roomId === roomId) {
                handleOffer(data.fromPeerId, data.offer, data.nonce);
            }
        };

        const handleAnswerEvent = (data: { roomId: string; fromPeerId: string; answer: RTCSessionDescriptionInit; purpose?: string; nonce?: string }) => {
            if (notOurs(data)) return;
            if (data.roomId === roomId) {
                handleAnswer(data.fromPeerId, data.answer, data.nonce);
            }
        };

        const handleIceCandidateEvent = (data: { roomId: string; fromPeerId: string; candidate: RTCIceCandidateInit; purpose?: string }) => {
            if (notOurs(data)) return;
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

        /**
         * A viewer saying it is listening.
         *
         * The host only ever offers at two moments: when it starts sharing (walking the
         * participant roster) and when the server says somebody *joined the room*.
         * Neither covers a viewer whose player merely re-mounted — which is exactly
         * what happens on the way out of a game, because the activity surface and the
         * media player are alternatives and only one of them exists at a time.
         *
         * So a viewer that mounts into a room where sharing already started, or that
         * was not reachable at the instant the host walked the roster, waits forever:
         * the offer it needed either went to nobody or was never made, and nothing
         * retries. Reloading appeared to fix it only because rejoining the room is a
         * real join, which is the one signal the host does act on.
         *
         * This is that missing signal, carried on the announce relay the server already
         * has. The host answers it exactly as it answers a join.
         */
        const handlePeerAnnouncedEvent = (data: {
            roomId: string;
            fromPeerId: string;
            purpose?: string;
        }) => {
            if (data.purpose !== STREAM_VIEWER) return;   // not a viewer announcement
            if (data.roomId !== roomId || !isHost) return;
            handlePeerJoined({ peerId: data.fromPeerId, username: "", isHost: false });
        };

        socket.on(SocketEvent.P2P_OFFER, handleOfferEvent);
        socket.on(SocketEvent.P2P_ANSWER, handleAnswerEvent);
        socket.on(SocketEvent.P2P_ICE_CANDIDATE, handleIceCandidateEvent);
        socket.on(SocketEvent.P2P_PEER_JOINED, handlePeerJoinedEvent);
        socket.on(SocketEvent.P2P_PEER_LEFT, handlePeerLeftEvent);
        socket.on(SocketEvent.P2P_PEER_ANNOUNCED, handlePeerAnnouncedEvent);

        return () => {
            socket.off(SocketEvent.P2P_OFFER, handleOfferEvent);
            socket.off(SocketEvent.P2P_ANSWER, handleAnswerEvent);
            socket.off(SocketEvent.P2P_ICE_CANDIDATE, handleIceCandidateEvent);
            socket.off(SocketEvent.P2P_PEER_JOINED, handlePeerJoinedEvent);
            socket.off(SocketEvent.P2P_PEER_LEFT, handlePeerLeftEvent);
            socket.off(SocketEvent.P2P_PEER_ANNOUNCED, handlePeerAnnouncedEvent);
        };
    }, [socket, roomId, enabled, isHost, handleOffer, handleAnswer, handleIceCandidate, handlePeerJoined, handlePeerLeft]);

    /**
     * Tell the host we are listening — on mount, and again whenever it says it has
     * started sharing.
     *
     * Both halves are needed because either side can be first. Mounting after the host
     * started covers "I arrived late"; reacting to `P2P_STREAM_STARTED` covers "I was
     * already here but the host's roster walk did not reach me". The host closes any
     * existing connection to us before it re-offers, so an extra announcement costs a
     * renegotiation and never a broken connection.
     *
     * `P2P_STREAM_STARTED` had no listener anywhere before this. The host emits it with
     * the comment "handles newly joining peers", but nothing acted on it.
     */
    useEffect(() => {
        if (!socket || !roomId || !enabled || isHost) return;

        const announce = () => socket.emit(SocketEvent.P2P_ANNOUNCE, { roomId, purpose: STREAM_VIEWER });

        announce();
        socket.on(SocketEvent.P2P_STREAM_STARTED, announce);
        return () => {
            socket.off(SocketEvent.P2P_STREAM_STARTED, announce);
        };
    }, [socket, roomId, enabled, isHost]);

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

    // Held in a ref so the reconnect effect below can call the latest version without taking
    // it as a dependency — its identity changes on nearly every render, which would make the
    // effect re-run constantly and re-offer to every peer each time.
    const initializeRef = useRef(initializeFromJoinResponse);
    useEffect(() => {
        initializeRef.current = initializeFromJoinResponse;
    }, [initializeFromJoinResponse]);

    /**
     * Re-establish the host's outbound stream after a reconnect.
     *
     * Every other host initialization path is triggered by something that does not happen when
     * a connection comes back: the video element becoming ready, or the playlist item
     * changing. But the drop tore everything down — `resetState` closed every peer connection,
     * the server dropped this peer and told the guests the host had left, and the host returns
     * on a brand new socket id that none of the guests' old connections point at.
     *
     * Guests never initiate; by design only the host sends an offer. So without this the host
     * comes back, appears in the participant list, sends nothing, and everyone waits forever.
     * The SFU hook has had the equivalent of this all along (useStream.tsx); the P2P path was
     * missing it, which is why a premium host recovered from a network drop and a free one
     * did not.
     */
    const hasBeenEnabledRef = useRef(false);
    useEffect(() => {
        if (!socket || !enabled || !isHost) return;

        // Skip the first enable: that is the initial join, which the video-ready path owns.
        if (hasBeenEnabledRef.current) {
            console.log("[P2P] Host reconnected - re-establishing outbound stream");
            void initializeRef.current();
        }
        hasBeenEnabledRef.current = true;
    }, [socket, enabled, isHost]);

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
