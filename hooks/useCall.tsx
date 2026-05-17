import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";

export interface CallParticipant {
  socketId: string;
  username: string;
  profile?: string;
  stream?: MediaStream;
}

interface UseCallParams {
  roomId: string | null;
  enabled: boolean;
}

export const useCall = ({ roomId, enabled }: UseCallParams) => {
  const { socket } = useSocket();

  const [isInCall, setIsInCall] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, CallParticipant>>(new Map());

  // mediasoup refs
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const isJoiningRef = useRef(false);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const connectTransport = useCallback(
    (transport: Transport, currentRoomId: string) => {
      transport.on("connect", async ({ dtlsParameters }: any, callback: any, errback: any) => {
        try {
          const res = await socket?.emitWithAck(SocketEvent.CALL_CONNECT_TRANSPORT, {
            roomId: currentRoomId,
            transportId: transport.id,
            dtlsParameters,
          });
          res?.success || res?.alreadyConnected ? callback() : errback(new Error(res?.error));
        } catch (e) {
          errback(e as Error);
        }
      });
    },
    [socket]
  );

  const consumeProducer = useCallback(
    async (
      info: { producerId: string; kind: string; peerId: string },
      device: mediasoupClient.Device,
      transport: Transport,
      currentRoomId: string
    ) => {
      if (!socket) return;
      try {
        const response = await socket.emitWithAck(SocketEvent.CALL_CONSUME, {
          roomId: currentRoomId,
          transportId: transport.id,
          producerId: info.producerId,
          rtpCapabilities: device.rtpCapabilities,
        });
        if (!response?.consumerData) return;

        const consumer = await transport.consume(response.consumerData);
        await consumer.resume();
        consumersRef.current.set(consumer.id, consumer);

        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          const existing = next.get(info.peerId);
          const tracks = existing?.stream ? [...existing.stream.getTracks()] : [];
          tracks.push(consumer.track);
          const stream = new MediaStream(tracks);
          next.set(info.peerId, { ...existing, socketId: info.peerId, username: existing?.username ?? info.peerId, stream });
          return next;
        });

        await socket.emitWithAck(SocketEvent.CALL_UNPAUSE_CONSUMERS, {
          roomId: currentRoomId,
          consumerIds: [consumer.id],
        });
      } catch (error) {
        console.error("[CALL] consumeProducer error:", error);
      }
    },
    [socket]
  );

  const closeAndClearTransports = useCallback(() => {
    audioProducerRef.current?.close();
    videoProducerRef.current?.close();
    consumersRef.current.forEach((c) => c.close());
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    audioProducerRef.current = null;
    videoProducerRef.current = null;
    consumersRef.current = new Map();
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    deviceRef.current = null;
  }, []);

  // ─── joinCall ───────────────────────────────────────────────────────────────

  const joinCall = useCallback(async () => {
    if (!socket || !roomId || isJoiningRef.current || isInCall) return;
    isJoiningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const response = await socket.emitWithAck(SocketEvent.CALL_JOIN, { roomId });
      if (!response?.success) {
        stream.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        showError("Call failed", response?.error ?? "Could not join call");
        return;
      }

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: response.rtpCapabilities });
      deviceRef.current = device;

      // ── send transport ──
      const sendTransport = device.createSendTransport({
        ...response.sendTransportOptions,
        iceServers: response.iceServers,
      });
      connectTransport(sendTransport, roomId);

      sendTransport.on("produce", async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
        try {
          const res = await socket.emitWithAck(SocketEvent.CALL_PRODUCE, {
            roomId,
            transportId: sendTransport.id,
            kind,
            rtpParameters,
          });
          res?.success ? callback({ id: res.id }) : errback(new Error(res?.error));
        } catch (e) {
          errback(e as Error);
        }
      });

      sendTransportRef.current = sendTransport;

      // produce audio
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
      }

      // produce video
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoProducerRef.current = await sendTransport.produce({ track: videoTrack });
      }

      // notify others about our producers
      const producers = [
        audioProducerRef.current && { kind: "audio", peerId: socket.id, producerId: audioProducerRef.current.id },
        videoProducerRef.current && { kind: "video", peerId: socket.id, producerId: videoProducerRef.current.id },
      ].filter(Boolean);

      if (producers.length) {
        socket.emit(SocketEvent.CALL_INCOMING_PRODUCER, { roomId, producers: { [socket.id!]: producers } });
      }

      // ── recv transport ──
      const recvTransport = device.createRecvTransport({
        ...response.recvTransportOptions,
        iceServers: response.iceServers,
      });
      connectTransport(recvTransport, roomId);
      recvTransportRef.current = recvTransport;

      // consume existing participants
      const existing = response.existingProducers as Record<string, { producerId: string; kind: string; peerId: string }[]>;
      if (existing) {
        for (const peerId of Object.keys(existing)) {
          for (const info of existing[peerId]) {
            await consumeProducer({ ...info, peerId }, device, recvTransport, roomId);
          }
        }
      }

      setIsInCall(true);
    } catch (error: any) {
      console.error("[CALL] joinCall error:", error);
      showError("Call failed", error?.message ?? "Could not start camera/microphone");
      closeAndClearTransports();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    } finally {
      isJoiningRef.current = false;
    }
  }, [socket, roomId, isInCall, connectTransport, consumeProducer, closeAndClearTransports]);

  // ─── leaveCall ──────────────────────────────────────────────────────────────

  const leaveCall = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit(SocketEvent.CALL_LEAVE, { roomId });
    closeAndClearTransports();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteParticipants(new Map());
    setIsInCall(false);
    setIsMicOn(true);
    setIsCameraOn(true);
  }, [socket, roomId, closeAndClearTransports]);

  // ─── mic / camera toggles ────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  }, []);

  // ─── socket event handlers ───────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !enabled) return;

    const onParticipantJoined = (data: { socketId: string; username: string; profile?: string }) => {
      setRemoteParticipants((prev) => {
        if (prev.has(data.socketId)) return prev;
        const next = new Map(prev);
        next.set(data.socketId, { socketId: data.socketId, username: data.username, profile: data.profile });
        return next;
      });
    };

    const onParticipantLeft = (data: { socketId: string }) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    };

    const onIncomingProducer = async (data: { roomId: string; producers: Record<string, { producerId: string; kind: string }[]> }) => {
      if (data.roomId !== roomId || !isInCall) return;
      const device = deviceRef.current;
      const transport = recvTransportRef.current;
      if (!device || !transport || transport.closed) return;

      for (const peerId of Object.keys(data.producers)) {
        if (peerId === socket.id) continue;
        for (const info of data.producers[peerId]) {
          await consumeProducer({ ...info, peerId }, device, transport, roomId!);
        }
      }
    };

    socket.on(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
    socket.on(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
    socket.on(SocketEvent.CALL_INCOMING_PRODUCER, onIncomingProducer);

    return () => {
      socket.off(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
      socket.off(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
      socket.off(SocketEvent.CALL_INCOMING_PRODUCER, onIncomingProducer);
    };
  }, [socket, enabled, roomId, isInCall, consumeProducer]);

  // cleanup on unmount / disable
  useEffect(() => {
    if (!enabled && isInCall) leaveCall();
  }, [enabled, isInCall, leaveCall]);

  useEffect(() => () => { if (isInCall) leaveCall(); }, []);

  return {
    isInCall,
    isMicOn,
    isCameraOn,
    localStream,
    remoteParticipants,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCamera,
  };
};
