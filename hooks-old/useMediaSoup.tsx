import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer, RtpCapabilities } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";

/**
 * MediaSoup hook configuration
 * Stream-agnostic: accepts any MediaStream source
 */
interface UseMediaSoupParams {
    /** Function to get the MediaStream to produce (for hosts) */
    getStream: () => MediaStream | null;
    /** Callback when receiving a stream from producer (for consumers) */
    onStreamReceived?: (stream: MediaStream) => void;
    /** Callback when host pauses the stream (for consumers) */
    onStreamPaused?: () => void;
    /** Callback when host resumes the stream (for consumers) */
    onStreamResumed?: () => void;
    /** Whether this user is the host/producer */
    isHost: boolean;
    /** Socket namespace (default: 'filestream') */
    namespace?: string;
}

interface RoomState {
    name: string;
    isHost: boolean;
    username: string;
    joined: boolean;
}

interface MediaSoupState {
    device: mediasoupClient.Device | null;
    producerTransport: Transport | null;
    consumerTransport: Transport | null;
    producers: Map<string, Producer[]>;
    consumers: Map<string, Consumer[]>;
}

/**
 * useMediaSoup
 * 
 * A stream-agnostic MediaSoup hook for WebRTC streaming.
 * Can be used for:
 * - Video file streaming (via playerRef.captureStream())
 * - Screen sharing (via getDisplayMedia())
 * - Camera/mic (via getUserMedia())
 * - Any other MediaStream source
 */
