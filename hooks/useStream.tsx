import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";

interface UseStreamParams {
    roomId: string | null;
    getStream: () => MediaStream | null;
    onStreamReceived?: (stream: MediaStream) => void;
    onStreamPaused?: () => void;
    onStreamResumed?: () => void;
    onStreamStopped?: () => void;
    // onStreamHasVideo?: (hasVideoTrack: boolean) => void;
    isHost: boolean;
    enabled?: boolean;
}

export const useStream = ({
    roomId,
    getStream,
    onStreamReceived,
    onStreamPaused,
    onStreamResumed,
    onStreamStopped,
    // onStreamHasVideo,
    isHost,
    enabled = true,
}: UseStreamParams) => {
    const { socket } = useSocket();
    const tToast = useTranslations("toast");

    const [trackUpdateCounter, setTrackUpdateCounter] = useState(0);
    // State
    const [isInitialized, setIsInitialized] = useState(false);

    // MediaSoup refs
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const producerTransportRef = useRef<Transport | null>(null);
    const consumerTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
    const reconnectCountRef = useRef(0);
    const consumersRef = useRef<Consumer[]>([]);
    const initializingRef = useRef(false);
    const isSeekingRef = useRef(false);
    // Set when playback started before this socket was in the room, so the announcement can be
    // replayed once it is. See resumeProducers.
    const pendingPlaybackAnnounceRef = useRef(false);
    // Callback refs to avoid stale closures
    const getStreamRef = useRef(getStream);
    const onStreamReceivedRef = useRef(onStreamReceived);
    const onStreamPausedRef = useRef(onStreamPaused);
    const onStreamResumedRef = useRef(onStreamResumed);
    const onStreamStoppedRef = useRef(onStreamStopped);
    // const onStreamHasVideoRef = useRef(onStreamHasVideo);
    // Update callback refs
    useEffect(() => { getStreamRef.current = getStream; }, [getStream]);
    useEffect(() => { onStreamReceivedRef.current = onStreamReceived; }, [onStreamReceived]);
    useEffect(() => { onStreamPausedRef.current = onStreamPaused; }, [onStreamPaused]);
    useEffect(() => { onStreamResumedRef.current = onStreamResumed; }, [onStreamResumed]);
    useEffect(() => { onStreamStoppedRef.current = onStreamStopped; }, [onStreamStopped]);
    // useEffect(() => { onStreamHasVideoRef.current = onStreamHasVideo; }, [onStreamHasVideo]);
    // ============================================================================
    // Helper Functions
    // ============================================================================

    const resetState = useCallback(() => {
        if (!socket || !roomId) return;
        console.log("[STREAM] Resetting state");
        audioProducerRef.current?.close();
        videoProducerRef.current?.close();
        consumersRef.current.forEach(c => c.close());
        producerTransportRef.current?.close();
        consumerTransportRef.current?.close();

        audioProducerRef.current = null;
        videoProducerRef.current = null;
        consumersRef.current = [];
        deviceRef.current = null;
        producerTransportRef.current = null;
        consumerTransportRef.current = null;
        initializingRef.current = false;
        setIsInitialized(false);
        if (isHost) {
            socket.emit(SocketEvent.CLEANUP_STREAM_ROOM, { roomId });
        }
    }, [socket, roomId, isHost]);

    const closeConsumerMedia = useCallback(() => {
        consumersRef.current.forEach((consumer) => {
            try {
                if (!consumer.closed) {
                    consumer.close();
                }
            } catch (error) {
                console.warn("[STREAM] Error closing consumer on cleanup:", error);
            }
        });
        consumersRef.current = [];
    }, []);

    const closeHostProducers = useCallback(() => {
        let closedAny = false;

        if (audioProducerRef.current) {
            try {
                if (!audioProducerRef.current.closed) {
                    audioProducerRef.current.close();
                    closedAny = true;
                }
            } catch (error) {
                console.warn("[STREAM] Error closing audio producer:", error);
            } finally {
                audioProducerRef.current = null;
            }
        }

        if (videoProducerRef.current) {
            try {
                if (!videoProducerRef.current.closed) {
                    videoProducerRef.current.close();
                    closedAny = true;
                }
            } catch (error) {
                console.warn("[STREAM] Error closing video producer:", error);
            } finally {
                videoProducerRef.current = null;
            }
        }

        return closedAny;
    }, []);

    const stopHostStream = useCallback((reason: string = "manual") => {
        if (!isHost || !roomId) return;

        const hadLiveProducers = closeHostProducers();
        if (hadLiveProducers) {
            console.log(`[STREAM] Host stream stopped (${reason})`);
        }

        // Close the send transport — this propagates transportclose to server-side
        // producers, cleaning them from peer.producers automatically
        if (producerTransportRef.current && !producerTransportRef.current.closed) {
            producerTransportRef.current.close();
        }
        producerTransportRef.current = null;
        deviceRef.current = null;
        // Reset so resharing triggers full re-initialization with a fresh transport
        setIsInitialized(false);

        socket?.emit(SocketEvent.STREAM_STOPPED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
    }, [closeHostProducers, isHost, roomId, socket]);
    /**
     * Notifies listeners that tracks have been updated
     */
    
    const replaceEndedTracks = useCallback(async () => {
        const newStream = getStreamRef.current();
        if (!newStream) return;

        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];
        let tracksReplaced = false;

        try {
            if (audioProducerRef.current && !audioProducerRef.current.closed && audioTrack?.readyState === 'live') {
                await audioProducerRef.current.replaceTrack({ track: audioTrack });
                tracksReplaced = true;
            }
            if (videoProducerRef.current && !videoProducerRef.current.closed && videoTrack?.readyState === 'live') {
                await videoProducerRef.current.replaceTrack({ track: videoTrack });
                tracksReplaced = true;
            }

            if (tracksReplaced) {
                setTrackUpdateCounter((count) => count + 1);
            }
        } catch (error) {
            console.error("[STREAM] Replace ended tracks error:", error);
            showError(tToast("videoRestartFailed"), tToast("unableToRestart"));
        }
    }, []);
    /**
     * Checks if producer tracks are ended
     */
    const areTracksEnded = useCallback(() => {
        const audioTrack = audioProducerRef.current?.track;
        const videoTrack = videoProducerRef.current?.track;
        return (audioTrack?.readyState === 'ended') || (videoTrack?.readyState === 'ended');
    }, []);
    /**
         * Broadcasts that the host paused local playback without pausing producers.
         * Keeping the captured video track live allows consumers to keep rendering
         * the last captured frame instead of falling back to black.
         */
    const notifyPausedPlayback = useCallback(() => {
        if (isSeekingRef.current || !isHost || !roomId) return;
        // Drop any deferred "playing" announcement: pausing before the join lands means it is no
        // longer true, and replaying it on join would report the room as playing while it is not.
        pendingPlaybackAnnounceRef.current = false;
        socket?.emit(SocketEvent.STREAM_PAUSED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
    }, [isHost, roomId, socket]);

    /**
     * Resumes audio and video producers
     */
    const resumeProducers = useCallback(async () => {
        if (!isHost || !roomId) return;

        // `enabled` is the room join having been acknowledged. The server resolves both events
        // below through its in-memory room membership and silently drops anything from a socket
        // it has not yet seen join, so emitting early is the same as not emitting at all.
        //
        // A screen share hits exactly that window: the player mounts and starts before the join
        // ack lands (P2PStreamPlayer keeps a pending-initialization retry for the same reason),
        // so the room never learned playback had started and the host's daily watch minutes
        // never drained. Re-sharing later worked only because the join was long since done.
        if (!enabled) {
            pendingPlaybackAnnounceRef.current = true;
            return;
        }

        // If tracks are ended, replace them first
        if (areTracksEnded()) {
            await new Promise(r => setTimeout(r, 100));
            await replaceEndedTracks();
        }

        if (audioProducerRef.current?.paused) audioProducerRef.current.resume();
        if (videoProducerRef.current?.paused) videoProducerRef.current.resume();
        socket?.emit(SocketEvent.STREAM_RESUMED, { roomId });
        socket?.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: true });
    }, [isHost, roomId, socket, enabled, areTracksEnded, replaceEndedTracks]);

    // Replay the announcement the moment the join lands. Also covers a reconnect: the rejoin
    // rebuilds the room's membership, and the host's playback state has to be restated for it.
    useEffect(() => {
        if (!enabled || !pendingPlaybackAnnounceRef.current) return;
        pendingPlaybackAnnounceRef.current = false;
        void resumeProducers();
    }, [enabled, resumeProducers]);

    
    /**
     * Creates a truly silent audio track as fallback
     * Uses a silent buffer with gain 0 to ensure no sound is produced
     * Note: AudioContext is stored in ref for cleanup
     */
    const createSilentAudioTrack = useCallback((): MediaStreamTrack => {
        const ctx = new AudioContext();
        const dst = ctx.createMediaStreamDestination();

        // Create a gain node set to 0 for complete silence
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // Zero gain = no sound output
        gainNode.connect(dst);

        // Create a silent buffer (filled with zeros by default)
        // Use a small buffer to minimize memory usage
        const buffer = ctx.createBuffer(1, 128, ctx.sampleRate);

        // Create a buffer source with the silent buffer
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // Loop the silent buffer to keep the track "live"
        source.connect(gainNode);
        source.start();

        const track = dst.stream.getAudioTracks()[0];
        track.enabled = true; // Track is enabled but produces silence (gain is 0)

        return track;
    }, []);

    /**
     * Waits for transport to be connected
     * Returns a promise that resolves when transport is connected or after timeout
     */
    const waitForTransportConnection = useCallback((transport: Transport, timeoutMs: number = 3000): Promise<void> => {
        return new Promise<void>((resolve) => {
            // Check if already connected
            if (transport.connectionState === 'connected') {
                resolve();
                return;
            }
            
            // Listen for connect event
            const onConnect = () => {
                transport.off('connect', onConnect);
                resolve();
            };
            transport.on('connect', onConnect);
            
            // Timeout - proceed anyway
            setTimeout(() => {
                transport.off('connect', onConnect);
                console.warn(`[STREAM] Transport connection timeout after ${timeoutMs}ms, proceeding anyway`);
                resolve();
            }, timeoutMs);
        });
    }, []);

    /**
     * Creates transport connect handler and stores it for cleanup
     */
    const createConnectHandler = useCallback((transport: Transport, currentRoomId: string) => {
        const connectHandler = async ({ dtlsParameters }: any, callback: any, errback: any) => {
            try {
                const res = await socket?.emitWithAck(SocketEvent.CONNECT_TRANSPORT, {
                    transportId: transport.id,
                    dtlsParameters,
                    roomId: currentRoomId,
                });
                res?.success ? callback() : errback(new Error(res?.error));
            } catch (e) {
                errback(e as Error);
            }
        };
        
        transport.on("connect", connectHandler);
    }, [socket]);

    // ============================================================================
    // Producer Functions (Host Only)
    // ============================================================================

    /**
     * Creates audio and video producers from a stream
     */
    const createProducers = useCallback(async (transport: Transport, stream: MediaStream, currentRoomId: string) => {
        if (!socket || audioProducerRef.current || videoProducerRef.current) return;

        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        console.log("producer called createProducers called", audioTrack, videoTrack);
        // Create audio producer - use actual track if live, otherwise use silent track
        if (audioTrack?.readyState === 'live') {
            console.log("[DEBUG] = Audio Producer Started");
            audioProducerRef.current = await transport.produce({ track: audioTrack });
            console.log("[STREAM] Created audio producer with live track");
        } else {
            // No audio track or track not live - use silent track as fallback
            console.log("[DEBUG] = Audio Producer Started with silent track");
            audioProducerRef.current = await transport.produce({ track: createSilentAudioTrack() });
            console.log("[STREAM] Created audio producer with silent track (no audio track or track not live)");
        }

        // Create video producer
        if (videoTrack?.readyState === 'live') {
            console.log("[DEBUG] = Video Producer Started");
            videoProducerRef.current = await transport.produce({ track: videoTrack });
        }

        if (audioProducerRef.current || videoProducerRef.current) {
            setTrackUpdateCounter((count) => count + 1);
        }

        // Notify consumers about new producers
        const producers = [
            audioProducerRef.current && { kind: 'audio', peerId: socket.id, producerId: audioProducerRef.current.id },
            videoProducerRef.current && { kind: 'video', peerId: socket.id, producerId: videoProducerRef.current.id },
        ].filter(Boolean);

        if (producers.length) {
            console.log("producer called createProducers called", { producers });
            socket.emit(SocketEvent.INCOMING_PRODUCER, {
                roomId: currentRoomId,
                producers: { [socket.id!]: producers }
            });
        }
    }, [socket, createSilentAudioTrack]);
    useEffect(() => {
        if (!socket || isHost || !enabled) return;
        const onPaused = () => onStreamPausedRef.current?.();
        const onResumed = () => onStreamResumedRef.current?.();
        socket.on(SocketEvent.STREAM_PAUSED, onPaused);
        socket.on(SocketEvent.STREAM_RESUMED, onResumed);
        return () => {
            socket.off(SocketEvent.STREAM_PAUSED, onPaused);
            socket.off(SocketEvent.STREAM_RESUMED, onResumed);
        };
    }, [socket, isHost, enabled]);
    /**
     * Replaces tracks on existing producers
     */
    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        if (!isHost || !roomId || !socket) return;

        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];
        let tracksReplaced = false;
        try {
            if (audioProducerRef.current && !audioProducerRef.current.closed && audioTrack) {
                console.log("[DEBUG] = Audio Producer Replaced");
                await audioProducerRef.current.replaceTrack({ track: audioTrack });
                tracksReplaced = true;
            }
            if (videoProducerRef.current && !videoProducerRef.current.closed && videoTrack) {
                console.log("[DEBUG] = Video Producer Replaced");
                await videoProducerRef.current.replaceTrack({ track: videoTrack });
                tracksReplaced = true;
            }
            if (tracksReplaced) {
                setTrackUpdateCounter((count) => count + 1);
            }
            // * commenting this below because we are anymore going to use from redux slice
            // console.log("[Stream] Stream has video track: ==", { videoTrack, audioTrack });
            // socket?.emit(SocketEvent.STREAM_HAS_VIDEO, { roomId, hasVideoTrack: videoTrack ? true : false });
        } catch (error) {
            console.error("[STREAM] Replace tracks error:", error);
            showError(tToast("videoUpdateFailed"), tToast("unableToUpdate"));
        }
    }, [isHost, roomId, socket]);


    // ============================================================================
    // Consumer Functions (Non-Host Only)
    // ============================================================================

    /**
     * Consumes producers from the host
     */
    const consumeProducers = useCallback(async (
        producerList: { producerId: string; kind: string }[],
        device: mediasoupClient.Device,
        transport: Transport,
        currentRoomId: string
    ) => {
        if (!socket) return;

        const tracks: MediaStreamTrack[] = [];

        for (const info of producerList) {
            try {
                const response = await socket.emitWithAck(SocketEvent.CONSUME, {
                    transportId: transport.id,
                    producerId: info.producerId,
                    roomId: currentRoomId,
                    rtpCapabilities: device.rtpCapabilities,
                });

                if (!response?.consumerData) continue;

                const consumer = await transport.consume(response.consumerData);
                await consumer.resume();
                consumersRef.current.push(consumer);
                tracks.push(consumer.track);
            } catch (error) {
                // Logged, not surfaced: one producer failing to consume is recoverable — the
                // remaining tracks still play, and INCOMING_PRODUCER retries the set — so a toast
                // would cry wolf on a transient failure. Silence was worse though: a video
                // producer that fails here leaves the consumer holding audio alone, which renders
                // as a black screen with no error anywhere. That is indistinguishable, from the
                // outside, from a stream that never arrived.
                console.error(
                    `[STREAM] Consumer: failed to consume ${info.kind} producer ${info.producerId}:`,
                    error
                );
            }
        }

        if (tracks.length) {
            // Which kinds actually made it through. A set without a video track is the black
            // screen, and this is the line that says so instead of leaving it to be guessed.
            console.log(
                `[STREAM] Consumer: consuming ${tracks.length}/${producerList.length} producer(s) —`,
                tracks.map((track) => track.kind).join(", ") || "none"
            );

            await socket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, {
                roomId: currentRoomId,
                consumerIds: consumersRef.current.map(c => c.id),
            });
            onStreamReceivedRef.current?.(new MediaStream(tracks));
        }
    }, [socket]);

   
    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initializes MediaSoup from join response
     */
    const initializeFromJoinResponse = useCallback(async () => {
        console.log("initializeFromJoinResponse called", { socket, roomId, enabled });
        if (!socket || !roomId || !enabled) return;
        // ! here we will going to check if this is first time initializing or it is just a replacing the video. in that case we will use the below condition
        if (initializingRef.current || (isInitialized && deviceRef.current)) {
            if (!isHost) return;
            // here we will going to replace the tracks
            const stream = getStreamRef.current();
            const producerTransport = producerTransportRef.current;
            if (stream && producerTransport && !producerTransport.closed) {
                await createProducers(producerTransport, stream, roomId);
                await replaceProducerTracks(stream);
            } else if (stream) {
                await replaceProducerTracks(stream);
            }
            return;
        };
        const { response: joinResponse, success } = await socket.emitWithAck(SocketEvent.GET_TRANSPORT_INFO, {
            roomId,
            host: isHost,
        });
        console.log("GET_TRANSPORT_INFO called", { joinResponse, success });
        if (!success) {
            console.warn("[STREAM] Get transport info failed:", joinResponse);
            return;
        }
        // Validate joinResponse
        // * Anymore we will be getting this from a separate event
        // if (!joinResponse.rtpCapabilities ||
        //     typeof joinResponse.rtpCapabilities !== 'object' ||
        //     Array.isArray(joinResponse.rtpCapabilities)) {
        //     console.warn("[STREAM] Invalid joinResponse.rtpCapabilities");
        //     return;
        // }
        console.log("initializeFromJoinResponse called", joinResponse, consumerTransportRef.current, producerTransportRef.current);
        initializingRef.current = true;
        try {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities: joinResponse.rtpCapabilities });
            deviceRef.current = device;
            
            if (isHost) {
                if (!joinResponse.sendTransportOptions) throw new Error("No sendTransportOptions");
                console.log("[STREAM] Creating send transport", joinResponse);
                const transport = device.createSendTransport({
                    ...joinResponse.sendTransportOptions,
                    iceServers: joinResponse.iceServers,
                });
                createConnectHandler(transport, roomId);

                const produceHandler = async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
                    try {
                        const res = await socket.emitWithAck(SocketEvent.PRODUCE, {
                            transportId: transport.id,
                            kind,
                            rtpParameters,
                            roomId,
                        });
                        res?.success ? callback({ id: res.id }) : errback(new Error(res?.error));
                    } catch (e) {
                        errback(e as Error);
                    }
                };
                
                transport.on("produce", produceHandler);
                

                producerTransportRef.current = transport;

                await new Promise(r => setTimeout(r, 800));
                const stream = getStreamRef.current();
                if (stream) await createProducers(transport, stream, roomId);
            } 
            else {
                if (!joinResponse.recvTransportOptions) throw new Error("No recvTransportOptions");
                const transport = device.createRecvTransport({
                    ...joinResponse.recvTransportOptions,
                    iceServers: joinResponse.iceServers,
                });
                createConnectHandler(transport, roomId);
                consumerTransportRef.current = transport;
                
                // Wait for transport to be connected before consuming
                // The transport will connect asynchronously via the connect handler
                // await waitForTransportConnection(transport, 3000);
                
                // Consume existing producers
                const existing = joinResponse.existingProducers;
                console.log("[STREAM] Consumer: existingProducers from GET_TRANSPORT_INFO:", existing);
                if (existing && Object.keys(existing).length > 0) {
                    for (const peerId of Object.keys(existing)) {
                        const producers = existing[peerId];
                        if (producers?.length) {
                            console.log(`[STREAM] Consumer: Consuming ${producers.length} existing producers from ${peerId}`);
                            await consumeProducers(producers.slice(-2), device, transport, roomId);
                        }
                    }
                } else {
                    console.log("[STREAM] Consumer: No existing producers found, will wait for INCOMING_PRODUCER event");
                }
            }

            setIsInitialized(true);
        } catch (error) {
            console.error("[STREAM] Init error:", error);
            showError(tToast("streamInitializationFailed"), tToast("unableToStartStreaming"));
        } finally {
            initializingRef.current = false;
        }
    }, [socket, roomId, isHost, enabled, isInitialized, createConnectHandler, createProducers, consumeProducers]);

    /**
     * Rebuild this consumer's device and receive transport.
     *
     * Asks GET_TRANSPORT_INFO, not JOIN_ROOM. The join ack stopped carrying `rtpCapabilities`
     * and `recvTransportOptions` when transport setup moved to its own event (see the server's
     * join handler — it answers with room, users, chat and delivery mode only), so the old
     * rejoin could never satisfy its own validation: it bailed on every single call. The caller
     * reaches here only after `resetState` has already torn the consumer down, which turned
     * this dead branch into a viewer whose stream never came back.
     */
    const reinitializeConsumer = useCallback(async (roomId: string) => {
        if (!socket) return null;

        try {
            const { response, success } = await socket.emitWithAck(SocketEvent.GET_TRANSPORT_INFO, {
                roomId,
                host: false,
            });

            if (!success || !response?.rtpCapabilities || !response?.recvTransportOptions) {
                console.error("[useStream] Consumer reinit failed:", response);
                return null;
            }

            if (typeof response.rtpCapabilities !== 'object' || Array.isArray(response.rtpCapabilities)) {
                console.warn("[useStream] Invalid rtpCapabilities");
                return null;
            }

            const newDevice = new mediasoupClient.Device();
            await newDevice.load({ routerRtpCapabilities: response.rtpCapabilities });
            deviceRef.current = newDevice;

            const newTransport = newDevice.createRecvTransport({
                ...response.recvTransportOptions,
                iceServers: response.iceServers,
            });
            createConnectHandler(newTransport, roomId);
            consumerTransportRef.current = newTransport;
            setIsInitialized(true);

            return { device: newDevice, transport: newTransport };
        } catch (error) {
            console.error("[STREAM] Reinit error:", error);
            showError(tToast("streamReconnectionFailed"), tToast("unableToReconnect"));
            return null;
        }
        // Deliberately not depending on the room slice any more. It used to be read here for the
        // rejoin payload, which made this callback — and therefore the INCOMING_PRODUCER listener
        // that depends on it — churn on every playlist, playback and usage update.
    }, [socket, createConnectHandler]);

    // ============================================================================
    // Event Handlers (useEffects)
    // ============================================================================

    useEffect(() => {
        if (!socket || isHost || !enabled) return;
        const handleStreamStopped = () => {
            closeConsumerMedia();
            onStreamStoppedRef.current?.();
        };
        socket.on(SocketEvent.STREAM_STOPPED, handleStreamStopped);
        return () => { socket.off(SocketEvent.STREAM_STOPPED, handleStreamStopped); };
    }, [socket, isHost, enabled, closeConsumerMedia]);
    
    useEffect(() => {
        if (!socket || !enabled) return;
        if (reconnectCountRef.current > 0) {
            initializeFromJoinResponse()
        };
        reconnectCountRef.current++;
    }, [socket, enabled]);

    // useEffect(() => {
    //     if (!isHost || !enabled || !isInitialized) return;

    //     const handleTrackEnded = () => {
    //         console.log("[useStream] Track ended - cleaning up producers");
    //         try {
    //             if (audioProducerRef.current && !audioProducerRef.current.closed) {
    //                 audioProducerRef.current.close();
    //             }
    //         } catch (error) {
    //             console.warn("[STREAM] Error closing audio producer on track end:", error);
    //         }
    //         audioProducerRef.current = null;

    //         try {
    //             if (videoProducerRef.current && !videoProducerRef.current.closed) {
    //                 videoProducerRef.current.close();
    //             }
    //         } catch (error) {
    //             console.warn("[STREAM] Error closing video producer on track end:", error);
    //         }
    //         videoProducerRef.current = null;
            
    //         setIsInitialized(false);
    //         socket?.emit(SocketEvent.STREAM_STOPPED, { roomId });
    //     };

    //     const tracks: MediaStreamTrack[] = [];
    //     const audioTrack = audioProducerRef.current?.track;
    //     const videoTrack = videoProducerRef.current?.track;

    //     if (audioTrack) tracks.push(audioTrack);
    //     if (videoTrack) tracks.push(videoTrack);

    //     if (tracks.length === 0) return;

    //     // Store cleanup functions for each track
    //     tracks.forEach(track => {
    //         track.addEventListener('ended', handleTrackEnded);
    //         // trackEventListenersRef.current.set(track, () => {
    //         //     track.removeEventListener('ended', handleTrackEnded);
    //         // });
    //     });

    //     return () => {
    //         // Clean up all track listeners
    //         // tracks.forEach(track => {
    //         //     const cleanup = trackEventListenersRef.current.get(track);
    //         //     if (cleanup) {
    //         //         cleanup();
    //         //         trackEventListenersRef.current.delete(track);
    //         //     }
    //         // });
    //     };
    // }, [isHost, enabled, isInitialized, socket, roomId]);

    useEffect(() => {
        if (!isHost || !enabled || !isInitialized) return;

        const handleTrackEnded = () => {
            console.log("[useStream] Producer track ended - stopping host stream");
            stopHostStream("producer-track-ended");
        };

        const tracks: MediaStreamTrack[] = [];
        const audioTrack = audioProducerRef.current?.track;
        const videoTrack = videoProducerRef.current?.track;

        if (audioTrack) tracks.push(audioTrack);
        if (videoTrack) tracks.push(videoTrack);

        if (tracks.length === 0) return;

        tracks.forEach(track => {
            track.addEventListener('ended', handleTrackEnded);
        });

        return () => {
            tracks.forEach(track => {
                track.removeEventListener('ended', handleTrackEnded);
            });
        };
    }, [isHost, enabled, isInitialized, trackUpdateCounter, stopHostStream]);

    useEffect(() => {
        if (!socket || isHost || !enabled || !roomId) return;

        const handleIncomingProducer = async (data: { roomId: string; producers: Record<string, any[]> }) => {
            if (data.roomId !== roomId) return;

            // Setup may still be in flight. On a sync -> stream switch both sides build their
            // mediasoup state from the same playlist broadcast, so the host's producers can be
            // announced while this consumer is still waiting on GET_TRANSPORT_INFO. Reading the
            // refs now would find no transport, and the branch below would answer that by
            // resetting and rebuilding the very setup that is milliseconds from being ready.
            // Wait for it instead.
            if (initializingRef.current) {
                console.log("[STREAM] Producers announced during setup - waiting for it to finish");
                for (let attempt = 0; attempt < 50 && initializingRef.current; attempt++) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }

            const device = deviceRef.current;
            const transport = consumerTransportRef.current;
            const needsReinit = !device || !transport || transport.closed;
            console.log("[STREAM] handleIncomingProducer called", data, { 
                hasDevice: !!device, 
                hasTransport: !!transport, 
                transportClosed: transport?.closed,
                transportState: transport?.connectionState 
            });
            console.log("initializeFromJoinResponse called", { producers: data.producers, consumersRef: consumersRef.current, needsReinit });
            // if (consumersRef.current.length) return;
            if (needsReinit) {
                console.log("[STREAM] Consumer transport not ready, reinitializing for incoming producers");
                resetState();

                const result = await reinitializeConsumer(roomId);
                if (!result) return;

                await new Promise(r => setTimeout(r, 300));

                try {
                    for (const peerId of Object.keys(data.producers)) {
                        if (data.producers[peerId]?.length) {
                            console.log(`[STREAM] Consuming ${data.producers[peerId].length} producers from ${peerId} after reinit`);
                            await consumeProducers(data.producers[peerId], result.device, result.transport, roomId);
                        }
                    }
                } catch (error) {
                    console.error("[STREAM] Error consuming producers after reinit:", error);
                }
                return;
            }

            // Wait for transport to be connected if not already
            if (transport.connectionState !== 'connected') {
                console.log("[STREAM] Waiting for transport to connect before consuming...");
                // await waitForTransportConnection(transport, 3000);
            }

            // Normal case - consume new producers
            consumersRef.current.forEach(c => {
                try {
                    c.close();
                } catch (e) {
                    console.warn("[STREAM] Error closing consumer:", e);
                }
            });
            consumersRef.current = [];

            await new Promise(r => setTimeout(r, 200));

            try {
                for (const peerId of Object.keys(data.producers)) {
                    if (data.producers[peerId]?.length) {
                        console.log(`[STREAM] Consuming ${data.producers[peerId].length} producers from ${peerId}`);
                        await consumeProducers(data.producers[peerId], device!, transport!, roomId);
                    }
                }
            } catch (error) {
                console.error("[STREAM] Error consuming producers:", error);
                // Don't reset state on error, just log it - the INCOMING_PRODUCER might be retried
            }
        };

        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        return () => { socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer); };
    }, [socket, isHost, roomId, enabled, consumeProducers, resetState, reinitializeConsumer]);

    // Listen to STREAM_HAS_VIDEO event from host (for consumers)
    // * commenting this below useeffect because we are anymore going to use from redux slice
    // useEffect(() => {
    //     if (!socket || isHost || !enabled || !roomId) return;

    //     const handleStreamHasVideo = (data: { roomId: string; hasVideoTrack: boolean }) => {
    //         console.log("[STREAM] handleStreamHasVideo called", data);
    //         if (data.roomId !== roomId) return;
    //         console.log("[STREAM] handleStreamHasVideo Received STREAM_HAS_VIDEO event from host:", data.hasVideoTrack);
    //         onStreamHasVideoRef.current?.(data.hasVideoTrack);
    //     };

    //     socket.on(SocketEvent.STREAM_HAS_VIDEO, handleStreamHasVideo);
    //     return () => {
    //         socket.off(SocketEvent.STREAM_HAS_VIDEO, handleStreamHasVideo);
    //     };
    // }, [socket, isHost, enabled, roomId]);

    // Reset state when enabled changes
    useEffect(() => {
        if (!enabled) {
            console.log("[useStream] Disabled - resetting MediaSoup state");
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
            // Don't pause during seek - the 'seekend' event or isSeekingRef check prevents this
            if (event === 'seekend' || isSeekingRef.current) return;
            notifyPausedPlayback();
        },
        onPlay: (event?: string) => {
            // Allow resume after seek completes (isSeekingRef is false) even if event is 'seekend'
            // This handles the case where video resumes after seek
            if (isSeekingRef.current) return; // Still seeking, don't resume yet
            // If event is 'seekend' but we're not seeking anymore, it means seek completed - allow resume
            resumeProducers();
        },
        onSeekStart: () => {
            isSeekingRef.current = true;
        },
        onSeekEnd: () => {
            // Clear seeking flag immediately so that onPlay can resume producers
            // The video will resume playing shortly after seek ends, and we want to allow resume
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 100); // Shorter delay to ensure flag is cleared before onPlay('seekend') is called
        },
    };
};
