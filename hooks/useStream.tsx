import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import { RootState } from "@/lib/store";
import { useSelector } from "react-redux";

interface UseStreamParams {
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

export const useStream = ({
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
}: UseStreamParams) => {
    const { socket } = useSocket();
    const roomState = useSelector((state: RootState) => state.room);
    
    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [trackUpdateCounter, setTrackUpdateCounter] = useState(0);
    
    // MediaSoup refs
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const producerTransportRef = useRef<Transport | null>(null);
    const consumerTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
    const consumersRef = useRef<Consumer[]>([]);
    const initializingRef = useRef(false);
    const isSeekingRef = useRef(false);
    
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

    // ============================================================================
    // Helper Functions
    // ============================================================================

    /**
     * Resets all MediaSoup state and closes all connections
     */
    const resetState = useCallback(() => {
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
    }, []);

    /**
     * Notifies listeners that tracks have been updated
     */
    const notifyTrackUpdate = useCallback(() => {
        setTrackUpdateCounter(prev => prev + 1);
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
     * Creates transport connect handler
     */
    const createConnectHandler = useCallback((transport: Transport, currentRoomId: string) => {
        transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
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
        });
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

        if (audioTrack?.readyState === 'live') {
            audioProducerRef.current = await transport.produce({ track: audioTrack });
        }

        if (videoTrack?.readyState === 'live') {
            videoProducerRef.current = await transport.produce({ track: videoTrack });
        }

        // Notify consumers about new producers
        const producers = [
            audioProducerRef.current && { kind: 'audio', peerId: socket.id, producerId: audioProducerRef.current.id },
            videoProducerRef.current && { kind: 'video', peerId: socket.id, producerId: videoProducerRef.current.id },
        ].filter(Boolean);

        if (producers.length) {
            socket.emit(SocketEvent.INCOMING_PRODUCER, {
                roomId: currentRoomId,
                producers: { [socket.id!]: producers }
            });
            notifyTrackUpdate();
        }
    }, [socket, notifyTrackUpdate]);

    /**
     * Replaces tracks on existing producers
     */
    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        if (!isHost || !roomId) return;

        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];
        let tracksReplaced = false;

