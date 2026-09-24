/**
 * The media capability, over MediaSoup.
 *
 * This is the Crowd path. A Couple room gets `P2PMediaPort` instead, and a room is on
 * one or the other for its whole life — the mode is fixed from the host's tier at join
 * and never flips. Both are permanent; the game cannot tell which one it got, which is
 * the entire reason it talks to an interface (`packages/client/src/media.ts`).
 *
 * ## The picture fans out; the input does not
 *
 * Video goes host → SFU → everyone, because eight peer connections from one browser is
 * eight encodes and there is only one machine doing them. **Input stays peer-to-peer**,
 * over data-only connections from `ActivityPeerMesh` — the same mesh the Couple path
 * uses, carrying the same packets. Routing a keypress through the SFU would put a
 * server hop on the most latency-sensitive path in the product to save a connection
 * that is already open for discovery anyway.
 *
 * So those peer connections carry no media at all here: `localMedia` is deliberately
 * absent, and a link that also published the stream would be sending every frame twice.
 *
 * ## No simulcast
 *
 * One encoding. Simulcast exists so a phone on 3G can take a smaller layer, and at
 * 512x480 there is no smaller layer worth producing — the low rung would be 256x240,
 * which is the native picture and therefore exactly the resampling the 2x capture
 * surface exists to avoid. Spectators on a bad link get a softer picture from the
 * bitrate estimator instead, which is the right knob at this size.
 *
 * ## Reusing the streaming events
 *
 * `GET_TRANSPORT_INFO`, `CONNECT_TRANSPORT`, `PRODUCE`, `CONSUME` and
 * `INCOMING_PRODUCER` are the movie-night events, used unchanged. That is safe because
 * an activity *replaces* the video surface — a room is never streaming a film and
 * running a game at the same time — and it means the Crowd path needs no new server
 * code at all.
 */

import type { Socket } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import type {
  Consumer,
  DtlsParameters,
  Producer,
  RtpParameters,
  Transport,
} from "mediasoup-client/types";
import type {
  DataPort,
  MediaPhase,
  MediaPort,
  MediaProfile,
  MediaStats,
} from "@movmash/arcade-client";

import { hintGameVideo, tuneGameVideoSender } from "@/lib/webrtc/encoder";
import { ActivityPeerMesh } from "./ActivityPeerMesh";
import { EMPTY_STATS, readLinkStats, toEncodeProfile } from "./stats";

/** Matching `communication/src/types/socket.type.ts`. */
const SFU = {
  transportInfo: "getTransportInfo",
  connectTransport: "connectTransport",
  produce: "produce",
  consume: "consume",
  incomingProducer: "incomingProducer",
  unpauseConsumers: "unpauseConsumers",
} as const;

interface ProducerInfo {
  producerId: string;
  kind: string;
}

export interface SfuMediaPortOptions {
  socket: Socket;
  roomId: string;
  iceServers: RTCIceServer[];
  selfUserId: string;
  /**
   * Whether this browser produces.
   *
   * The room's host, not the game's — the server only accepts `PRODUCE` from the room
   * host, and for this game they are the same person because the emulator runs where
   * the room was opened.
   */
  isHost: boolean;
  onPhaseChange?: (phase: MediaPhase) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
}

export class SfuMediaPort implements MediaPort {
  remote: MediaStream | null = null;
  phase: MediaPhase = "idle";

  /** Data only. The picture never touches these. */
  private readonly mesh: ActivityPeerMesh;
  private handlers = new Set<(userId: string, bytes: Uint8Array) => void>();

  private device: mediasoupClient.Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producers: Producer[] = [];
  private consumers: Consumer[] = [];

  private published: { stream: MediaStream; profile: MediaProfile } | null = null;
  private readonly options: SfuMediaPortOptions;
  private disposed = false;

  /**
   * Transport setup is asynchronous and several things race to need it — publishing,
   * a producer announcement, a reconnect. Held as a promise so they all await the one
   * attempt rather than starting three.
   */
  private ready: Promise<void> | null = null;

