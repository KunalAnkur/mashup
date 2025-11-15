import { useEffect, useState, useCallback, useRef } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer, RtpCapabilities } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { useFileContext } from "@/context/FileContext";

interface UseMediaSoupParams {
    playerRef: React.RefObject<ReactPlayer | null>;
    isHost: boolean;
}

interface RoomState {
    name: string;
    isHost: boolean;
    username: string;
    joined: boolean;
    videoReady: boolean;
}

interface MediaSoupState {
    device: mediasoupClient.Device | null;
    producerTransport: Transport | null;
    consumerTransport: Transport | null;
    producers: Map<string, Producer[]>;
    consumers: Map<string, Consumer[]>;
}

export const useMediaSoup = ({ playerRef, isHost }: UseMediaSoupParams) => {
    const { socket, isConnected } = useSocket('filestream');
    const { setStream } = useMediaStreamContext();
    const { files } = useFileContext();
    const [roomState, setRoomState] = useState<RoomState>({
        name: '',
        isHost,
        username: '',
        joined: false,
        videoReady: false
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
            // debugger
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
    const createProducerTransport = useCallback(async (device: mediasoupClient.Device, parameters: mediasoupClient.types.TransportOptions, roomId: string) => {
        const transport = device.createSendTransport(parameters);

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            await handleTransportConnect(transport.id, dtlsParameters, roomId, callback, errback);
        });

        transport.on('produce', async (parameters, callback, errback) => {
            await handleTransportProduce(transport.id, parameters.kind, parameters.rtpParameters, roomId, callback, errback);
        });

        return transport;
    }, [socket, handleTransportConnect, handleTransportProduce]);

    // Create consumer transport (only for non-hosts)
    const createConsumerTransport = useCallback(async (device: mediasoupClient.Device, parameters: mediasoupClient.types.TransportOptions, roomId: string) => {
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

    // Create video stream from ReactPlayer
    const createVideoStream = useCallback((): MediaStream | null => {
        if (!playerRef.current) {
            console.error('Player ref not available');
            return null;
        }

        const videoElement = playerRef.current.getInternalPlayer() as (HTMLVideoElement & { captureStream?: () => MediaStream });
        if (!videoElement?.captureStream) {
            console.error('Video element or captureStream not available');
            return null;
        }
        const stream = videoElement.captureStream();
        return stream;
    }, [playerRef, files]);

    // Consume media from producer
    const consume = useCallback(async (
        producerInfo: { producerId: string; peerId: string; kind: string }[],
        device: mediasoupClient.types.Device,
        roomId: string,
        transport: mediasoupClient.types.Transport
    ) => {
        console.log('consuming =>', producerInfo, device, roomId, transport);
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
            await socket.emitWithAck(SocketEvent.UNPAUSE_CONSUMERS, { roomId, consumerIds: [videoConsumer.id, audioConsumer.id] });
            console.log({ vtrack: videoConsumer.track, atrack: audioConsumer.track })
            
            const remoteStream = new MediaStream([videoConsumer.track, audioConsumer.track]);

            setStream(remoteStream);

            setMediaSoupState((prev) => {
                const consumers = new Map<string, Consumer[]>(prev.consumers);
                consumers.set(socket.id as string, [videoConsumer, audioConsumer]);
                return {
                    ...prev,
                    consumers
                }
            });
        } catch (error) {
            console.error('Failed to consume media:', error);
        }
    }, [socket, playerRef]);

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
            console.log({ response });
            const { sendTransportOptions, recvTransportOptions, rtpCapabilities, existingProducers } = response;
            const device = await initializeDevice(rtpCapabilities);
            setMediaSoupState((prev) => ({...prev, device}))
            if (isHostFlag) {
                // debugger
                const transport = await createProducerTransport(device, sendTransportOptions, room);
                const stream = createVideoStream();
                console.log(stream);
                setMediaSoupState((prev) => ({ ...prev, producerTransport: transport }))
                if (!stream) {
                    throw new Error('Failed to create video stream');
                }
                console.log({ videoTrack: stream.getVideoTracks(), audioTrack:stream.getAudioTracks() })
                const [videoTrack, audioTrack] = [stream.getVideoTracks()[0], stream.getAudioTracks()[0]];
                // const [videoProducer, audioProducer] = await Promise.all([
                //     transport.produce({
                //         track: videoTrack, 
                //         // encodings: [
                //         //     { maxBitrate: 150_000, scaleResolutionDownBy: 4.0 }, // Low (240p)
                //         //     { maxBitrate: 400_000, scaleResolutionDownBy: 2.0 }, // Medium (480p)
                //         //     { maxBitrate: 1_000_000 } // High (720p)
                //         //   ],
                //         // codecOptions: {
                //         //     videoGoogleStartBitrate: 1000
                //         // }
                //         encodings: [
                //             // {
                //             //     scaleResolutionDownBy: 4.0, // 240p
                //             //     maxBitrate: 150_000,
                //             // },
                //             // {
                //             //     scaleResolutionDownBy: 2.0, // 360p
                //             //     maxBitrate: 300_000,
                //             // },
                //             // {
                //             //     scaleResolutionDownBy: 1.0, // 480p
                //             //     maxBitrate: 600_000,
                //             // },

                //             // {
                //             //     scaleResolutionDownBy: 4.0, // ~180p
                //             //     maxBitrate: 150_000,
                //             // },
                //             // {
                //             //     scaleResolutionDownBy: 2.0, // ~360p
                //             //     maxBitrate: 300_000,
                //             // },
                //             // {
                //             //     scaleResolutionDownBy: 1.5, // ~480p
                //             //     maxBitrate: 600_000,
                //             // },
                //             // {
                //             //     scaleResolutionDownBy: 1.0, // 720p (original)
                //             //     maxBitrate: 1_000_000, // 1 Mbps for HD
                //             //   }
                //         ],
                //         codecOptions: {
                //             videoGoogleStartBitrate: 300,
                //         },
                //         codec: device.rtpCapabilities.codecs?.find(c => c.mimeType === "video/VP8" )
                //     }),
                //     transport.produce({ track: audioTrack }),
                // ]);
                const audioProducer = await transport.produce({ track: audioTrack })
                const videoProducer = await transport.produce({ track: videoTrack })

                // TODO: NEED TO HANDLE THESE ALL EVENTS
                videoProducer.on('trackended', () => console.log('Video track ended'));
                videoProducer.on('transportclose', () => console.log('Video transport closed'));
                audioProducer.on('trackended', () => console.log('Audio track ended'));
                audioProducer.on('transportclose', () => console.log('Audio transport closed'));

                socket.emit(SocketEvent.INCOMING_PRODUCER, (
                    { 
                        roomId: room, 
                        producers: { 
                            [socket.id!]: [
                                { kind: videoProducer.kind, peerId: socket.id, producerId: videoProducer.id }, 
                                { kind: audioProducer.kind, peerId: socket.id, producerId: audioProducer.id }
                            ] 
                        }
                    }
                ));
                setMediaSoupState((prev) => {
                    const producers = new Map<string, Producer[]>(prev.producers);
                    producers.set(socket.id as string, [videoProducer, audioProducer]);
                    return {
                        ...prev,
                        producers
                    }
                });
            } else {
                const transport = await createConsumerTransport(device, recvTransportOptions, room);
                setMediaSoupState((prev) => ({ ...prev, consumerTransport: transport }))
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
    }, [socket, initializeDevice, createProducerTransport, createConsumerTransport, createVideoStream, consume]);
    
    const onPlay = useCallback((event: string) => {
        if (!socket) return;
        if (event === 'seekend') return;
        if (!isHost) return;
        const producers = mediaSoupStateRef.current.producers.get(socket.id!);
        if (producers) producers.forEach(producer => producer.resume());
    }, [isHost, socket]);


    const onPause = useCallback((event: string) => {
        if (!socket) return;
        if (event === "seekend") return;
        if (!isHost) return;
        const producers = mediaSoupStateRef.current.producers.get(socket.id!);
        if (producers) producers.forEach(producer => producer.pause());
    }, [isHost, socket]);

    useEffect(() => {
        if(!socket) return;
        const handleIncomingProducer = async (data: any) => {
            const existingConsumer = mediaSoupStateRef.current.consumers.get(socket.id!);
            existingConsumer?.forEach(existingConsumer => existingConsumer.close());
            mediaSoupStateRef.current.consumers.delete(socket.id!);
            console.log('iteration is now starting', data.producers)

            for (const peerId in data.producers) {
                console.log('iteration is started', peerId)
                await consume(data.producers[peerId], mediaSoupStateRef.current.device!, roomState.name, mediaSoupStateRef.current.consumerTransport!);
            }
            console.log(mediaSoupStateRef.current);
            console.log("Producer Incoming:", data);
        }
        socket.on(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer)

        return () => {
            socket.off(SocketEvent.INCOMING_PRODUCER, handleIncomingProducer)
        }
    }, [socket, roomState.name])

    
    let isMounted = true;

    useEffect(() => {
        return () => {
            isMounted = false;
            if (!socket) return;
            // console.log('disconnect event trigger');
            socket.emit(SocketEvent.LEAVE_ROOM);

            const state = mediaSoupStateRef.current;

            if (state.producerTransport) {
                state.producerTransport.close();
                if (isMounted) {
                    setMediaSoupState((prev) => ({ ...prev, producerTransport: null }));
                }
            }

            if (state.consumerTransport) {
                state.consumerTransport.close();
                if (isMounted) {
                    setMediaSoupState((prev) => ({ ...prev, consumerTransport: null }));
                }
            }

            if (state.device && isMounted) {
                setMediaSoupState((prev) => ({ ...prev, device: null }));
            }
        };
    }, [socket]);
    
    return {
        joinRoom,
        isConnected,
        onPause,
        onPlay
    };
};