export const useMediaSoup = ({ 
    getStream, 
    onStreamReceived,
    onStreamPaused,
    onStreamResumed,
    isHost,
    namespace = 'filestream' 
}: UseMediaSoupParams) => {
    const { socket, isConnected } = useSocket(namespace);
    
    const [roomState, setRoomState] = useState<RoomState>({
        name: '',
        isHost,
        username: '',
        joined: false,
    });
    
    const [mediaSoupState, setMediaSoupState] = useState<MediaSoupState>({
        device: null,
        producerTransport: null,
        consumerTransport: null,
        producers: new Map<string, Producer[]>(),
        consumers: new Map<string, Consumer[]>()
    });

    // Refs to avoid stale closures
    const mediaSoupStateRef = useRef(mediaSoupState);
    const roomNameRef = useRef<string>('');
    const socketRef = useRef(socket);
    const isSeekingRef = useRef(false);
    const getStreamRef = useRef(getStream);
    
    // Keep refs in sync
    useEffect(() => {
        mediaSoupStateRef.current = mediaSoupState;
    }, [mediaSoupState]);
    
    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);
    
    useEffect(() => {
        getStreamRef.current = getStream;
    }, [getStream]);
    
    // Refs for pause/resume callbacks
    const onStreamPausedRef = useRef(onStreamPaused);
    const onStreamResumedRef = useRef(onStreamResumed);
    
    useEffect(() => {
        onStreamPausedRef.current = onStreamPaused;
    }, [onStreamPaused]);
    
    useEffect(() => {
        onStreamResumedRef.current = onStreamResumed;
    }, [onStreamResumed]);
    
    // Monitor socket connection state
    useEffect(() => {
        if (!socket) return;
        
        const handleConnect = () => {
            console.log("useMediaSoup: Socket connected, id:", socket.id);
        };
        
        const handleDisconnect = (reason: string) => {
            console.log("useMediaSoup: Socket disconnected, reason:", reason);
        };
        
        const handleReconnect = () => {
            console.log("useMediaSoup: Socket reconnected, may need to rejoin room");
        };
        
        // Heartbeat handler - respond to server pings to keep connection alive
        const handlePing = () => {
            socket.emit('pong');
        };
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('reconnect', handleReconnect);
        socket.on('ping', handlePing);
        
        // Log initial state
        console.log("useMediaSoup: Socket initialized, connected:", socket.connected, "id:", socket.id);
        
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('reconnect', handleReconnect);
            socket.off('ping', handlePing);
        };
    }, [socket]);

    // Initialize MediaSoup device
    const initializeDevice = useCallback(async (routerRtpCapabilities: RtpCapabilities) => {
        try {
            const device = await mediasoupClient.Device.factory();
            await device.load({ routerRtpCapabilities });
            setMediaSoupState(prev => ({ ...prev, device }));
            return device;
        } catch (error) {
            console.error('Failed to initialize MediaSoup device:', error);
            throw error;
        }
    }, []);

    // Transport event handlers
    const handleTransportConnect = useCallback(async (
        transportId: string,
        dtlsParameters: mediasoupClient.types.DtlsParameters,
        roomId: string,
        callback: () => void,
        errback: (error: Error) => void
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) return;

        try {
            const response = await currentSocket.emitWithAck(SocketEvent.CONNECT_TRANSPORT, {
                transportId,
                dtlsParameters,
                roomId,
            });

            if (response.success) {
                callback();
            } else {
                errback(response.message);
            }
        } catch (error) {
            errback(error as Error);
        }
    }, []);

    const handleTransportProduce = useCallback(async (
        transportId: string,
        kind: mediasoupClient.types.MediaKind,
        rtpParameters: mediasoupClient.types.RtpParameters,
        roomId: string,
        callback: (params: { id: string }) => void,
        errback: (error: Error) => void
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) return;

        try {
            const response = await currentSocket.emitWithAck(SocketEvent.PRODUCE, {
                transportId,
                kind,
                rtpParameters,
                roomId,
            });

            if (response.success) {
                callback({ id: response.id });
            } else {
                errback(response.message);
            }
        } catch (error) {
            errback(error as Error);
        }
    }, []);

    // Create producer transport (only for hosts)
    const createProducerTransport = useCallback(async (
        device: mediasoupClient.Device, 
        parameters: mediasoupClient.types.TransportOptions, 
        roomId: string
    ) => {
        const transport = device.createSendTransport(parameters);

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            await handleTransportConnect(transport.id, dtlsParameters, roomId, callback, errback);
        });

        transport.on('produce', async (parameters, callback, errback) => {
            await handleTransportProduce(transport.id, parameters.kind, parameters.rtpParameters, roomId, callback, errback);
        });

        return transport;
    }, [handleTransportConnect, handleTransportProduce]);

    // Create consumer transport (only for non-hosts)
    const createConsumerTransport = useCallback(async (
        device: mediasoupClient.Device, 
        parameters: mediasoupClient.types.TransportOptions, 
        roomId: string
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) return null;

        const transport = device.createRecvTransport(parameters);

        transport.on('connectionstatechange', state => {
            console.log("Connection state changed:", state);
        });

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            await handleTransportConnect(transport.id, dtlsParameters, roomId, callback, errback);
        });

        return transport;
    }, [handleTransportConnect]);

    // Produce media tracks to transport
    const produceMedia = useCallback(async (
        transport: Transport,
        stream: MediaStream,
        roomId: string
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) return null;

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const producers: Producer[] = [];

        // Produce audio first (if available)
        if (audioTrack) {
            const audioProducer = await transport.produce({ track: audioTrack });
            audioProducer.on('trackended', () => {
                console.log('Audio track ended - this is normal during video change');
            });
            audioProducer.on('transportclose', () => console.log('Audio transport closed'));
            producers.push(audioProducer);
        }

        // Produce video (if available)
        if (videoTrack) {
            const videoProducer = await transport.produce({ track: videoTrack });
            videoProducer.on('trackended', () => {
                console.log('Video track ended - this is normal during video change');
            });
            videoProducer.on('transportclose', () => console.log('Video transport closed'));
            producers.push(videoProducer);
        }

        // Notify other peers of new producers
        currentSocket.emit(SocketEvent.INCOMING_PRODUCER, {
            roomId,
            producers: {
                [currentSocket.id!]: producers.map(p => ({
                    kind: p.kind,
                    peerId: currentSocket.id,
                    producerId: p.id
                }))
            }
        });

        return producers;
    }, []);

    // Consume media from producer (supports audio-only, video-only, or both)
    const consume = useCallback(async (
        producerInfo: { producerId: string; peerId: string; kind: string }[],
        device: mediasoupClient.types.Device,
        roomId: string,
        transport: mediasoupClient.types.Transport
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) {
            console.error("consume: No socket available");
            return;
        }
        
        console.log("consume: Starting with producers:", producerInfo);
        
        const videoProducer = producerInfo.find(info => info.kind === 'video');
        const audioProducer = producerInfo.find(info => info.kind === 'audio');

        // Require at least one producer (audio or video)
        if (!videoProducer && !audioProducer) {
            console.error('No producers found (need at least audio or video):', { videoProducer, audioProducer });
            return;
        }

        try {
            // Build consume requests for available producers
            const consumeRequests: Promise<any>[] = [];
            const producerMap: { video?: any; audio?: any } = {};

            if (videoProducer) {
                console.log("consume: Requesting video consumer for producer:", videoProducer.producerId);
                consumeRequests.push(
                    currentSocket.emitWithAck(SocketEvent.CONSUME, {
                        transportId: transport.id,
                        producerId: videoProducer.producerId,
                        roomId,
                        peerId: currentSocket.id,
                        rtpCapabilities: device.rtpCapabilities,
                    }).then(response => {
                        producerMap.video = { producer: videoProducer, response };
                        return response;
                    })
                );
            }

            if (audioProducer) {
                console.log("consume: Requesting audio consumer for producer:", audioProducer.producerId);
                consumeRequests.push(
                    currentSocket.emitWithAck(SocketEvent.CONSUME, {
                        transportId: transport.id,
                        producerId: audioProducer.producerId,
                        roomId,
                        peerId: currentSocket.id,
                        rtpCapabilities: device.rtpCapabilities,
                    }).then(response => {
                        producerMap.audio = { producer: audioProducer, response };
                        return response;
                    })
                );
            }

            const responses = await Promise.all(consumeRequests);
            console.log("consume: Server responses received:", responses.length, "consumers");

            // Validate responses
            const videoResponse = producerMap.video?.response;
            const audioResponse = producerMap.audio?.response;

            if (videoProducer && !videoResponse?.consumerData) {
                console.error("consume: Invalid video response - missing consumerData", {
                    error: videoResponse?.error
                });
            }

            if (audioProducer && !audioResponse?.consumerData) {
                console.error("consume: Invalid audio response - missing consumerData", {
                    error: audioResponse?.error
                });
            }

            // At least one consumer must be valid
            if ((videoProducer && !videoResponse?.consumerData) && (audioProducer && !audioResponse?.consumerData)) {
                console.error("consume: All consumer requests failed");
                return;
            }

            // Create consumers for available tracks
            const consumers: Consumer[] = [];
            const tracks: MediaStreamTrack[] = [];

            if (videoResponse?.consumerData) {
                console.log("consume: Creating video consumer");
                const videoConsumer = await transport.consume(videoResponse.consumerData);
                consumers.push(videoConsumer);
                tracks.push(videoConsumer.track);
                
                videoConsumer.track.onended = () => {
                    console.log("consume: Video track ended unexpectedly!");
                };
            }

            if (audioResponse?.consumerData) {
                console.log("consume: Creating audio consumer");
                const audioConsumer = await transport.consume(audioResponse.consumerData);
                consumers.push(audioConsumer);
                tracks.push(audioConsumer.track);
                
                audioConsumer.track.onended = () => {
                    console.log("consume: Audio track ended unexpectedly!");
                };
            }

            if (consumers.length === 0) {
                console.error("consume: No consumers created");
                return;
            }

            console.log("consume: Resuming", consumers.length, "consumers");
            await Promise.all(consumers.map(c => c.resume()));
            
            console.log("consume: Unpausing on server");
            const consumerIds = consumers.map(c => c.id);
            await currentSocket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, { 
                roomId, 
                consumerIds 
            });
            
            console.log("consume: Creating MediaStream with", tracks.length, "tracks:", {
                tracks: tracks.map(t => ({ id: t.id, kind: t.kind, readyState: t.readyState }))
            });
            const remoteStream = new MediaStream(tracks);

            // Notify via callback
            console.log("consume: Calling onStreamReceived with stream id:", remoteStream.id);
            onStreamReceived?.(remoteStream);

            setMediaSoupState((prev) => {
                const consumersMap = new Map<string, Consumer[]>(prev.consumers);
                consumersMap.set(currentSocket.id as string, consumers);
                return { ...prev, consumers: consumersMap };
            });
            
            // Also update ref
            mediaSoupStateRef.current.consumers.set(currentSocket.id!, consumers);
            
            console.log("consume: Completed successfully with", consumers.length, "consumers (", 
                videoResponse ? "video" : "", 
                videoResponse && audioResponse ? "+" : "",
                audioResponse ? "audio" : "",
                ")");
        } catch (error) {
            console.error('Failed to consume media:', error);
        }
    }, [onStreamReceived]);

    // Join room and setup transports
    const joinRoom = useCallback(async (room: string, isHostFlag: boolean, username: string) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) {
            console.log('Socket not connected');
            return;
        }
        
        // Store room name for later use
        roomNameRef.current = room;
        
        try {
            const response = await currentSocket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId: room,
                host: isHostFlag
            });
            
            const { sendTransportOptions, recvTransportOptions, rtpCapabilities, existingProducers } = response;
            const device = await initializeDevice(rtpCapabilities);
            setMediaSoupState((prev) => ({ ...prev, device }));
            mediaSoupStateRef.current.device = device;
            
            if (isHostFlag) {
                // Host: Create producer transport and produce stream
                const transport = await createProducerTransport(device, sendTransportOptions, room);
                setMediaSoupState((prev) => ({ ...prev, producerTransport: transport }));
                mediaSoupStateRef.current.producerTransport = transport;
                
                const stream = getStreamRef.current();
                if (!stream) {
                    throw new Error('Failed to get media stream');
                }
                
                const producers = await produceMedia(transport, stream, room);
                if (producers) {
                setMediaSoupState((prev) => {
                        const producersMap = new Map<string, Producer[]>(prev.producers);
                        producersMap.set(currentSocket.id as string, producers);
                        return { ...prev, producers: producersMap };
                    });
                    mediaSoupStateRef.current.producers.set(currentSocket.id!, producers);
                }
            } else {
                // Consumer: Create consumer transport and consume existing producers
                const transport = await createConsumerTransport(device, recvTransportOptions, room);
                if (transport) {
                    setMediaSoupState((prev) => ({ ...prev, consumerTransport: transport }));
                    mediaSoupStateRef.current.consumerTransport = transport;
                    
                for (const peerId in existingProducers) {
                        await consume(existingProducers[peerId], device, room, transport);
                    }
                }
            }

            setRoomState(prev => ({
                ...prev,
                name: room,
                isHost: isHostFlag,
                username,
                joined: true,
            }));
        } catch (error) {
            console.error('Failed to join room:', error);
        }
    }, [initializeDevice, createProducerTransport, createConsumerTransport, produceMedia, consume]);
    
    // Pause all producers and notify consumers
    const pauseProducers = useCallback(() => {
        // Don't pause during seeking
        if (isSeekingRef.current) {
            console.log("Ignoring pause during seek");
            return;
        }
        
        const currentSocket = socketRef.current;
        const roomName = roomNameRef.current;
        if (!currentSocket || !isHost) return;
        
        const producers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (producers) {
            console.log("Pausing producers and notifying consumers");
            producers.forEach(producer => {
                if (!producer.closed) {
                    producer.pause();
                }
            });
            
            // Notify consumers that stream is paused
            if (roomName) {
                currentSocket.emit(SocketEvent.STREAM_PAUSED, { roomId: roomName });
            }
        }
    }, [isHost]);

    // Resume all producers and notify consumers
    const resumeProducers = useCallback(() => {
        const currentSocket = socketRef.current;
        const roomName = roomNameRef.current;
        if (!currentSocket || !isHost) return;
        
        const producers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (producers) {
            console.log("Resuming producers and notifying consumers");
            producers.forEach(producer => {
                if (!producer.closed && producer.paused) {
                    producer.resume();
                }
            });
            
            // Notify consumers that stream is resumed
            if (roomName) {
                currentSocket.emit(SocketEvent.STREAM_RESUMED, { roomId: roomName });
            }
        }
    }, [isHost]);

    // Seek handlers - track seeking state to avoid pausing producers
    const onSeekStart = useCallback(() => {
        console.log("Seek started");
        isSeekingRef.current = true;
    }, []);
    
    const onSeekEnd = useCallback(() => {
        console.log("Seek ended");
        // Delay resetting to avoid race conditions
        setTimeout(() => {
            isSeekingRef.current = false;
        }, 300);
    }, []);

    // Player event handlers
    const onPlay = useCallback((event: string) => {
        // Ignore events during seeking
        if (event === 'seekend' || isSeekingRef.current) return;
        resumeProducers();
    }, [resumeProducers]);

    const onPause = useCallback((event: string) => {
        // Ignore events during seeking
        if (event === "seekend" || isSeekingRef.current) return;
        pauseProducers();
    }, [pauseProducers]);

    // Handle incoming producer notifications (for consumers when host switches video)
    useEffect(() => {
        if (!socket || isHost) return;
        
        console.log("Setting up INCOMING_PRODUCER listener for consumer, socket connected:", socket.connected);
        
        const handleIncomingProducer = async (data: any) => {
            console.log("handleIncomingProducer: Received event with data:", JSON.stringify(data, null, 2));
            console.log("handleIncomingProducer: Socket state - connected:", socketRef.current?.connected);
            
            const currentSocket = socketRef.current;
            if (!currentSocket) {
                console.error("handleIncomingProducer: No socket available");
                return;
            }

            // Get current device and transport
            const device = mediaSoupStateRef.current.device;
            const transport = mediaSoupStateRef.current.consumerTransport;
            const roomName = roomNameRef.current;
            
            console.log("handleIncomingProducer: State check:", {
                hasDevice: !!device,
                hasTransport: !!transport,
                transportClosed: transport?.closed,
                roomName,
                hasProducers: Object.keys(data.producers || {}).length
            });
            
            if (!device || !transport) {
                console.error("handleIncomingProducer: Device or transport not available");
                return;
            }
            
            if (transport.closed) {
                console.error("handleIncomingProducer: Consumer transport is closed!");
                return;
            }
            
            if (!roomName) {
                console.error("handleIncomingProducer: Room name not set");
                return;
            }

            // Close existing consumers first
            const existingConsumer = mediaSoupStateRef.current.consumers.get(currentSocket.id!);
            if (existingConsumer) {
                console.log("handleIncomingProducer: Closing", existingConsumer.length, "existing consumers");
                existingConsumer.forEach(c => {
                    if (!c.closed) {
                        c.close();
                    }
                });
                mediaSoupStateRef.current.consumers.delete(currentSocket.id!);
            }

            // Delay to ensure server has processed the new producers
            await new Promise(resolve => setTimeout(resolve, 300));

            // Consume from new producers with retry
            for (const peerId in data.producers) {
                console.log("handleIncomingProducer: Consuming from peer:", peerId, "producers:", data.producers[peerId]);
                
                let success = false;
                let retries = 0;
                const maxRetries = 3;
                
                while (!success && retries < maxRetries) {
                    try {
                        await consume(data.producers[peerId], device, roomName, transport);
                        console.log("handleIncomingProducer: Successfully consumed from peer:", peerId);
                        success = true;
                    } catch (error) {
                        retries++;
                        console.error(`handleIncomingProducer: Attempt ${retries} failed for peer ${peerId}:`, error);
                        if (retries < maxRetries) {
                            console.log("handleIncomingProducer: Retrying in 500ms...");
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
                
                if (!success) {
                    console.error("handleIncomingProducer: All retries failed for peer:", peerId);
                }
            }
            
            console.log("handleIncomingProducer: Completed");
        };
        
        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);

        return () => {
            socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        };
    }, [socket, consume, isHost]);

    // Listen for stream pause/resume events (for consumers)
    useEffect(() => {
        if (!socket || isHost) return;
        
        const handleStreamPaused = () => {
            console.log("Consumer received STREAM_PAUSED event");
            onStreamPausedRef.current?.();
        };
        
        const handleStreamResumed = () => {
            console.log("Consumer received STREAM_RESUMED event");
            onStreamResumedRef.current?.();
        };
        
        socket.on(SocketEvent.STREAM_PAUSED, handleStreamPaused);
        socket.on(SocketEvent.STREAM_RESUMED, handleStreamResumed);
        
        return () => {
            socket.off(SocketEvent.STREAM_PAUSED, handleStreamPaused);
            socket.off(SocketEvent.STREAM_RESUMED, handleStreamResumed);
        };
    }, [socket, isHost]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const currentSocket = socketRef.current;
            if (!currentSocket) return;
            
            currentSocket.emit(SocketEvent.LEAVE_ROOM);

            const state = mediaSoupStateRef.current;
            state.producerTransport?.close();
            state.consumerTransport?.close();
        };
    }, []);
    
    // Replace producer tracks (for switching video sources)
    // Strategy: Close old producers and create new ones
    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        const currentSocket = socketRef.current;
        const roomName = roomNameRef.current;
        const transport = mediaSoupStateRef.current.producerTransport;
        
        console.log("replaceProducerTracks: Starting", { 
            isHost, 
            socketId: currentSocket?.id, 
            roomName, 
            hasTransport: !!transport,
            transportClosed: transport?.closed
        });
        
        if (!isHost || !currentSocket || !roomName || !transport) {
            console.error("replaceProducerTracks: Missing requirements", {
                isHost,
                hasSocket: !!currentSocket,
                roomName,
                hasTransport: !!transport
            });
            return;
        }
        
        if (transport.closed) {
            console.error("replaceProducerTracks: Transport is closed!");
            return;
        }

        // Close existing producers
        const oldProducers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (oldProducers) {
            console.log("replaceProducerTracks: Closing", oldProducers.length, "old producers");
            oldProducers.forEach(p => {
                console.log("  - Closing producer:", p.id, "kind:", p.kind, "closed:", p.closed);
                if (!p.closed) {
                    p.close();
                }
            });
            mediaSoupStateRef.current.producers.delete(currentSocket.id!);
        }

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];
        
        console.log("replaceProducerTracks: New stream tracks", { 
            hasVideo: !!videoTrack, 
            hasAudio: !!audioTrack,
            videoTrackId: videoTrack?.id,
            audioTrackId: audioTrack?.id
        });
        
        if (!videoTrack && !audioTrack) {
            console.error("replaceProducerTracks: No tracks in new stream!");
            return;
        }
        
        const newProducers: Producer[] = [];

        try {
            // Create new audio producer
            if (audioTrack) {
                console.log("replaceProducerTracks: Creating audio producer");
                const audioProducer = await transport.produce({ track: audioTrack });
                console.log("replaceProducerTracks: Audio producer created:", audioProducer.id);
                audioProducer.on('trackended', () => console.log('New audio track ended'));
                audioProducer.on('transportclose', () => console.log('Audio transport closed'));
                newProducers.push(audioProducer);
            }

            // Create new video producer
            if (videoTrack) {
                console.log("replaceProducerTracks: Creating video producer");
                const videoProducer = await transport.produce({ track: videoTrack });
                console.log("replaceProducerTracks: Video producer created:", videoProducer.id);
                videoProducer.on('trackended', () => console.log('New video track ended'));
                videoProducer.on('transportclose', () => console.log('Video transport closed'));
                newProducers.push(videoProducer);
            }

            // Store new producers
            mediaSoupStateRef.current.producers.set(currentSocket.id!, newProducers);
            setMediaSoupState(prev => {
                const producers = new Map(prev.producers);
                producers.set(currentSocket.id!, newProducers);
                return { ...prev, producers };
            });

            // Build the event data
            const eventData = {
                roomId: roomName,
                producers: {
                    [currentSocket.id!]: newProducers.map(p => ({
                        kind: p.kind,
                        peerId: currentSocket.id,
                        producerId: p.id
                    }))
                }
            };
            
            // Wait a bit to ensure producers are fully registered on server
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log("replaceProducerTracks: Emitting INCOMING_PRODUCER with data:", JSON.stringify(eventData, null, 2));
            
            // Notify consumers about new producers
            currentSocket.emit(SocketEvent.INCOMING_PRODUCER, eventData);
            
            console.log("replaceProducerTracks: Complete - new producers:", newProducers.map(p => ({ id: p.id, kind: p.kind })));
        } catch (error) {
            console.error("replaceProducerTracks: Error creating producers:", error);
        }
    }, [isHost]);
    
    return {
        // Room management
        joinRoom,
        isConnected,
        isJoined: roomState.joined,
        
        // Producer controls
        onPause,
        onPlay,
        onSeekStart,
        onSeekEnd,
        pauseProducers,
        resumeProducers,
        replaceProducerTracks,
        
        // State
        mediaSoupState,
    };
};
