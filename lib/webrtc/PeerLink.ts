/**
 * One peer connection: media out, datagrams both ways, and recovery when it drops.
 *
 * Written beside `useP2PStream` rather than inside it. That hook is 745 lines welded to
 * playlist state, `STREAM_PAUSED`/`STREAM_RESUMED` and host playback — it is the
 * movie-night path, it works, and breaking it to share code would be the wrong trade.
 * This is the clean primitive; if the hook is ever refactored onto it, that is a
 * separate change with its own testing.
 *
 * Two things it does that the existing path does not:
 *
 *  - **It recovers.** `useP2PStream` logs `connectionState === "failed"` and leaves the
 *    connection dead. Here a drop is given a grace period, then an ICE restart, then a
 *    full rebuild, with backoff between.
 *  - **It carries a data channel**, created before the offer so it rides the same
 *    negotiation as the tracks and needs no renegotiation later.
 *
 * Addressed by `userId`, never `socketId`: a socket id changes on every reconnect and a
 * user id does not, so a peer who drops and returns is the same peer with a new address.
 */

import {
  hintGameVideo,
  minimiseReceiverDelay,
  preferGameCodecs,
  tuneGameVideoSender,
  tuneOpusForMusic,
  type VideoEncodeProfile,
} from "./encoder";

export type PeerLinkPhase = "new" | "connecting" | "live" | "reconnecting" | "failed";

/** How this link reaches the other side. The caller owns the socket; this owns nothing. */
export interface PeerSignaller {
  sendOffer(toSocketId: string, offer: RTCSessionDescriptionInit): void;
  sendAnswer(toSocketId: string, answer: RTCSessionDescriptionInit): void;
  sendCandidate(toSocketId: string, candidate: RTCIceCandidateInit): void;
}

export interface PeerLinkOptions {
  /** Stable identity. Survives reconnects; what callers key their maps on. */
  userId: string;
  /** Current address. Changes on reconnect — update it with {@link setSocketId}. */
  socketId: string;
  iceServers: RTCIceServer[];
  signaller: PeerSignaller;
  /** True for the side that creates the offer and the data channel. */
  polite?: boolean;

  onPhase?: (phase: PeerLinkPhase) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onData?: (bytes: Uint8Array) => void;
}

/** Most blips heal themselves well inside this; restarting sooner makes things worse. */
const GRACE_MS = 3_000;
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000];
const MAX_REBUILDS = 3;

export class PeerLink {
  readonly userId: string;

  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private remote: MediaStream | null = null;

  private socketId: string;
  private readonly options: PeerLinkOptions;

  private phase: PeerLinkPhase = "new";
  private makingOffer = false;
  private closed = false;

  /** Candidates that arrived before the remote description did. */
  private pendingCandidates: RTCIceCandidateInit[] = [];

  /**
   * Signalling runs one operation at a time, in arrival order.
   *
   * Every negotiation step is several `await`s long, and socket events land in the gaps
   * between them. Without this, two offers arriving close together interleave: the
   * second completes the negotiation and leaves the connection `stable`, then the first
   * resumes into `createAnswer` and throws `InvalidStateError` — "cannot create an
   * answer in a state other than have-remote-offer".
   *
   * That is not an edge case here. The host offers once to open the connection and
   * again the moment it publishes the capture stream, so two offers in quick succession
   * is the ordinary path.
   */
  private chain: Promise<void> = Promise.resolve();

  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private restartAttempt = 0;
  private rebuilds = 0;

  /** Held so a rebuild can put the same media back without the caller re-publishing. */
  private localStream: MediaStream | null = null;
  private videoProfile: VideoEncodeProfile | null = null;