  constructor(options: SfuMediaPortOptions) {
    this.options = options;

    this.mesh = new ActivityPeerMesh({
      socket: options.socket,
      roomId: options.roomId,
      iceServers: options.iceServers,
      selfUserId: options.selfUserId,
      // Deliberately no `onPhaseChange`: the mesh's health is the *input* path, and the
      // phase a game shows is about the picture. Conflating them would make a spectator
      // with no peer links look like a broken stream.
      onData: (userId, bytes) => {
        for (const handler of this.handlers) handler(userId, bytes);
      },
      // No media on these connections. See the header.
    });

    this.options.socket.on(SFU.incomingProducer, this.onIncomingProducer);
  }

  /**
   * The datagram pipe's own health, which is not the same question as `phase`.
   *
   * Here the two genuinely differ: `phase` is the SFU transports carrying the picture,
   * and this is the peer mesh carrying input. A spectator watching perfectly while
   * their data connection has failed is a real state, and a game that read `phase`
   * would never notice.
   */
  get dataReady(): boolean {
    return this.mesh.dataReady;
  }

  readonly data: DataPort = {
    send: (userId, bytes) => this.mesh.send(userId, bytes),
    broadcast: (bytes) => this.mesh.broadcast(bytes),
    onMessage: (handler) => {
      this.handlers.add(handler);
      return () => this.handlers.delete(handler);
    },
  };

  // -------------------------------------------------------------------------
  // Transport
  // -------------------------------------------------------------------------

  private ensureReady(): Promise<void> {
    this.ready ??= this.setup().catch((error) => {
      // Cleared so a later attempt — a reconnect, or the host publishing again — is a
      // fresh try rather than an await on a promise that already rejected.
      this.ready = null;
      this.setPhase("failed");
      throw error;
    });
    return this.ready;
  }