        try {
            if (audioProducerRef.current && !audioProducerRef.current.closed && audioTrack) {
                await audioProducerRef.current.replaceTrack({ track: audioTrack });
                tracksReplaced = true;
            }
            if (videoProducerRef.current && !videoProducerRef.current.closed && videoTrack) {
                await videoProducerRef.current.replaceTrack({ track: videoTrack });
                tracksReplaced = true;
            }
            
            if (tracksReplaced) {
                notifyTrackUpdate();
            }
        } catch (error) {
            console.error("[STREAM] Replace tracks error:", error);
            showError("Video update failed", "Unable to update video stream. The video may continue playing.");
        }
    }, [isHost, roomId, notifyTrackUpdate]);

    /**
     * Replaces tracks when they are ended (video finished)
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
                notifyTrackUpdate();
            }
        } catch (error) {
            console.error("[STREAM] Replace ended tracks error:", error);
            showError("Video restart failed", "Unable to restart video stream. Please try pausing and playing again.");
        }
    }, [notifyTrackUpdate]);

    /**
     * Pauses audio and video producers
     */
    const pauseProducers = useCallback(() => {
        if (isSeekingRef.current || !isHost || !roomId) return;
        audioProducerRef.current?.pause();
        videoProducerRef.current?.pause();
        socket?.emit(SocketEvent.STREAM_PAUSED, { roomId });
    }, [isHost, roomId, socket]);

    /**
     * Resumes audio and video producers
     */
    const resumeProducers = useCallback(async () => {
        if (!isHost || !roomId) return;

        // If tracks are ended, replace them first
        if (areTracksEnded()) {
            await new Promise(r => setTimeout(r, 100));
            await replaceEndedTracks();
        }

        if (audioProducerRef.current?.paused) audioProducerRef.current.resume();
        if (videoProducerRef.current?.paused) videoProducerRef.current.resume();
        socket?.emit(SocketEvent.STREAM_RESUMED, { roomId });
    }, [isHost, roomId, socket, areTracksEnded, replaceEndedTracks]);

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
                console.error("[STREAM] Consume error:", error);
                showError("Stream connection failed", "Unable to receive video stream. Please try refreshing the page.");
            }
        }

        if (tracks.length) {
            await socket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, {
                roomId: currentRoomId,
                consumerIds: consumersRef.current.map(c => c.id),
            });
            onStreamReceivedRef.current?.(new MediaStream(tracks));
        }
    }, [socket]);

    /**
     * Reinitializes consumer when host rejoins
     */
    const reinitializeConsumer = useCallback(async (roomId: string) => {
        if (!socket) return;

        try {
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId,
                host: false,
                username,
                email,
                profile,
                room: {
                    type: "stream",
                    source: roomState.source || "stream",
                    urls: roomState.urls || [],
                    files: roomState.files || [],
                    selectedFileIndex: roomState.selectedFileIndex || 0,
                },
            });

            if (!response?.success || !response.rtpCapabilities || !response.recvTransportOptions) {
                console.error("[useStream] Rejoin failed:", response);
                return null;
            }

            if (typeof response.rtpCapabilities !== 'object' || Array.isArray(response.rtpCapabilities)) {
                console.warn("[useStream] Invalid rtpCapabilities");
                return null;
            }

            const newDevice = new mediasoupClient.Device();
            await newDevice.load({ routerRtpCapabilities: response.rtpCapabilities });
            deviceRef.current = newDevice;

            const newTransport = newDevice.createRecvTransport(response.recvTransportOptions);
            createConnectHandler(newTransport, roomId);
            consumerTransportRef.current = newTransport;
            setIsInitialized(true);

            return { device: newDevice, transport: newTransport };
        } catch (error) {
            console.error("[STREAM] Reinit error:", error);
            showError("Stream reconnection failed", "Unable to reconnect to video stream. Please refresh the page.");
            return null;
        }
    }, [socket, username, email, profile, roomState, createConnectHandler]);

    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initializes MediaSoup from join response
     */
    const initializeFromJoinResponse = useCallback(async (joinResponse: any) => {
        if (!socket || !roomId || !joinResponse || !enabled) return;
        if (initializingRef.current || (isInitialized && deviceRef.current)) return;

        // Validate joinResponse
        if (!joinResponse.rtpCapabilities || 
            typeof joinResponse.rtpCapabilities !== 'object' || 
            Array.isArray(joinResponse.rtpCapabilities)) {
            console.warn("[STREAM] Invalid joinResponse.rtpCapabilities");
            return;
        }

        initializingRef.current = true;

        try {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities: joinResponse.rtpCapabilities });
            deviceRef.current = device;

            if (isHost) {
                if (!joinResponse.sendTransportOptions) throw new Error("No sendTransportOptions");

                const transport = device.createSendTransport(joinResponse.sendTransportOptions);
                createConnectHandler(transport, roomId);

                transport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
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
                });

                producerTransportRef.current = transport;

                // Create producers after a short delay
                await new Promise(r => setTimeout(r, 800));
                const stream = getStreamRef.current();
                if (stream) await createProducers(transport, stream, roomId);
            } else {
                if (!joinResponse.recvTransportOptions) throw new Error("No recvTransportOptions");

                const transport = device.createRecvTransport(joinResponse.recvTransportOptions);
                createConnectHandler(transport, roomId);
                consumerTransportRef.current = transport;

                // Consume existing producers
                const existing = joinResponse.existingProducers;
                if (existing) {
                    for (const peerId of Object.keys(existing)) {
                        const producers = existing[peerId];
                        if (producers?.length) {
                            await consumeProducers(producers.slice(-2), device, transport, roomId);
                        }
                    }
                }
            }

            setIsInitialized(true);
        } catch (error) {
            console.error("[STREAM] Init error:", error);
            showError("Stream initialization failed", "Unable to start video streaming. Please check your connection and try again.");
        } finally {
            initializingRef.current = false;
        }
    }, [socket, roomId, isHost, enabled, isInitialized, createConnectHandler, createProducers, consumeProducers]);

    // ============================================================================
    // Event Handlers (useEffects)
    // ============================================================================

    // Handle incoming producers (consumer only)
    useEffect(() => {
        if (!socket || isHost || !enabled || !roomId) return;

        const handleIncomingProducer = async (data: { roomId: string; producers: Record<string, any[]> }) => {
            if (data.roomId !== roomId) return;

            const device = deviceRef.current;
            const transport = consumerTransportRef.current;
            const needsReinit = !device || !transport || transport.closed;

            if (needsReinit) {
                console.log("[useStream] Reinitializing for incoming producers");
                resetState();
                
                const result = await reinitializeConsumer(roomId);
                if (!result) return;

                await new Promise(r => setTimeout(r, 300));
                for (const peerId of Object.keys(data.producers)) {
                    if (data.producers[peerId]?.length) {
                        await consumeProducers(data.producers[peerId], result.device, result.transport, roomId);
                    }
                }
                return;
            }

            // Normal case - consume new producers
            consumersRef.current.forEach(c => {
                try {
                    c.close();
                } catch (e) {
                    console.warn("[useStream] Error closing consumer:", e);
                }
            });
            consumersRef.current = [];

            await new Promise(r => setTimeout(r, 200));
            
            try {
                for (const peerId of Object.keys(data.producers)) {
                    if (data.producers[peerId]?.length) {
                        await consumeProducers(data.producers[peerId], device!, transport!, roomId);
                    }
                }
            } catch (error) {
                console.error("[useStream] Error consuming producers:", error);
                resetState();
            }
        };

        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        return () => { socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer); };
    }, [socket, isHost, roomId, enabled, consumeProducers, resetState, reinitializeConsumer]);

    // Handle stream stopped (consumer only)
    useEffect(() => {
        if (!socket || isHost || !enabled) return;
        const handleStreamStopped = () => onStreamStoppedRef.current?.();
        socket.on(SocketEvent.STREAM_STOPPED, handleStreamStopped);
        return () => { socket.off(SocketEvent.STREAM_STOPPED, handleStreamStopped); };
    }, [socket, isHost, enabled]);

    // Handle host left (consumer only)
    useEffect(() => {
        if (!socket || isHost || !enabled) return;
        const handleHostLeft = () => resetState();
        socket.on(SocketEvent.HOST_LEFT, handleHostLeft);
        return () => { socket.off(SocketEvent.HOST_LEFT, handleHostLeft); };
    }, [socket, isHost, enabled, resetState]);

    // Handle pause/resume (consumer only)
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

    // Handle track ended events (host only)
    useEffect(() => {
        if (!isHost || !enabled || !isInitialized) return;

        const handleTrackEnded = () => {
            console.log("[useStream] Track ended - cleaning up producers");
            audioProducerRef.current?.close();
            videoProducerRef.current?.close();
            audioProducerRef.current = null;
            videoProducerRef.current = null;
            setIsInitialized(false);
            socket?.emit(SocketEvent.STREAM_STOPPED, { roomId });
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
    }, [isHost, enabled, isInitialized, socket, roomId, trackUpdateCounter]);

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
        pauseProducers,
        resumeProducers,
        replaceProducerTracks,
        resetState,
        onPause: (event?: string) => {
            if (event === 'seekend' || isSeekingRef.current) return;
            pauseProducers();
        },
        onPlay: (event?: string) => {
            if (event === 'seekend' || isSeekingRef.current) return;
            resumeProducers();
        },
        onSeekStart: () => {
            isSeekingRef.current = true;
        },
        onSeekEnd: () => {
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 300);
        },
    };
};
