import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import * as mediasoupClient from "mediasoup-client";
import type {
  Consumer,
  DtlsParameters,
  MediaKind,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import { getUserMediaStream } from "@/utils/helper";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CallParticipant {
  socketId: string;
  username: string;
  profile?: string;
  stream?: MediaStream;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export interface CallActions {
  joinCall: (opts?: { micOn?: boolean; cameraOn?: boolean }) => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  /**
   * Acquire a track that was not asked for when the call started, add it to the local stream,
   * and publish it — turning the camera on partway through an audio-only call.
   *
   * Optional because it only applies to a transport that requests exactly what the user chose.
   * The SFU path always acquires both and merely disables one, so it never has a track to add.
   * Returns null when the device is unavailable or permission is refused.
   */
  ensureTrack?: (kind: "audio" | "video") => Promise<MediaStreamTrack | null>;
}

export interface UseAudioVideoCallParams {
  roomId: string | null;
  /** Enable when the room host is premium and the local user has joined the room */
  enabled: boolean;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  onLocalStream: (stream: MediaStream | null) => void;
  /** Called to add/update a track into a remote participant's stream */
  onParticipantUpdate: (
    socketId: string,
    updater: (prev: CallParticipant | undefined) => Partial<CallParticipant>
  ) => void;
  onParticipantRemove: (socketId: string) => void;
  onJoined: () => void;
  onLeft: (opts?: { keepRemoteParticipants?: boolean }) => void;
}

type ProducerInfo = { producerId: string; kind: string; peerId: string };
type ExistingProducers = Record<string, ProducerInfo[]>;
type ExistingMediaStates = Record<string, { isMicOn: boolean; isCameraOn: boolean }>;
type ExistingParticipant = { socketId: string; username: string; profile?: string };
type CallJoinResponse = {
  success?: boolean;
  error?: string;
  rtpCapabilities?: RtpCapabilities;
  sendTransportOptions?: TransportOptions;
  recvTransportOptions?: TransportOptions;
  iceServers?: RTCIceServer[];
  existingProducers?: ExistingProducers;
  existingParticipants?: ExistingParticipant[];
  existingMediaStates?: ExistingMediaStates;
};
type ConnectTransportResponse = { success?: boolean; alreadyConnected?: boolean; error?: string };
type ProduceResponse = { success?: boolean; id?: string; error?: string };
type ConsumeResponse = {
  consumerData?: Parameters<Transport["consume"]>[0];
  error?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// Many-to-many SFU call using mediasoup. Room members attach a recv transport
// automatically, so active publishers are visible as soon as someone enters the
// room. Clicking the call button only upgrades the local peer into a publisher.

export function useAudioVideoCall({
  roomId,
  enabled,
  localStreamRef,
  onLocalStream,
  onParticipantUpdate,
  onJoined,
  onLeft,
}: UseAudioVideoCallParams): CallActions {
  const { socket } = useSocket();

  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const consumedProducerIdsRef = useRef<Set<string>>(new Set());
  const receivingRef = useRef(false);
  const receivingPromiseRef = useRef<Promise<boolean> | null>(null);
  const joiningRef = useRef(false);
  const inCallRef = useRef(false);

  // ─── Resource cleanup ──────────────────────────────────────────────────────

  const closeSendResources = useCallback(() => {
    audioProducerRef.current?.close();
    videoProducerRef.current?.close();
    sendTransportRef.current?.close();
    audioProducerRef.current = null;
    videoProducerRef.current = null;
    sendTransportRef.current = null;
  }, []);

  const closeReceiveResources = useCallback(() => {
    consumersRef.current.forEach((consumer) => consumer.close());
    recvTransportRef.current?.close();
    consumersRef.current = new Map();
    consumedProducerIdsRef.current = new Set();
    recvTransportRef.current = null;
    receivingRef.current = false;
  }, []);

  const clearLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    onLocalStream(null);
  }, [localStreamRef, onLocalStream]);

  const closeAllResources = useCallback(() => {
    closeSendResources();
    closeReceiveResources();
    deviceRef.current = null;
    joiningRef.current = false;
    inCallRef.current = false;
  }, [closeReceiveResources, closeSendResources]);

  // ─── Shared setup helpers ──────────────────────────────────────────────────

  const wireConnect = useCallback(
    (transport: Transport, cRoomId: string) => {
      transport.on("connect", async (
        { dtlsParameters }: { dtlsParameters: DtlsParameters },
        cb: () => void,
        eb: (error: Error) => void
      ) => {
        try {
          const res = await socket?.emitWithAck(SocketEvent.CALL_CONNECT_TRANSPORT, {
            roomId: cRoomId,
            transportId: transport.id,
            dtlsParameters,
          }) as ConnectTransportResponse | undefined;
          if (res?.success || res?.alreadyConnected) {
            cb();
          } else {
            eb(new Error(res?.error ?? "Could not connect transport"));
          }
        } catch (e) {
          eb(e instanceof Error ? e : new Error("Could not connect transport"));
        }
      });
    },
    [socket]
  );

  const ensureDevice = useCallback(async (rtpCapabilities: RtpCapabilities | undefined) => {
    if (!rtpCapabilities) {
      throw new Error("Router capabilities were not provided");
    }
    if (deviceRef.current) return deviceRef.current;

    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;
    return device;
  }, []);

  const ensureRecvTransport = useCallback(
    (res: CallJoinResponse, device: mediasoupClient.Device, cRoomId: string) => {
      const currentTransport = recvTransportRef.current;
      if (currentTransport && !currentTransport.closed) {
        return currentTransport;
      }

      if (!res.recvTransportOptions) {
        throw new Error("Receive transport was not provided");
      }

      const recvTransport = device.createRecvTransport({
        ...res.recvTransportOptions,
        iceServers: res.iceServers,
      });
      wireConnect(recvTransport, cRoomId);
      recvTransportRef.current = recvTransport;
      return recvTransport;
    },
    [wireConnect]
  );

  const applyExistingCallState = useCallback(
    (res: CallJoinResponse) => {
      res.existingParticipants?.forEach((participant) => {
        onParticipantUpdate(participant.socketId, (prev) => ({
          username: participant.username,
          profile: participant.profile,
          isMicOn: prev?.isMicOn ?? true,
          isCameraOn: prev?.isCameraOn ?? true,
          stream: prev?.stream,
        }));
      });

      if (!res.existingMediaStates) return;
      for (const [peerId, state] of Object.entries(res.existingMediaStates)) {
        onParticipantUpdate(peerId, () => ({
          isMicOn: state.isMicOn,
          isCameraOn: state.isCameraOn,
        }));
      }
    },
    [onParticipantUpdate]
  );

  // ─── Consume remote producers ──────────────────────────────────────────────

  const consumeProducer = useCallback(
    async (
      info: ProducerInfo,
      device: mediasoupClient.Device,
      transport: Transport,
      cRoomId: string
    ) => {
      if (!socket || consumedProducerIdsRef.current.has(info.producerId)) return;

      consumedProducerIdsRef.current.add(info.producerId);
      try {
        const res = await socket.emitWithAck(SocketEvent.CALL_CONSUME, {
          roomId: cRoomId,
          transportId: transport.id,
          producerId: info.producerId,
          rtpCapabilities: device.rtpCapabilities,
        }) as ConsumeResponse;
        if (!res?.consumerData) {
          consumedProducerIdsRef.current.delete(info.producerId);
          console.error("[CALL] consumeProducer: server rejected consume", res?.error, info);
          return;
        }

        const consumer = await transport.consume(res.consumerData);
        await consumer.resume();
        consumersRef.current.set(consumer.id, consumer);

        onParticipantUpdate(info.peerId, (prev) => {
          const tracks = prev?.stream
            ? prev.stream.getTracks().filter((track) => track.id !== consumer.track.id)
            : [];
          tracks.push(consumer.track);
          return { stream: new MediaStream(tracks) };
        });

        await socket.emitWithAck(SocketEvent.CALL_UNPAUSE_CONSUMERS, {
          roomId: cRoomId,
          consumerIds: [consumer.id],
        });
      } catch (e) {
        consumedProducerIdsRef.current.delete(info.producerId);
        console.error("[CALL] consumeProducer error:", e);
      }
    },
    [socket, onParticipantUpdate]
  );

  const consumeProducerMap = useCallback(
    async (
      existingProducers: ExistingProducers | undefined,
      device: mediasoupClient.Device,
      recvTransport: Transport,
      cRoomId: string
    ) => {
      if (!existingProducers) return;

      for (const peerId of Object.keys(existingProducers)) {
        if (peerId === socket?.id) continue;
        for (const info of existingProducers[peerId]) {
          await consumeProducer({ ...info, peerId }, device, recvTransport, cRoomId);
        }
      }
    },
    [consumeProducer, socket?.id]
  );

  // ─── Receive-only attachment ───────────────────────────────────────────────

  const startReceiving = useCallback(async (): Promise<boolean> => {
    if (!socket || !roomId || !enabled) return false;

    const currentTransport = recvTransportRef.current;
    if (receivingRef.current && currentTransport && !currentTransport.closed) {
      return true;
    }

    if (receivingPromiseRef.current) {
      return receivingPromiseRef.current;
    }

    receivingPromiseRef.current = (async () => {
      try {
        const res = await socket.emitWithAck(SocketEvent.CALL_JOIN, {
          roomId,
          receiveOnly: true,
        }) as CallJoinResponse;

        if (!res?.success) {
          console.warn("[CALL] receive-only attach failed:", res?.error);
          return false;
        }

        const device = await ensureDevice(res.rtpCapabilities);
        const recvTransport = ensureRecvTransport(res, device, roomId);
        receivingRef.current = true;
        applyExistingCallState(res);
        await consumeProducerMap(res.existingProducers, device, recvTransport, roomId);
        return true;
      } catch (e) {
        console.error("[CALL] startReceiving error:", e);
        return false;
      } finally {
        receivingPromiseRef.current = null;
      }
    })();

    return receivingPromiseRef.current;
  }, [
    socket,
    roomId,
    enabled,
    applyExistingCallState,
    consumeProducerMap,
    ensureDevice,
    ensureRecvTransport,
  ]);

  // ─── Publish local mic/camera ──────────────────────────────────────────────

  const joinCall = useCallback(
    async (opts?: { micOn?: boolean; cameraOn?: boolean }): Promise<void> => {
      if (!socket || !roomId || !enabled || joiningRef.current || inCallRef.current) return;
      joiningRef.current = true;
      let publishRegistered = false;

      try {
        if (receivingPromiseRef.current) {
          await receivingPromiseRef.current;
        }

        const wantMic = opts?.micOn !== false;
        const wantCam = opts?.cameraOn !== false;

        const stream = await getUserMediaStream({ video: true, audio: true });
        if (!stream) {
          showError("Call failed", "Could not access camera or microphone");
          return;
        }
        stream.getAudioTracks().forEach((track) => { track.enabled = wantMic; });
        stream.getVideoTracks().forEach((track) => { track.enabled = wantCam; });
        localStreamRef.current = stream;
        onLocalStream(stream);

        const res = await socket.emitWithAck(SocketEvent.CALL_JOIN, {
          roomId,
          initialMicOn: wantMic,
          initialCameraOn: wantCam,
          receiveOnly: false,
        }) as CallJoinResponse;

        if (!res?.success) {
          clearLocalStream();
          showError("Call failed", res?.error ?? "Could not join call");
          return;
        }

        publishRegistered = true;
        const device = await ensureDevice(res.rtpCapabilities);
        const recvTransport = ensureRecvTransport(res, device, roomId);
        receivingRef.current = true;

        if (!res.sendTransportOptions) {
          throw new Error("Send transport was not provided");
        }

        const sendTransport = device.createSendTransport({
          ...res.sendTransportOptions,
          iceServers: res.iceServers,
        });
        wireConnect(sendTransport, roomId);
        sendTransport.on("produce", async (
          { kind, rtpParameters }: { kind: MediaKind; rtpParameters: RtpParameters },
          cb: ({ id }: { id: string }) => void,
          eb: (error: Error) => void
        ) => {
          try {
            const produceRes = await socket.emitWithAck(SocketEvent.CALL_PRODUCE, {
              roomId,
              transportId: sendTransport.id,
              kind,
              rtpParameters,
            }) as ProduceResponse;
            if (produceRes?.success && produceRes.id) {
              cb({ id: produceRes.id });
            } else {
              eb(new Error(produceRes?.error ?? "Could not produce media"));
            }
          } catch (e) {
            eb(e instanceof Error ? e : new Error("Could not produce media"));
          }
        });
        sendTransportRef.current = sendTransport;

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
        }
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoProducerRef.current = await sendTransport.produce({ track: videoTrack });
        }

        const myProducers = [
          audioProducerRef.current && { kind: "audio", peerId: socket.id, producerId: audioProducerRef.current.id },
          videoProducerRef.current && { kind: "video", peerId: socket.id, producerId: videoProducerRef.current.id },
        ].filter(Boolean);
        if (myProducers.length) {
          socket.emit(SocketEvent.CALL_INCOMING_PRODUCER, {
            roomId,
            producers: { [socket.id!]: myProducers },
          });
        }

        applyExistingCallState(res);
        await consumeProducerMap(res.existingProducers, device, recvTransport, roomId);

        inCallRef.current = true;
        onJoined();
      } catch (e: unknown) {
        console.error("[CALL] joinCall error:", e);
        showError("Call failed", e instanceof Error ? e.message : "Camera/microphone error");
        if (publishRegistered) {
          socket.emit(SocketEvent.CALL_LEAVE, { roomId, keepReceiving: true });
        }
        closeSendResources();
        clearLocalStream();
        inCallRef.current = false;
        onLeft({ keepRemoteParticipants: true });
      } finally {
        joiningRef.current = false;
      }
    },
    [
      socket,
      roomId,
      enabled,
      applyExistingCallState,
      clearLocalStream,
      closeSendResources,
      consumeProducerMap,
      ensureDevice,
      ensureRecvTransport,
      localStreamRef,
      onJoined,
      onLeft,
      onLocalStream,
      wireConnect,
    ]
  );

  // ─── Stop publishing while staying subscribed ──────────────────────────────

  const leaveCall = useCallback((): void => {
    if (!socket || !roomId || !inCallRef.current) return;
    socket.emit(SocketEvent.CALL_LEAVE, { roomId, keepReceiving: true });
    closeSendResources();
    clearLocalStream();
    inCallRef.current = false;
    onLeft({ keepRemoteParticipants: true });
    void startReceiving();
  }, [socket, roomId, closeSendResources, clearLocalStream, onLeft, startReceiving]);

  // Track toggles: context owns the state, hook just flips the underlying track
  const toggleMic = useCallback((): void => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  const toggleCamera = useCallback((): void => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  // ─── Socket: new producer announced by another participant ─────────────────

  useEffect(() => {
    if (!socket || !enabled || !roomId) return;

    const handler = async (data: { roomId: string; producers: Record<string, ProducerInfo[]> }) => {
      if (data.roomId !== roomId) return;

      let device = deviceRef.current;
      let transport = recvTransportRef.current;
      if (!device || !transport || transport.closed) {
        const attached = await startReceiving();
        if (!attached) return;
        device = deviceRef.current;
        transport = recvTransportRef.current;
      }
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
  }, [socket, enabled, roomId, consumeProducer, startReceiving]);

  // ─── Auto receive on room join / cleanup on room exit ──────────────────────

  const detachFromCallMedia = useCallback(() => {
    if (socket && roomId && (receivingRef.current || inCallRef.current)) {
      socket.emit(SocketEvent.CALL_LEAVE, { roomId });
    }
    closeAllResources();
    clearLocalStream();
    onLeft();
  }, [socket, roomId, clearLocalStream, closeAllResources, onLeft]);

  useEffect(() => {
    if (!enabled || !roomId || !socket) {
      detachFromCallMedia();
      return;
    }

    void startReceiving();
    return () => {
      detachFromCallMedia();
    };
  }, [enabled, roomId, socket, startReceiving, detachFromCallMedia]);

  return { joinCall, leaveCall, toggleMic, toggleCamera };
}
