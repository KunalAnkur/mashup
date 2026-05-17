import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import type { CallParticipant, CallStreamActions } from "@/context/CallStreamContext";

interface UseCallSFUParams {
  roomId: string | null;
  enabled: boolean;
  onLocalStream: (stream: MediaStream | null) => void;
  onRemoteParticipantUpdate: (socketId: string, updater: (prev: CallParticipant | undefined) => Partial<CallParticipant>) => void;
  onRemoteParticipantRemove: (socketId: string) => void;
  onCallJoined: () => void;
  onCallLeft: () => void;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
}

export function useCallSFU({
  roomId,
  enabled,
  onLocalStream,
  onRemoteParticipantUpdate,
  onRemoteParticipantRemove,
  onCallJoined,
  onCallLeft,
  localStreamRef,
}: UseCallSFUParams): CallStreamActions {
  const { socket } = useSocket();

  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const joiningRef = useRef(false);
  const isInCallRef = useRef(false);

  const closeTransports = useCallback(() => {
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

  const connectTransport = useCallback((transport: Transport, cRoomId: string) => {
    transport.on("connect", async ({ dtlsParameters }: any, cb: any, eb: any) => {
      try {
        const res = await socket?.emitWithAck(SocketEvent.CALL_CONNECT_TRANSPORT, {
          roomId: cRoomId, transportId: transport.id, dtlsParameters,
        });
        res?.success || res?.alreadyConnected ? cb() : eb(new Error(res?.error));
      } catch (e) { eb(e as Error); }
    });
  }, [socket]);

  const consumeProducer = useCallback(async (
    info: { producerId: string; kind: string; peerId: string },
    device: mediasoupClient.Device,
    transport: Transport,
    cRoomId: string,
  ) => {
    if (!socket) return;
    try {
      const res = await socket.emitWithAck(SocketEvent.CALL_CONSUME, {
        roomId: cRoomId, transportId: transport.id,
        producerId: info.producerId, rtpCapabilities: device.rtpCapabilities,
      });
      if (!res?.consumerData) return;
      const consumer = await transport.consume(res.consumerData);
      await consumer.resume();
      consumersRef.current.set(consumer.id, consumer);

      // Merge track into this peer's stream
      onRemoteParticipantUpdate(info.peerId, (prev: CallParticipant | undefined) => {
        const tracks = prev?.stream ? [...prev.stream.getTracks()] : [];
        tracks.push(consumer.track);
        return { stream: new MediaStream(tracks) };
      });

      await socket.emitWithAck(SocketEvent.CALL_UNPAUSE_CONSUMERS, {
        roomId: cRoomId, consumerIds: [consumer.id],
      });
    } catch (e) {
      console.error("[CALL SFU] consumeProducer error:", e);
    }
  }, [socket, onRemoteParticipantUpdate]);

  const joinCall = useCallback(async (opts?: { micOn?: boolean; cameraOn?: boolean }): Promise<void> => {
    if (!socket || !roomId || !enabled || joiningRef.current || isInCallRef.current) return;
    joiningRef.current = true;
    try {
      const wantMic = opts?.micOn !== false;
      const wantCam = opts?.cameraOn !== false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Apply requested initial enablement
      stream.getAudioTracks().forEach((t) => { t.enabled = wantMic; });
      stream.getVideoTracks().forEach((t) => { t.enabled = wantCam; });
      localStreamRef.current = stream;
      onLocalStream(stream);

      const res = await socket.emitWithAck(SocketEvent.CALL_JOIN, {
        roomId,
        initialMicOn: wantMic,
        initialCameraOn: wantCam,
      });
      if (!res?.success || res.callMode !== "sfu") {
        stream.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        onLocalStream(null);
        if (res?.callMode === "p2p") return; // handed off to P2P hook
        showError("Call failed", res?.error ?? "Could not join call");
        return;
      }

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: res.rtpCapabilities });
      deviceRef.current = device;

      // send transport
      const sendTransport = device.createSendTransport({
        ...res.sendTransportOptions, iceServers: res.iceServers,
      });
      connectTransport(sendTransport, roomId);
      sendTransport.on("produce", async ({ kind, rtpParameters }: any, cb: any, eb: any) => {
        try {
          const r = await socket.emitWithAck(SocketEvent.CALL_PRODUCE, {
            roomId, transportId: sendTransport.id, kind, rtpParameters,
          });
          r?.success ? cb({ id: r.id }) : eb(new Error(r?.error));
        } catch (e) { eb(e as Error); }
      });
      sendTransportRef.current = sendTransport;

      // produce audio + video
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoProducerRef.current = await sendTransport.produce({ track: videoTrack });

      // announce producers to room
      const producers = [
        audioProducerRef.current && { kind: "audio", peerId: socket.id, producerId: audioProducerRef.current.id },
        videoProducerRef.current && { kind: "video", peerId: socket.id, producerId: videoProducerRef.current.id },
      ].filter(Boolean);
      if (producers.length) {
        socket.emit(SocketEvent.CALL_INCOMING_PRODUCER, { roomId, producers: { [socket.id!]: producers } });
      }

      // recv transport
      const recvTransport = device.createRecvTransport({
        ...res.recvTransportOptions, iceServers: res.iceServers,
      });
      connectTransport(recvTransport, roomId);
      recvTransportRef.current = recvTransport;

      // consume existing producers
      const existing = res.existingProducers as Record<string, { producerId: string; kind: string; peerId: string }[]>;
      if (existing) {
        for (const peerId of Object.keys(existing)) {
          for (const info of existing[peerId]) {
            await consumeProducer({ ...info, peerId }, device, recvTransport, roomId);
          }
        }
      }

      // Sync existing participants' mic/camera state so we don't show stale "on" defaults
      const existingMediaStates = res.existingMediaStates as
        | Record<string, { isMicOn: boolean; isCameraOn: boolean }>
        | undefined;
      if (existingMediaStates) {
        for (const peerId of Object.keys(existingMediaStates)) {
          const state = existingMediaStates[peerId];
          onRemoteParticipantUpdate(peerId, () => ({
            isMicOn: state.isMicOn,
            isCameraOn: state.isCameraOn,
          }));
        }
      }

      isInCallRef.current = true;
      onCallJoined();
    } catch (e: any) {
      console.error("[CALL SFU] joinCall error:", e);
      showError("Call failed", e?.message ?? "Camera/microphone error");
      closeTransports();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      onLocalStream(null);
    } finally {
      joiningRef.current = false;
    }
  }, [socket, roomId, enabled, connectTransport, consumeProducer, closeTransports,
      localStreamRef, onLocalStream, onCallJoined]);

  const leaveCall = useCallback((): void => {
    if (!socket || !roomId || !isInCallRef.current) return;
    socket.emit(SocketEvent.CALL_LEAVE, { roomId });
    closeTransports();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    onLocalStream(null);
    isInCallRef.current = false;
    onCallLeft();
  }, [socket, roomId, closeTransports, localStreamRef, onLocalStream, onCallLeft]);

  const toggleMic = useCallback((): void => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  const toggleCamera = useCallback((): void => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  // incoming producer from other call participants
  useEffect(() => {
    if (!socket || !enabled || !roomId) return;
    const handler = async (data: { roomId: string; producers: Record<string, any[]> }) => {
      if (data.roomId !== roomId || !isInCallRef.current) return;
      const device = deviceRef.current;
      const transport = recvTransportRef.current;
      if (!device || !transport || transport.closed) return;
      for (const peerId of Object.keys(data.producers)) {
        if (peerId === socket.id) continue;
        for (const info of data.producers[peerId]) {
          await consumeProducer({ ...info, peerId }, device, transport, roomId);
        }
      }
    };
    socket.on(SocketEvent.CALL_INCOMING_PRODUCER, handler);
    return () => { socket.off(SocketEvent.CALL_INCOMING_PRODUCER, handler); };
  }, [socket, enabled, roomId, consumeProducer]);

  // cleanup on disable / unmount
  useEffect(() => {
    if (!enabled && isInCallRef.current) leaveCall();
  }, [enabled, leaveCall]);

  useEffect(() => () => { if (isInCallRef.current) leaveCall(); }, []);

  return { joinCall, leaveCall, toggleMic, toggleCamera };
}