  constructor(options: PeerLinkOptions) {
    this.options = options;
    this.userId = options.userId;
    this.socketId = options.socketId;
    this.create();
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  private create(): void {
    const pc = new RTCPeerConnection({
      iceServers: this.options.iceServers,
      // Puts media and the data channel on ONE ICE/DTLS transport, so they share fate.
      // That is what makes a socket fallback for input unnecessary in a P2P room: if the
      // channel is down there is no video either, and there would be nothing to control.
      bundlePolicy: "max-bundle",
    });
    this.pc = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.options.signaller.sendCandidate(this.socketId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      minimiseReceiverDelay(event.receiver);

      // Tracks arrive one at a time; collect them into a single stream so the consumer
      // gets one object whose identity does not change when audio follows video.
      if (!this.remote) this.remote = new MediaStream();
      if (!this.remote.getTracks().includes(event.track)) {
        this.remote.addTrack(event.track);
      }
      this.options.onRemoteStream?.(this.remote);
    };

    pc.ondatachannel = (event) => this.adoptChannel(event.channel);

    pc.onconnectionstatechange = () => this.onConnectionState(pc.connectionState);

    if (this.options.polite) {
      // Created before the offer, deliberately: it then rides the initial negotiation
      // and needs no renegotiation — and there is no `onnegotiationneeded` handling
      // anywhere in this codebase to lean on if it did.
      this.adoptChannel(
        pc.createDataChannel("activity-data", { ordered: false, maxRetransmits: 0 }),
      );
    }

    // Deferred by a microtask, deliberately.
    //
    // On the first `create()` the caller is still inside our constructor and has not
    // been handed the object yet, so it cannot have put us in whatever map it keys
    // peers by. A synchronous report would make it recompute its own phase from a set
    // that does not include us — which came out as `idle` for a port that had just
    // started connecting, and then stayed wrong until the connection either succeeded
    // or failed outright.
    this.phase = "connecting";
    queueMicrotask(() => {
      if (this.closed || this.phase !== "connecting") return;
      this.options.onPhase?.("connecting");
    });
  }

  private adoptChannel(channel: RTCDataChannel): void {
    channel.binaryType = "arraybuffer";
    channel.onmessage = (event) => {
      const data = event.data;
      if (data instanceof ArrayBuffer) this.options.onData?.(new Uint8Array(data));
    };
    this.channel = channel;
  }

  private setPhase(phase: PeerLinkPhase): void {
    if (this.phase === phase || this.closed) return;
    this.phase = phase;
    this.options.onPhase?.(phase);
  }

  // -------------------------------------------------------------------------
  // Recovery
  // -------------------------------------------------------------------------

  private onConnectionState(state: RTCPeerConnectionState): void {
    if (this.closed) return;

    if (state === "connected") {
      this.clearGrace();
      this.restartAttempt = 0;
      this.rebuilds = 0;
      this.setPhase("live");
      return;
    }

    if (state === "disconnected" || state === "failed") {
      this.setPhase("reconnecting");
      // Most of these heal on their own — a NAT rebind, a moment of wifi. Restarting
      // immediately would tear down a connection that was about to come back.
      if (!this.graceTimer) {
        this.graceTimer = setTimeout(() => {
          this.graceTimer = null;
          void this.recover();
        }, GRACE_MS);
      }
    }
  }

  private clearGrace(): void {
    if (this.graceTimer) clearTimeout(this.graceTimer);
    this.graceTimer = null;
  }

  private async recover(): Promise<void> {
    if (this.closed || !this.pc) return;
    if (this.pc.connectionState === "connected") return;

    if (this.restartAttempt < BACKOFF_MS.length) {
      const wait = BACKOFF_MS[this.restartAttempt] ?? 8_000;
      this.restartAttempt += 1;
      await this.enqueue(() => this.renegotiate({ iceRestart: true }));
      setTimeout(() => void this.recover(), wait);
      return;
    }

    // ICE restarts are exhausted; the transport itself is the problem.
    if (this.rebuilds < MAX_REBUILDS) {
      this.rebuilds += 1;
      this.restartAttempt = 0;
      this.teardown();
      this.create();
      await this.republish();
      await this.enqueue(() => this.renegotiate({}));
      return;
    }

    this.setPhase("failed");
  }

  // -------------------------------------------------------------------------
  // Negotiation
  // -------------------------------------------------------------------------

  /**
   * Offer, from whichever side calls it.
   *
   * There is no glare handling here and it is not an oversight: in a game room exactly
   * one side ever has media to send, so only one side ever renegotiates. The initial
   * offer is settled separately, by comparing user ids, which is symmetric and needs no
   * round trip. If a future game ever publishes from both ends, this is where perfect
   * negotiation would have to go — and an `onnegotiationneeded` handler with it.
   */
  /**
   * Run one signalling step, after everything queued before it.
   *
   * A rejection is contained rather than propagated: one failed negotiation must not
   * poison the chain and silence every step after it. The individual steps decide for
   * themselves whether a failure is fatal.
   */
  private enqueue(step: () => Promise<void>): Promise<void> {
    const next = this.chain.then(
      () => (this.closed ? undefined : step()),
      () => (this.closed ? undefined : step()),
    );
    this.chain = next.catch(() => {});
    return this.chain;
  }

  private async renegotiate(options: RTCOfferOptions): Promise<void> {
    if (!this.pc || this.closed || this.makingOffer) return;

    // `have-remote-offer` is the one state where we owe an *answer*, not an offer.
    // Callers queue, so this is a backstop rather than the mechanism — and skipping is
    // safe here only because a queued offer runs after the answer that precedes it,
    // by which point the connection is stable again.
    if (this.pc.signalingState === "have-remote-offer") return;

    try {
      this.makingOffer = true;
      const offer = await this.pc.createOffer(options);
      offer.sdp = offer.sdp ? tuneOpusForMusic(offer.sdp) : offer.sdp;
      await this.pc.setLocalDescription(offer);
      this.options.signaller.sendOffer(this.socketId, offer);
    } catch {
      this.setPhase("failed");
    } finally {
      this.makingOffer = false;
    }
  }

  /** Start the conversation. Only the offering side calls this. */
  open(): Promise<void> {
    return this.enqueue(() => this.renegotiate({}));
  }

  acceptOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    return this.enqueue(async () => {
      if (!this.pc || this.closed) return;

      await this.pc.setRemoteDescription(offer);

      // Answered immediately, with nothing awaited in between. Flushing candidates
      // here — as this once did — put several yields between the remote description
      // and the answer, which is the window the whole `chain` above exists to close.
      // Queued candidates are applied below instead, where a yield costs nothing.
      if (this.pc.signalingState !== "have-remote-offer") return;

      const answer = await this.pc.createAnswer();
      answer.sdp = answer.sdp ? tuneOpusForMusic(answer.sdp) : answer.sdp;
      await this.pc.setLocalDescription(answer);
      this.options.signaller.sendAnswer(this.socketId, answer);

      await this.flushCandidates();

      // An answer can only describe m-lines the *offer* already had. Anything we added
      // before this peer offered is therefore still unnegotiated, and will stay that
      // way forever unless we offer it ourselves.
      if (this.hasUnsentTracks()) await this.renegotiate({});
    });
  }

