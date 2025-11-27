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
 * 
 * @example
 * // For video file streaming
 * const { joinRoom } = useMediaSoup({
 *   getStream: () => playerRef.current?.getInternalPlayer()?.captureStream() ?? null,
 *   onStreamReceived: (stream) => setRemoteStream(stream),
 *   isHost: roomState.host,
 * });
 * 
 * @example
 * // For screen sharing
 * const { joinRoom } = useMediaSoup({
 *   getStream: () => screenStream,
 *   onStreamReceived: (stream) => setRemoteStream(stream),
 *   isHost: true,
 * });
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

    const mediaSoupStateRef = useRef(mediaSoupState);
    useEffect(() => {
        mediaSoupStateRef.current = mediaSoupState;
    }, [mediaSoupState]);

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
        if (!socket) return;

        try {
            const response = await socket.emitWithAck(SocketEvent.CONNECT_TRANSPORT, {
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
    }, [socket]);

    const handleTransportProduce = useCallback(async (
        transportId: string,
        kind: mediasoupClient.types.MediaKind,
        rtpParameters: mediasoupClient.types.RtpParameters,
        roomId: string,
        callback: (params: { id: string }) => void,
        errback: (error: Error) => void
    ) => {
        if (!socket) return;

        try {
            const response = await socket.emitWithAck(SocketEvent.PRODUCE, {
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
    }, [socket]);

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
        if (!socket) return null;

        const transport = device.createRecvTransport(parameters);

        transport.on('connectionstatechange', state => {
            console.log("Connection state changed:", state);
        });

        transport.on('icegatheringstatechange', state => {
            console.log("ICE gathering state changed:", state);
        });

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            await handleTransportConnect(transport.id, dtlsParameters, roomId, callback, errback);
        });

        return transport;
    }, [socket, handleTransportConnect]);

    // Produce media tracks to transport
    const produceMedia = useCallback(async (
        transport: Transport,
        stream: MediaStream,
        roomId: string
    ) => {
        if (!socket) return null;

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const producers: Producer[] = [];

        // Produce audio first (if available)
        if (audioTrack) {
            const audioProducer = await transport.produce({ track: audioTrack });
            audioProducer.on('trackended', () => console.log('Audio track ended'));
            audioProducer.on('transportclose', () => console.log('Audio transport closed'));
            producers.push(audioProducer);
        }

        // Produce video (if available)
        if (videoTrack) {
            const videoProducer = await transport.produce({ track: videoTrack });
            videoProducer.on('trackended', () => console.log('Video track ended'));
            videoProducer.on('transportclose', () => console.log('Video transport closed'));
            producers.push(videoProducer);
        }

        // Notify other peers of new producers
        socket.emit(SocketEvent.INCOMING_PRODUCER, {
            roomId,
            producers: {
                [socket.id!]: producers.map(p => ({
                    kind: p.kind,
                    peerId: socket.id,
                    producerId: p.id
                }))
            }
        });

        return producers;
    }, [socket]);

    // Consume media from producer
    const consume = useCallback(async (
        producerInfo: { producerId: string; peerId: string; kind: string }[],
        device: mediasoupClient.types.Device,
        roomId: string,
        transport: mediasoupClient.types.Transport
    ) => {
        if (!socket) return;
        
        const videoProducer = producerInfo.find(info => info.kind === 'video');
        const audioProducer = producerInfo.find(info => info.kind === 'audio');

        if (!videoProducer || !audioProducer) {
            console.error('Missing video or audio producer');
            return;
        }

        try {
            const [videoResponse, audioResponse] = await Promise.all([
                socket.emitWithAck(SocketEvent.CONSUME, {
                    transportId: transport.id,
                    producerId: videoProducer.producerId,
                    roomId,
                    peerId: socket.id,
                    rtpCapabilities: device.rtpCapabilities,
                }),
                socket.emitWithAck(SocketEvent.CONSUME, {
                    transportId: transport.id,
                    producerId: audioProducer.producerId,
                    roomId,
                    peerId: socket.id,
                    rtpCapabilities: device.rtpCapabilities,
                }),
            ]);

            const [videoConsumer, audioConsumer] = await Promise.all([
                transport.consume(videoResponse.consumerData),
                transport.consume(audioResponse.consumerData),
            ]);
            
            await videoConsumer.resume();
            await audioConsumer.resume();
            await socket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, { 
                roomId, 
                consumerIds: [videoConsumer.id, audioConsumer.id] 
            });
            
            const remoteStream = new MediaStream([videoConsumer.track, audioConsumer.track]);

            // Notify via callback
            onStreamReceived?.(remoteStream);

            setMediaSoupState((prev) => {
                const consumers = new Map<string, Consumer[]>(prev.consumers);
                consumers.set(socket.id as string, [videoConsumer, audioConsumer]);
                return { ...prev, consumers };
            });
        } catch (error) {
            console.error('Failed to consume media:', error);
        }
    }, [socket, onStreamReceived]);

    // Join room and setup transports
    const joinRoom = useCallback(async (room: string, isHostFlag: boolean, username: string) => {
        if (!socket) {
            console.log('Socket not connected');
            return;
        }
        
        try {
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId: room,
                host: isHostFlag
            });
            
            const { sendTransportOptions, recvTransportOptions, rtpCapabilities, existingProducers } = response;
            const device = await initializeDevice(rtpCapabilities);
            setMediaSoupState((prev) => ({ ...prev, device }));
            
            if (isHostFlag) {
                // Host: Create producer transport and produce stream
                const transport = await createProducerTransport(device, sendTransportOptions, room);
                setMediaSoupState((prev) => ({ ...prev, producerTransport: transport }));
                
                const stream = getStream();
                if (!stream) {
                    throw new Error('Failed to get media stream');
                }
                
                const producers = await produceMedia(transport, stream, room);
                if (producers) {
                    setMediaSoupState((prev) => {
                        const producersMap = new Map<string, Producer[]>(prev.producers);
                        producersMap.set(socket.id as string, producers);
                        return { ...prev, producers: producersMap };
                    });
                }
            } else {
                // Consumer: Create consumer transport and consume existing producers
                const transport = await createConsumerTransport(device, recvTransportOptions, room);
                setMediaSoupState((prev) => ({ ...prev, consumerTransport: transport }));
                
                for (const peerId in existingProducers) {
                    await consume(existingProducers[peerId], device, room, transport!);
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
    }, [socket, initializeDevice, createProducerTransport, createConsumerTransport, getStream, produceMedia, consume]);
    
    // Pause all producers
    const pauseProducers = useCallback(() => {
        if (!socket || !isHost) return;
        const producers = mediaSoupStateRef.current.producers.get(socket.id!);
        if (producers) producers.forEach(producer => producer.pause());
    }, [isHost, socket]);

    // Resume all producers
    const resumeProducers = useCallback(() => {
        if (!socket || !isHost) return;
        const producers = mediaSoupStateRef.current.producers.get(socket.id!);
        if (producers) producers.forEach(producer => producer.resume());
    }, [isHost, socket]);

    // Player event handlers (for compatibility)
    const onPlay = useCallback((event: string) => {
        if (event === 'seekend') return;
        resumeProducers();
    }, [resumeProducers]);

    const onPause = useCallback((event: string) => {
        if (event === "seekend") return;
        pauseProducers();
    }, [pauseProducers]);

    // Handle incoming producer notifications
    useEffect(() => {
        if (!socket) return;
        
        const handleIncomingProducer = async (data: any) => {
            const existingConsumer = mediaSoupStateRef.current.consumers.get(socket.id!);
            existingConsumer?.forEach(c => c.close());
            mediaSoupStateRef.current.consumers.delete(socket.id!);

            for (const peerId in data.producers) {
                await consume(
                    data.producers[peerId], 
                    mediaSoupStateRef.current.device!, 
                    roomState.name, 
                    mediaSoupStateRef.current.consumerTransport!
                );
            }
        };
        
        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);

        return () => {
            socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer);
        };
    }, [socket, roomState.name, consume]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (!socket) return;
            socket.emit(SocketEvent.LEAVE_ROOM);

            const state = mediaSoupStateRef.current;
            state.producerTransport?.close();
            state.consumerTransport?.close();
        };
    }, [socket]);
    
    // Replace producer tracks (for switching video sources)
    const replaceProducerTracks = useCallback(async (newStream: MediaStream) => {
        if (!isHost || !socket) return;
        
        const producers = mediaSoupStateRef.current.producers.get(socket.id!);
        if (!producers) return;

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];

        for (const producer of producers) {
            if (producer.kind === 'video' && videoTrack) {
                await producer.replaceTrack({ track: videoTrack });
            } else if (producer.kind === 'audio' && audioTrack) {
                await producer.replaceTrack({ track: audioTrack });
            }
        }
    }, [isHost, socket]);

    return {
        // Room management
        joinRoom,
        isConnected,
        isJoined: roomState.joined,
        
        // Producer controls
        onPause,
        onPlay,
        pauseProducers,
        resumeProducers,
        replaceProducerTracks,
        
        // State
        mediaSoupState,
    };
};
