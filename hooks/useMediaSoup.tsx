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

    // Consume media from producer
    const consume = useCallback(async (
        producerInfo: { producerId: string; peerId: string; kind: string }[],
        device: mediasoupClient.types.Device,
        roomId: string,
        transport: mediasoupClient.types.Transport
    ) => {
        const currentSocket = socketRef.current;
        if (!currentSocket) return;
        
        const videoProducer = producerInfo.find(info => info.kind === 'video');
        const audioProducer = producerInfo.find(info => info.kind === 'audio');

        if (!videoProducer || !audioProducer) {
            console.error('Missing video or audio producer');
            return;
        }

        try {
            const [videoResponse, audioResponse] = await Promise.all([
                currentSocket.emitWithAck(SocketEvent.CONSUME, {
                    transportId: transport.id,
                    producerId: videoProducer.producerId,
                    roomId,
                    peerId: currentSocket.id,
                    rtpCapabilities: device.rtpCapabilities,
                }),
                currentSocket.emitWithAck(SocketEvent.CONSUME, {
                    transportId: transport.id,
                    producerId: audioProducer.producerId,
                    roomId,
                    peerId: currentSocket.id,
                    rtpCapabilities: device.rtpCapabilities,
                }),
            ]);

            const [videoConsumer, audioConsumer] = await Promise.all([
                transport.consume(videoResponse.consumerData),
                transport.consume(audioResponse.consumerData),
            ]);
            
            await videoConsumer.resume();
            await audioConsumer.resume();
            await currentSocket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, { 
                roomId, 
                consumerIds: [videoConsumer.id, audioConsumer.id] 
            });
            
            const remoteStream = new MediaStream([videoConsumer.track, audioConsumer.track]);

            // Notify via callback
            onStreamReceived?.(remoteStream);

            setMediaSoupState((prev) => {
                const consumers = new Map<string, Consumer[]>(prev.consumers);
                consumers.set(currentSocket.id as string, [videoConsumer, audioConsumer]);
                return { ...prev, consumers };
            });
            
            // Also update ref
            mediaSoupStateRef.current.consumers.set(currentSocket.id!, [videoConsumer, audioConsumer]);
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
    
    // Pause all producers
    const pauseProducers = useCallback(() => {
        // Don't pause during seeking
        if (isSeekingRef.current) {
            console.log("Ignoring pause during seek");
            return;
        }
        
        const currentSocket = socketRef.current;
        if (!currentSocket || !isHost) return;
        
        const producers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (producers) {
            console.log("Pausing producers");
            producers.forEach(producer => {
                if (!producer.closed) {
                    producer.pause();
                }
            });
        }
    }, [isHost]);

    // Resume all producers
    const resumeProducers = useCallback(() => {
        const currentSocket = socketRef.current;
        if (!currentSocket || !isHost) return;
        
        const producers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (producers) {
            console.log("Resuming producers");
            producers.forEach(producer => {
                if (!producer.closed && producer.paused) {
                    producer.resume();
                }
            });
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
        
        const handleIncomingProducer = async (data: any) => {
            console.log("Received INCOMING_PRODUCER event");
            
            // Close existing consumers
            const currentSocket = socketRef.current;
            if (!currentSocket) return;
            
            const existingConsumer = mediaSoupStateRef.current.consumers.get(currentSocket.id!);
            if (existingConsumer) {
                console.log("Closing existing consumers");
                existingConsumer.forEach(c => {
                    if (!c.closed) c.close();
                });
                mediaSoupStateRef.current.consumers.delete(currentSocket.id!);
            }

            // Get current device and transport
            const device = mediaSoupStateRef.current.device;
            const transport = mediaSoupStateRef.current.consumerTransport;
            const roomName = roomNameRef.current;
            
            if (!device || !transport) {
                console.error("Device or transport not available");
                return;
            }

            // Consume from new producers
            for (const peerId in data.producers) {
                console.log("Consuming from peer:", peerId);
                await consume(data.producers[peerId], device, roomName, transport);
            }
        };
        
        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);

        return () => {
            socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        };
    }, [socket, consume, isHost]);

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
        
        console.log("replaceProducerTracks called:", { 
            isHost, 
            hasSocket: !!currentSocket, 
            roomName, 
            hasTransport: !!transport 
        });
        
        if (!isHost || !currentSocket || !roomName || !transport) {
            console.error("replaceProducerTracks: missing requirements");
            return;
        }

        // Close existing producers
        const oldProducers = mediaSoupStateRef.current.producers.get(currentSocket.id!);
        if (oldProducers) {
            console.log("Closing old producers:", oldProducers.length);
            oldProducers.forEach(p => {
                if (!p.closed) {
                    p.close();
                }
            });
            mediaSoupStateRef.current.producers.delete(currentSocket.id!);
        }

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];
        
        console.log("New stream tracks:", { 
            hasVideo: !!videoTrack, 
            hasAudio: !!audioTrack 
        });
        
        const newProducers: Producer[] = [];

        try {
            // Create new audio producer
            if (audioTrack) {
                console.log("Creating new audio producer");
                const audioProducer = await transport.produce({ track: audioTrack });
                audioProducer.on('trackended', () => console.log('New audio track ended'));
                audioProducer.on('transportclose', () => console.log('Audio transport closed'));
                newProducers.push(audioProducer);
            }

            // Create new video producer
            if (videoTrack) {
                console.log("Creating new video producer");
                const videoProducer = await transport.produce({ track: videoTrack });
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

            // Notify consumers about new producers
            console.log("Notifying consumers about new producers");
            currentSocket.emit(SocketEvent.INCOMING_PRODUCER, {
                roomId: roomName,
                producers: {
                    [currentSocket.id!]: newProducers.map(p => ({
                        kind: p.kind,
                        peerId: currentSocket.id,
                        producerId: p.id
                    }))
                }
            });
            
            console.log("Producer replacement complete");
        } catch (error) {
            console.error("Error creating new producers:", error);
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