  private async setup(): Promise<void> {
    if (this.disposed) return;
    this.setPhase("connecting");

    const reply = await this.options.socket.emitWithAck(SFU.transportInfo, {
      roomId: this.options.roomId,
      host: this.options.isHost,
    });
    if (!reply?.success || this.disposed) throw new Error(reply?.error ?? "no transport info");

    const info = reply.response;
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: info.rtpCapabilities });
    this.device = device;

    if (this.options.isHost) {
      this.sendTransport = device.createSendTransport({
        ...info.sendTransportOptions,
        iceServers: info.iceServers ?? this.options.iceServers,
      });
      this.bindConnect(this.sendTransport);
      this.bindProduce(this.sendTransport);
    }

    // Everyone gets a receive transport, the host included: they are in the room and a
    // second player's audio could one day arrive this way. It costs one idle transport.
    this.recvTransport = device.createRecvTransport({
      ...info.recvTransportOptions,
      iceServers: info.iceServers ?? this.options.iceServers,
    });
    this.bindConnect(this.recvTransport);

    // Whatever was already being produced when we arrived — a spectator who joined
    // mid-game has no `INCOMING_PRODUCER` coming, so without this they wait forever.
    const existing = (info.existingProducers ?? {}) as Record<string, ProducerInfo[]>;
    for (const producers of Object.values(existing)) {
      // The last two are the current video and audio; earlier entries belong to
      // producers the host has since replaced.
      if (producers?.length) await this.consumeAll(producers.slice(-2));
    }
  }

  private bindConnect(transport: Transport): void {
    transport.on(
      "connect",
      (
        { dtlsParameters }: { dtlsParameters: DtlsParameters },
        callback: () => void,
        errback: (error: Error) => void,
      ) => {
        this.options.socket
          .emitWithAck(SFU.connectTransport, {
            transportId: transport.id,
            dtlsParameters,
            roomId: this.options.roomId,
          })
          .then((res: { success?: boolean; error?: string }) =>
            res?.success ? callback() : errback(new Error(res?.error ?? "connect refused")),
          )
          .catch((error: Error) => errback(error));
      },
    );
  }

  private bindProduce(transport: Transport): void {
    transport.on(
      "produce",
      (
        { kind, rtpParameters }: { kind: string; rtpParameters: RtpParameters },
        callback: (arg: { id: string }) => void,
        errback: (error: Error) => void,
      ) => {
        this.options.socket
          .emitWithAck(SFU.produce, {
            roomId: this.options.roomId,
            transportId: transport.id,
            kind,
            rtpParameters,
          })
          .then((res: { success?: boolean; id?: string; error?: string }) =>
            res?.success && res.id
              ? callback({ id: res.id })
              : errback(new Error(res?.error ?? "produce refused")),
          )
          .catch((error: Error) => errback(error));
      },
    );
  }

  // -------------------------------------------------------------------------
  // Host side
  // -------------------------------------------------------------------------

  async publish(stream: MediaStream, profile: MediaProfile): Promise<void> {
    if (this.disposed || !this.options.isHost) return;
    this.published = { stream, profile };

    await this.ensureReady();
    const transport = this.sendTransport;
    if (!transport || this.disposed) return;

    const encode = toEncodeProfile(profile);
    const announced: ProducerInfo[] = [];

    for (const track of stream.getTracks()) {
      // Idempotent: republishing the same stream — which a reconnect and a late audio
      // track both do — must not produce a second copy of a track already going out.
      if (this.producers.some((producer) => producer.track === track)) continue;

      if (track.kind === "video") hintGameVideo(track);

      const producer = await transport.produce({
        track,
        // One encoding. No simulcast — see the header.
        ...(track.kind === "video"
          ? {
              encodings: [{ maxBitrate: encode.maxBitrateBps, maxFramerate: encode.targetFps }],
              codecOptions: { videoGoogleStartBitrate: 1_000 },
            }
          : {}),
      });

      this.producers.push(producer);
      announced.push({ producerId: producer.id, kind: track.kind });

      if (track.kind === "video") await this.tune(producer, profile);
    }

    if (announced.length === 0) return;

    // Tell the room there is something to consume. Spectators who arrive later read
    // `existingProducers` instead, which is why both paths exist.
    this.options.socket.emit(SFU.incomingProducer, {
      roomId: this.options.roomId,
      producers: announced,
    });
    this.setPhase("live");
  }

  /**
   * Apply the game's encode profile to the underlying sender.
   *
   * `produce()`'s `encodings` set the bitrate, but not `degradationPreference` — and
   * that is the one setting this whole feature depends on. Its default quietly halves
   * the frame rate of a congested game, which is unplayable in a way a soft picture is
   * not. mediasoup-client exposes the real `RTCRtpSender`, so the same tuning the
   * Couple path applies is applied here.
   */
  private async tune(producer: Producer, profile: MediaProfile): Promise<void> {
    const sender = (producer as unknown as { rtpSender?: RTCRtpSender }).rtpSender;
    if (!sender) return;
    try {
      await tuneGameVideoSender(sender, toEncodeProfile(profile));
    } catch {
      // A browser that refuses the parameters keeps the ones `produce()` negotiated,
      // which is a softer picture rather than a broken one.
    }
  }

  async updateProfile(patch: Partial<MediaProfile>): Promise<void> {
    if (!this.published) return;
    this.published.profile = { ...this.published.profile, ...patch };

    for (const producer of this.producers) {
      if (producer.kind !== "video") continue;
      await this.tune(producer, this.published.profile);
    }
  }

  unpublish(): void {
    for (const producer of this.producers) {
      try {
        producer.close();
      } catch {
        /* already gone */
      }
    }
    this.producers = [];
    this.published = null;
    // The mesh goes too: a datagram channel to a game that is over carries nothing.
    this.mesh.closeAll();
    this.setPhase("idle");
  }

  // -------------------------------------------------------------------------
  // Guest side
  // -------------------------------------------------------------------------

  private onIncomingProducer = (data: { roomId?: string; producers?: ProducerInfo[] }) => {
    if (this.disposed || data?.roomId !== this.options.roomId) return;
    const producers = data.producers ?? [];
    if (producers.length === 0) return;

    void this.ensureReady()
      .then(() => this.consumeAll(producers))
      .catch(() => this.setPhase("failed"));
  };

  private async consumeAll(producers: ProducerInfo[]): Promise<void> {
    const transport = this.recvTransport;
    const device = this.device;
    if (!transport || !device || this.disposed) return;

    const tracks: MediaStreamTrack[] = [];

    for (const info of producers) {
      // Our own producer comes back on the broadcast we sent. Consuming it would loop
      // the host's picture into their own player.
      if (this.producers.some((producer) => producer.id === info.producerId)) continue;
      if (this.consumers.some((consumer) => consumer.producerId === info.producerId)) continue;

      try {
        const reply = await this.options.socket.emitWithAck(SFU.consume, {
          roomId: this.options.roomId,
          transportId: transport.id,
          producerId: info.producerId,
          rtpCapabilities: device.rtpCapabilities,
        });
        if (!reply?.consumerData) continue;

        const consumer = await transport.consume(reply.consumerData);
        await consumer.resume();
        this.consumers.push(consumer);
        tracks.push(consumer.track);
      } catch {
        // One producer failing is survivable — the rest still play, and a later
        // announcement retries the set. Losing the video producer leaves audio alone,
        // which renders as a black screen; that is visible without a toast.
      }
    }

    if (tracks.length === 0) return;

    await this.options.socket.emitWithAck(SFU.unpauseConsumers, {
      roomId: this.options.roomId,
      consumerIds: this.consumers.map((consumer) => consumer.id),
    });

    // One stream object whose identity does not change when audio follows video, so a
    // `<video>` bound to it is not re-attached mid-playback.
    this.remote ??= new MediaStream();
    for (const track of tracks) {
      if (!this.remote.getTracks().includes(track)) this.remote.addTrack(track);
    }
    this.options.onRemoteStream?.(this.remote);
    this.setPhase("live");
  }

  // -------------------------------------------------------------------------
  // Both
  // -------------------------------------------------------------------------

  /**
   * Start over.
   *
   * Two independent things can have failed, so both are retried: the SFU transports
   * carrying the picture, and the peer mesh carrying input. They fail separately — a
   * relay refusing UDP breaks one and not the other — and the mesh's own `reconnect`
   * is already a no-op when nothing there has given up.
   */
  reconnect(): void {
    if (this.disposed) return;
    this.mesh.reconnect();

    this.teardownSfu();
    this.ready = null;

    void this.ensureReady()
      .then(() => {
        if (this.published) return this.publish(this.published.stream, this.published.profile);
      })
      .catch(() => this.setPhase("failed"));
  }

  async stats(): Promise<MediaStats> {
    const source = this.producers.find((p) => p.kind === "video") ?? this.consumers[0];
    if (!source) return { ...EMPTY_STATS };
    try {
      return readLinkStats(await source.getStats());
    } catch {
      return { ...EMPTY_STATS };
    }
  }

  connect(userId: string, socketId: string): Promise<void> {
    return this.mesh.connect(userId, socketId);
  }

  disconnect(userId: string): void {
    this.mesh.disconnect(userId);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.options.socket.off(SFU.incomingProducer, this.onIncomingProducer);
    this.teardownSfu();
    this.mesh.dispose();
    this.handlers.clear();
    this.published = null;
  }

  private teardownSfu(): void {
    for (const consumer of this.consumers) {
      try {
        consumer.close();
      } catch {
        /* already gone */
      }
    }
    for (const producer of this.producers) {
      try {
        producer.close();
      } catch {
        /* already gone */
      }
    }
    this.consumers = [];
    this.producers = [];

    // Closing a transport closes everything it carried, so this is belt and braces —
    // but a half-closed transport is the one state that produces a silent black
    // rectangle, so it is worth being explicit about.
    try {
      this.sendTransport?.close();
    } catch {
      /* already gone */
    }
    try {
      this.recvTransport?.close();
    } catch {
      /* already gone */
    }
    this.sendTransport = null;
    this.recvTransport = null;
    this.device = null;
    this.remote = null;
  }

  private setPhase(phase: MediaPhase): void {
    if (this.phase === phase || this.disposed) return;
    this.phase = phase;
    this.options.onPhaseChange?.(phase);
  }
}
