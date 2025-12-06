import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { RootState, store } from "@/lib/store";
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
    const [isInitialized, setIsInitialized] = useState(false);
    const roomState = useSelector((state: RootState) => state.room);
    // MediaSoup state refs
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

    useEffect(() => { getStreamRef.current = getStream; }, [getStream]);
    useEffect(() => { onStreamReceivedRef.current = onStreamReceived; }, [onStreamReceived]);
    useEffect(() => { onStreamPausedRef.current = onStreamPaused; }, [onStreamPaused]);
    useEffect(() => { onStreamResumedRef.current = onStreamResumed; }, [onStreamResumed]);
    useEffect(() => { onStreamStoppedRef.current = onStreamStopped; }, [onStreamStopped]);
    // Reset all MediaSoup state
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

    // Create transport connect handler
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

    // Create producers (host only)
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

        // Notify consumers
        const producers = [
            audioProducerRef.current && { kind: 'audio', peerId: socket.id, producerId: audioProducerRef.current.id },
            videoProducerRef.current && { kind: 'video', peerId: socket.id, producerId: videoProducerRef.current.id },
        ].filter(Boolean);

        if (producers.length) {
            socket.emit(SocketEvent.INCOMING_PRODUCER, {
                roomId: currentRoomId,
                producers: { [socket.id!]: producers }
            });
        }
    }, [socket]);

    // Consume producers (consumer only)
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

    // Initialize from join response
    const initializeFromJoinResponse = useCallback(async (joinResponse: any) => {
        if (!socket || !roomId || !joinResponse || !enabled) return;
        if (initializingRef.current || (isInitialized && deviceRef.current)) return;

        // Validate joinResponse has required MediaSoup data
        if (!joinResponse.rtpCapabilities) {
            console.warn("[STREAM] Init error: joinResponse missing rtpCapabilities", joinResponse);
            return;
        }

        if (typeof joinResponse.rtpCapabilities !== 'object' || Array.isArray(joinResponse.rtpCapabilities)) {
            console.warn("[STREAM] Init error: rtpCapabilities is not a valid object", joinResponse.rtpCapabilities);
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
                            // * producers.slice(-2) is to consume the last 2 producers
                            await consumeProducers(producers.slice(-2), device, transport, roomId);
                        }
                    }
                }
            }

            setIsInitialized(true);
        } catch (error) {
            console.error("[STREAM] Init error:", error);
        } finally {
            initializingRef.current = false;
        }
    }, [socket, roomId, isHost, enabled, isInitialized, createConnectHandler, createProducers, consumeProducers]);

    // Replace tracks on existing producers
    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        if (!isHost || !roomId) return;

        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];

        try {
            if (audioProducerRef.current && !audioProducerRef.current.closed && audioTrack) {
                await audioProducerRef.current.replaceTrack({ track: audioTrack });
            }
            if (videoProducerRef.current && !videoProducerRef.current.closed && videoTrack) {
                await videoProducerRef.current.replaceTrack({ track: videoTrack });
            }
        } catch (error) {
            console.error("[STREAM] Replace tracks error:", error);
        }
    }, [isHost, roomId]);

    // Check if producer tracks are ended (video finished)
    const areTracksEnded = useCallback(() => {
        const audioTrack = audioProducerRef.current?.track;
        const videoTrack = videoProducerRef.current?.track;
        return (audioTrack?.readyState === 'ended') || (videoTrack?.readyState === 'ended');
    }, []);

    // Pause/Resume producers
    const pauseProducers = useCallback(() => {
        if (isSeekingRef.current || !isHost || !roomId) return;
        audioProducerRef.current?.pause();
        videoProducerRef.current?.pause();
        socket?.emit(SocketEvent.STREAM_PAUSED, { roomId });
    }, [isHost, roomId, socket]);

    const resumeProducers = useCallback(async () => {
        if (!isHost || !roomId) return;

        // If tracks are ended (video finished), get fresh tracks first
        if (areTracksEnded()) {
            // Small delay to ensure video player has the new frame ready
            await new Promise(r => setTimeout(r, 100));

            const newStream = getStreamRef.current();
            if (newStream) {
                const audioTrack = newStream.getAudioTracks()[0];
                const videoTrack = newStream.getVideoTracks()[0];

                try {
                    if (audioProducerRef.current && !audioProducerRef.current.closed && audioTrack?.readyState === 'live') {
                        await audioProducerRef.current.replaceTrack({ track: audioTrack });
                    }
                    if (videoProducerRef.current && !videoProducerRef.current.closed && videoTrack?.readyState === 'live') {
                        await videoProducerRef.current.replaceTrack({ track: videoTrack });
                    }
                } catch (error) {
                    console.error("[STREAM] Replace ended tracks error:", error);
                }
            }
        }

        if (audioProducerRef.current?.paused) audioProducerRef.current.resume();
        if (videoProducerRef.current?.paused) videoProducerRef.current.resume();
        socket?.emit(SocketEvent.STREAM_RESUMED, { roomId });
    }, [isHost, roomId, socket, areTracksEnded]);

    // Handle incoming producers (consumer only - includes host rejoin)
    useEffect(() => {
        if (!socket || isHost || !enabled || !roomId) return;

        const handleIncomingProducer = async (data: { roomId: string; producers: Record<string, any[]> }) => {
            if (data.roomId !== roomId) return;

            const device = deviceRef.current;
            const transport = consumerTransportRef.current;
            const needsReinit = !device || !transport || transport.closed;

            console.log("[useStream] INCOMING_PRODUCER received", {
                roomId: data.roomId,
                hasDevice: !!device,
                hasTransport: !!transport,
                transportClosed: transport?.closed,
                needsReinit,
                producers: Object.keys(data.producers || {}),
            });

            if (needsReinit) {
                // Host rejoined or we need to reinitialize - reinitialize
                console.log("[useStream] Reinitializing MediaSoup for incoming producers");
                resetState();

                try {
                    const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                        roomId,
                        host: false,
                        username: username,
                        email: email,
                        profile: profile,
                        room: {
                            type: "stream",
                            source: roomState.source || "stream",
                            urls: roomState.urls || [],
                            files: roomState.files || [],
                            selectedFileIndex: roomState.selectedFileIndex || 0,
                        },
                    });
                    console.log("[useStream] Rejoin response:", response);
                    if (!response?.success) {
                        console.error("[useStream] Rejoin failed:", response);
                        return;
                    }

                    if (!response.rtpCapabilities) {
                        console.warn("[useStream] Rejoin response missing rtpCapabilities", response);
                        return;
                    }

                    if (typeof response.rtpCapabilities !== 'object' || Array.isArray(response.rtpCapabilities)) {
                        console.warn("[useStream] Rejoin response rtpCapabilities is invalid", response.rtpCapabilities);
                        return;
                    }

                    if (!response.recvTransportOptions) {
                        console.warn("[useStream] Rejoin response missing recvTransportOptions", response);
                        return;
                    }

                    const newDevice = new mediasoupClient.Device();
                    await newDevice.load({ routerRtpCapabilities: response.rtpCapabilities });
                    deviceRef.current = newDevice;

                    const newTransport = newDevice.createRecvTransport(response.recvTransportOptions);
                    createConnectHandler(newTransport, roomId);
                    consumerTransportRef.current = newTransport;
                    setIsInitialized(true);

                    await new Promise(r => setTimeout(r, 300));
                    for (const peerId of Object.keys(data.producers)) {
                        if (data.producers[peerId]?.length) {
                            console.log(`[useStream] Consuming ${data.producers[peerId].length} producers from ${peerId}`);
                            await consumeProducers(data.producers[peerId], newDevice, newTransport, roomId);
                        }
                    }
                } catch (error) {
                    console.error("[STREAM] Reinit error:", error);
                }
                return;
            }

            // Normal case - device and transport exist, just consume new producers
            // console.log("[useStream] Consuming new producers with existing device/transport");
            
            // Close existing consumers first
            consumersRef.current.forEach(c => {
                try {
                    c.close();
                } catch (e) {
                    console.warn("[useStream] Error closing consumer:", e);
                }
            });
            consumersRef.current = [];

            // Small delay to ensure transport is ready
            await new Promise(r => setTimeout(r, 200));
            
            // Try to consume producers - if it fails, we'll reinitialize
            try {
                for (const peerId of Object.keys(data.producers)) {
                    if (data.producers[peerId]?.length) {
                        console.log(`[useStream] Consuming ${data.producers[peerId].length} producers from ${peerId}`);
                        await consumeProducers(data.producers[peerId], device!, transport!, data.roomId);
                    }
                }
            } catch (error) {
                console.error("[useStream] Error consuming producers, reinitializing:", error);
                // If consumption fails, reinitialize by resetting state and triggering rejoin
                resetState();
                // The INCOMING_PRODUCER event will fire again or we can manually trigger rejoin
                // For now, just log the error - the user might need to refresh or rejoin
            }
        };

        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        return () => { socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer); };
    }, [socket, isHost, roomId, enabled, consumeProducers, resetState, createConnectHandler]);

    // Handle stream stopped (consumer only)
    useEffect(() => {
        if (!socket || isHost || !enabled) return;

        const handleStreamStopped = () => onStreamStoppedRef.current?.();
        socket.on(SocketEvent.STREAM_STOPPED, handleStreamStopped);
        return () => { socket.off(SocketEvent.STREAM_STOPPED, handleStreamStopped); };
    }, [socket, isHost, enabled, onStreamStopped]);

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

    // Handle track ended events (when user stops sharing screen)
    useEffect(() => {
        if (!isHost || !enabled) return;

        const handleTrackEnded = () => {
            console.log("[useStream] Screen sharing stopped by user - track ended, cleaning up producers");
            
            // Close producers when tracks end
            audioProducerRef.current?.close();
            videoProducerRef.current?.close();
            
            audioProducerRef.current = null;
            videoProducerRef.current = null;
            
            // Reset initialization state
            setIsInitialized(false);
            socket?.emit(SocketEvent.STREAM_STOPPED, { roomId });
            // Notify that stream is no longer available
            // The MediaStreamContext will also handle setting stream to null
        };

        const tracks: MediaStreamTrack[] = [];

        // Listen to producer tracks (these are the actual tracks being sent)
        const audioTrack = audioProducerRef.current?.track;
        const videoTrack = videoProducerRef.current?.track;
        if (audioTrack) tracks.push(audioTrack);
        if (videoTrack) tracks.push(videoTrack);

        // Also listen to stream tracks as a fallback (in case producers aren't created yet)
        const stream = getStreamRef.current();
        if (stream) {
            const streamAudioTracks = stream.getAudioTracks();
            const streamVideoTracks = stream.getVideoTracks();
            streamAudioTracks.forEach(track => {
                if (!tracks.includes(track)) tracks.push(track);
            });
            streamVideoTracks.forEach(track => {
                if (!tracks.includes(track)) tracks.push(track);
            });
        }

        tracks.forEach(track => {
            track.addEventListener('ended', handleTrackEnded);
        });

        // Cleanup: remove listeners when tracks change or component unmounts
        return () => {
            tracks.forEach(track => {
                track.removeEventListener('ended', handleTrackEnded);
            });
        };
    }, [isHost, enabled, isInitialized]); // Re-run when initialization state changes (producers created/destroyed)

    // Reset state when enabled changes (e.g., room type changes from stream to sync)
    useEffect(() => {
        if (!enabled) {
            console.log("[useStream] Disabled - resetting MediaSoup state");
            resetState();
        }
    }, [enabled, resetState]);

    // Cleanup on unmount
    useEffect(() => () => resetState(), [resetState]);

    return {
        isInitialized,
        initializeFromJoinResponse,
        pauseProducers,
        resumeProducers,
        replaceProducerTracks,
        resetState,
        onPause: (event?: string) => { if (event === 'seekend' || isSeekingRef.current) return; pauseProducers(); },
        onPlay: (event?: string) => { if (event === 'seekend' || isSeekingRef.current) return; resumeProducers(); },
        onSeekStart: () => { isSeekingRef.current = true; },
        onSeekEnd: () => { setTimeout(() => { isSeekingRef.current = false; }, 300); },
    };
};