  /**
   * Do we hold a track the far side has never been told about?
   *
   * A transceiver with no `mid` has not appeared in a negotiated description. This is
   * the one signal that distinguishes "we published and it went out" from "we
   * published into a connection that only ever answered".
   *
   * It exists because of a real black screen: a spectator who joined *after* the host
   * had already published got a connection that reached `live` and carried no video.
   * `connect()` publishes into the new link immediately, and a fresh link has no local
   * description, so `publish` correctly declines to renegotiate — it expects `open()`
   * to carry the tracks. But `open()` only runs on the offering side, which is decided
   * by comparing user ids. When it fell the other way the host answered instead, the
   * tracks never entered a description, and nothing ever asked again. There is no
   * `onnegotiationneeded` handler anywhere in this class to catch it.
   *
   * Checked after answering rather than on a handler so it is symmetric: only the side
   * actually holding unsent tracks offers, and only once the negotiation that prompted
   * it has completed, so it cannot cause glare.
   */
  private hasUnsentTracks(): boolean {
    if (!this.pc) return false;
    return this.pc
      .getTransceivers()
      .some((transceiver) => transceiver.mid === null && transceiver.sender.track !== null);
  }

  acceptAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    return this.enqueue(async () => {
      if (!this.pc || this.closed) return;
      // An answer for a negotiation we have already moved past is stale, not an error.
      if (this.pc.signalingState !== "have-local-offer") return;
      await this.pc.setRemoteDescription(answer);
      await this.flushCandidates();
    });
  }

  addCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    return this.enqueue(async () => {
      if (!this.pc || this.closed) return;
      // Candidates routinely arrive before the description they belong to.
      if (!this.pc.remoteDescription) {
        this.pendingCandidates.push(candidate);
        return;
      }
      try {
        await this.pc.addIceCandidate(candidate);
      } catch {
        // A candidate for a restarted ICE generation is expected to fail.
      }
    });
  }

  /**
   * Apply the candidates that arrived before a remote description existed.
   *
   * Talks to the connection directly rather than through {@link addCandidate}, which
   * now enqueues — and this already runs *inside* a queued step, so going back through
   * the queue would wait on a chain that cannot advance until this returns.
   */
  private async flushCandidates(): Promise<void> {
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];

    for (const candidate of queued) {
      if (!this.pc || this.closed) return;
      try {
        await this.pc.addIceCandidate(candidate);
      } catch {
        // A candidate for a restarted ICE generation is expected to fail.
      }
    }
  }

  // -------------------------------------------------------------------------
  // Media and data
  // -------------------------------------------------------------------------

  /**
   * Send this stream, renegotiating if the connection is already up.
   *
   * The renegotiation is not an edge case — it is the normal path. Peers find each
   * other as soon as they are both in the room, but a game publishes later, when it
   * decides there is something worth sending. So the first negotiation almost always
   * completes with no tracks in it, and `addTrack` after that changes nothing on the
   * wire until somebody offers again. Without this the guest connects successfully,
   * reports `live`, and stares at a black rectangle.
   *
   * Idempotent per track, so republishing the same stream — which reconnection and a
   * late audio track both do — adds nothing and offers nothing.
   */
  async publish(stream: MediaStream, profile: VideoEncodeProfile): Promise<void> {
    if (!this.pc || this.closed) return;

    this.localStream = stream;
    this.videoProfile = profile;

    const existing = new Set(this.pc.getSenders().map((sender) => sender.track));
    let added = false;

    for (const track of stream.getTracks()) {
      if (existing.has(track)) continue;
      added = true;

      if (track.kind === "video") hintGameVideo(track);
      const sender = this.pc.addTrack(track, stream);

      if (track.kind === "video") {
        const transceiver = this.pc
          .getTransceivers()
          .find((candidate) => candidate.sender === sender);
        if (transceiver) preferGameCodecs(transceiver);
        await tuneGameVideoSender(sender, profile);
      }
    }

    // A connection that has never negotiated is about to, via `open()` — offering here
    // as well would be glare with ourselves. Anything else needs to be told.
    //
    // Queued rather than immediate: if an offer from the other side is being answered
    // right now, this has to wait for that to finish. Offering into `have-remote-offer`
    // would be dropped, and the track just added would never reach the far end.
    if (added && this.pc.localDescription) await this.enqueue(() => this.renegotiate({}));
  }

  /** Put the media back after a rebuild, without the caller having to notice. */
  private async republish(): Promise<void> {
    if (!this.localStream || !this.videoProfile) return;
    await this.publish(this.localStream, this.videoProfile);
  }

  async updateVideoProfile(profile: VideoEncodeProfile): Promise<void> {
    this.videoProfile = profile;
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await tuneGameVideoSender(sender, profile);
  }

  send(bytes: Uint8Array): void {
    if (this.channel?.readyState !== "open") return;
    // A copy, because the caller may reuse its buffer on the next frame.
    this.channel.send(bytes.slice().buffer as ArrayBuffer);
  }

  /** The peer moved to a new socket. Same person, new address. */
  setSocketId(socketId: string): void {
    this.socketId = socketId;
  }

  getPhase(): PeerLinkPhase {
    return this.phase;
  }

  getRemoteStream(): MediaStream | null {
    return this.remote;
  }

  async getStats(): Promise<RTCStatsReport | null> {
    return this.pc ? this.pc.getStats() : null;
  }

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------

  private teardown(): void {
    this.channel?.close();
    this.channel = null;
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.ondatachannel = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
    }
    this.pc = null;
    this.remote = null;
    this.pendingCandidates = [];
    // Anything still queued belongs to the connection that just went away.
    this.chain = Promise.resolve();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearGrace();
    this.teardown();
    this.phase = "failed";
  }
}
