/**
 * Who is in this room, how to reach them, and a datagram pipe to each.
 *
 * Extracted from `P2PMediaPort` when the Crowd path arrived, because both delivery
 * modes need exactly this and neither needs a second copy of it. The two ports differ
 * in how a *picture* travels — peer-to-peer, or fanned out by an SFU — and not at all
 * in how they find each other or how controller input gets back to the host.
 *
 * **Input stays peer-to-peer in both modes**, which is the whole reason this is shared.
 * Routing a keypress through the SFU would add a server hop to the most
 * latency-sensitive path in the product to save a connection that is already open.
 *
 * Everything here was built and tested during Phases 3 and 4 — the two-step announce,
 * the `restart` flag, the re-addressing on reconnect. It is moved rather than rewritten.
 */

import type { Socket } from "socket.io-client";
import type { MediaPhase } from "@movmash/arcade-client";

import { PeerLink, type PeerLinkPhase } from "@/lib/webrtc/PeerLink";
import type { VideoEncodeProfile } from "@/lib/webrtc/encoder";

/** Tags our traffic on the shared relays. Anything else on them is not ours. */
export const ACTIVITY_MEDIA = "activity-media";

/** Socket event names, matching `communication/src/types/socket.type.ts`. */
export const P2P = {
  offer: "p2pOffer",
  answer: "p2pAnswer",
  candidate: "p2pIceCandidate",
  announce: "p2pAnnounce",
  announced: "p2pPeerAnnounced",
} as const;

export interface SignalPayload {
  fromPeerId: string;
  purpose?: string;
  /** True when this announcement is itself an answer — see {@link ActivityPeerMesh.announce}. */
  reply?: boolean;
  /** The sender discarded its connection to us and we must discard ours. */
  restart?: boolean;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  userId?: string;
}

/** The server's reply to our announce. */
interface AnnounceAck {
  success?: boolean;
  iceServers?: RTCIceServer[];
}

export interface ActivityPeerMeshOptions {
  socket: Socket;
  roomId: string;
  /**
   * A starting set, used only until the server answers our announce with its own.
   * Those carry TURN credentials minted now rather than at room-join, which matters
   * for a session that outlives their one-hour expiry.
   */
  iceServers: RTCIceServer[];
  /** Who we are. Used to decide which side offers, so both never do. */
  selfUserId: string;
  onPhaseChange?: (phase: MediaPhase) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onData?: (userId: string, bytes: Uint8Array) => void;
  /**
   * What to publish to a link the moment it is created.
   *
   * Null in SFU mode, where these connections carry nothing but datagrams — the
   * picture goes through MediaSoup and a peer connection that also carried it would be
   * sending the same frames twice.
   */
  localMedia?: () => { stream: MediaStream; profile: VideoEncodeProfile } | null;
}

export class ActivityPeerMesh {
  phase: MediaPhase = "idle";
  /** The newest remote stream seen on any link. Always null when `localMedia` is absent. */
  remote: MediaStream | null = null;

  private links = new Map<string, PeerLink>();
  /** socketId -> userId, so an inbound signal can be attributed to a stable identity. */
  private bySocket = new Map<string, string>();

  private readonly options: ActivityPeerMeshOptions;
  private disposed = false;

  /** Replaced by whatever the server hands back when we announce. */
  private iceServers: RTCIceServer[];

  constructor(options: ActivityPeerMeshOptions) {
    this.options = options;
    this.iceServers = options.iceServers;
    this.attachSignalling();

    // `restart: true` on the very first announce, deliberately.
    //
    // A port that has just been constructed holds no links at all, so anyone out there
    // holding a link to *us* is holding a dead one — our peer connections went with the
    // page. Saying so is correct in every case this runs: a first join (nobody has
    // anything to discard, so it costs nothing), a refresh, or a remount.
    //
    // Without it a refresh was a 10-20 second stare at "connecting". The peer's
    // `connect()` found its existing link, re-addressed it to our new socket, and
    // returned — but that link's `RTCPeerConnection` belonged to the browser we had
    // just thrown away. Nothing happened until ICE gave up on it: roughly ten seconds
    // to reach `disconnected`, then the grace period, then a restart.
    //
    // Note the contrast with {@link onSocketConnect}, which announces *without* it: a
    // dropped socket does not destroy a peer connection, so there the right move is to
    // re-address rather than rebuild.
    this.announce(false, true);
  }

  // -------------------------------------------------------------------------
  // Discovery
  // -------------------------------------------------------------------------

  /**
   * Say who and where we are, and find out the same about everyone else.
   *
   * The room may already be assembled when we arrive, or we may be the first one in;
   * there is no server-side list of announced peers to consult either way. So this is a
   * two-step exchange rather than a lookup: we announce, everyone already here announces
   * back, and after one round trip everybody has everybody's socket id.
   *
   * @param reply True when this *is* the answer to somebody else's announce. A reply
   *   draws no further reply, which is the whole reason the exchange terminates — and
   *   why it is a flag on the message rather than a condition on what we already knew.
   *   A client that has given up and is starting over is still perfectly familiar to
   *   the peer it is trying to reach, so "only answer strangers" would leave it
   *   shouting into a room that saw no reason to respond.
   * @param restart True when we have thrown our connection to them away and they must
   *   do the same. Without it a failure that was only visible on one side leaves the
   *   two disagreeing about whether there is a connection — and since which side
   *   offers is decided by comparing user ids, a peer that kept its link sees no reason
   *   to offer and the rebuilt one may not be the side that is allowed to. Both ends
   *   starting from nothing is what makes that comparison mean the same thing again.
   */
  private announce(reply = false, restart = false): void {
    if (this.disposed) return;
    this.options.socket.emit(
      P2P.announce,
      { roomId: this.options.roomId, purpose: ACTIVITY_MEDIA, reply, restart },
      (ack: AnnounceAck | undefined) => {
        if (this.disposed) return;
        if (ack?.iceServers?.length) this.iceServers = ack.iceServers;
      },
    );
  }

  /**
   * Open a link to a peer, or re-address an existing one.
   *
   * Re-addressing rather than replacing is the whole reason peers are keyed by
   * `userId`: a guest who drops and comes back on a new socket is the same player in
   * the same slot, and tearing down a working connection to rebuild it would be both
   * slower and more fragile than telling the existing one where they moved to.
   */
  async connect(userId: string, socketId: string): Promise<void> {
    if (this.disposed) return;

    const existing = this.links.get(userId);
    if (existing) {
      this.bySocket.set(socketId, userId);
      existing.setSocketId(socketId);
      return;
    }

    // Exactly one side offers. Comparing ids gives both sides the same answer without
    // another round trip, and without either needing to know who is "the host".
    const weOffer = this.options.selfUserId < userId;

    const link = new PeerLink({
      userId,
      socketId,
      iceServers: this.iceServers,
      polite: weOffer,
      signaller: {
        sendOffer: (to, offer) => this.emit(P2P.offer, to, { offer }),
        sendAnswer: (to, answer) => this.emit(P2P.answer, to, { answer }),
        sendCandidate: (to, candidate) => this.emit(P2P.candidate, to, { candidate }),
      },
      onPhase: () => this.onLinkPhase(),
      onRemoteStream: (stream) => {
        this.remote = stream;
        this.options.onRemoteStream?.(stream);
      },
      onData: (bytes) => this.options.onData?.(userId, bytes),
    });

    this.links.set(userId, link);
    this.bySocket.set(socketId, userId);
    // Now that it is in the map, our own phase can be recomputed to include it.
    this.onLinkPhase();

    const media = this.options.localMedia?.() ?? null;
    if (media) await link.publish(media.stream, media.profile);
    if (weOffer) await link.open();
  }

  /**
   * Start over with anyone we have given up on.
   *
   * `PeerLink.close()` is final — a closed `RTCPeerConnection` cannot be revived — so
   * recovering means discarding the dead links and letting discovery build new ones.
   * Announcing is what does that: the peer hears it, does not know us any more, and
   * announces back, which is the same path a first join takes.
   *
   * Only the failed ones. A link that is still trying is better left alone; tearing it
   * down to start again would throw away a negotiation that was about to succeed.
   */
  reconnect(): void {
    if (this.disposed) return;

    const dead = [...this.links].filter(([, link]) => link.getPhase() === "failed");

    // Nothing has given up, so there is nothing to restart — and doing it anyway would
    // be actively harmful: the announce carries `restart`, which tells the far side to
    // throw its connection away. A player pressing the button once more after recovery
    // had already worked would break the thing they were trying to fix.
    //
    // A port with no links at all is the exception: that is somebody who arrived before
    // anyone else and has nobody to talk to, and announcing again is exactly right.
    if (dead.length === 0 && this.links.size > 0) return;

    for (const [userId] of dead) this.discard(userId);

    this.setPhase(this.links.size > 0 ? "reconnecting" : "connecting");
    this.announce(false, true);
  }

  /** Drop a peer entirely, without the "they left" bookkeeping {@link disconnect} does. */
  private discard(userId: string): void {
    this.links.get(userId)?.close();
    this.links.delete(userId);
    for (const [socketId, owner] of this.bySocket) {
      if (owner === userId) this.bySocket.delete(socketId);
    }
  }

  /**
   * A reconnected socket is a new address for the same person.
   *
   * Our peers are still holding the old one and would signal into a void. Announcing
   * again re-addresses us on their side — `connect` re-points an existing link rather
   * than replacing it, so a connection that survived the blip is kept.
   *
   * Deliberately *without* `restart`. A socket dropping says nothing about the peer
   * connection, which rides its own transport and usually sails straight through;
   * tearing it down here would turn a blip nobody noticed into a visible reconnection.
   */
  private onSocketConnect = () => this.announce();

  /** They are gone for good. A momentary disconnect should use {@link connect} instead. */
  disconnect(userId: string): void {
    this.discard(userId);
    if (this.links.size === 0) {
      this.remote = null;
      this.options.onRemoteStream?.(null);
      this.setPhase("idle");
    }
  }

  // -------------------------------------------------------------------------
  // Media and data
  // -------------------------------------------------------------------------

  /** Push a stream onto every existing link. A no-op in SFU mode, which publishes none. */
  async publishToAll(stream: MediaStream, profile: VideoEncodeProfile): Promise<void> {
    for (const link of this.links.values()) await link.publish(stream, profile);
  }

  async updateProfileOnAll(profile: VideoEncodeProfile): Promise<void> {
    for (const link of this.links.values()) await link.updateVideoProfile(profile);
  }

  send(userId: string, bytes: Uint8Array): void {
    this.links.get(userId)?.send(bytes);
  }

  broadcast(bytes: Uint8Array): void {
    for (const link of this.links.values()) link.send(bytes);
  }

  /**
   * Can we actually deliver a datagram?
   *
   * At least one link open, which is what `live` means here. A game asks this before
   * deciding it needs a slower route to the host.
   */
  get dataReady(): boolean {
    return this.phase === "live";
  }

  /** The first live connection's report, for the stats a port surfaces. */
  firstLink(): PeerLink | undefined {
    return [...this.links.values()][0];
  }

  closeAll(): void {
    for (const link of this.links.values()) link.close();
    this.links.clear();
    this.bySocket.clear();
    this.setPhase("idle");
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.detachSignalling();
    this.closeAll();
  }

  // -------------------------------------------------------------------------
  // Signalling
  // -------------------------------------------------------------------------

  private onOffer = (payload: SignalPayload) => void this.handleSignal(payload, "offer");
  private onAnswer = (payload: SignalPayload) => void this.handleSignal(payload, "answer");
  private onCandidate = (payload: SignalPayload) => void this.handleSignal(payload, "candidate");

  /**
   * Somebody told the room who they are.
   *
   * `userId` here came from the server's own authentication, not from the peer, so it
   * is safe to seat them on. `fromPeerId` is their socket — which is exactly the pair
   * nothing else in the signalling path carries.
   */
  private onAnnounced = (payload: SignalPayload) => {
    if (payload?.purpose !== ACTIVITY_MEDIA || this.disposed) return;

    const { userId, fromPeerId } = payload;
    if (!userId || !fromPeerId || userId === this.options.selfUserId) return;

    // They gave up on us and started over. Whatever we are holding for them points at
    // a connection that no longer exists on the other end.
    if (payload.restart === true) this.discard(userId);

    void this.connect(userId, fromPeerId);

    // An introduction deserves one back; an answer to ours does not, or the two of us
    // would announce at each other forever.
    if (payload.reply !== true) this.announce(true);
  };

  private attachSignalling(): void {
    this.options.socket.on(P2P.offer, this.onOffer);
    this.options.socket.on(P2P.answer, this.onAnswer);
    this.options.socket.on(P2P.candidate, this.onCandidate);
    this.options.socket.on(P2P.announced, this.onAnnounced);
    this.options.socket.on("connect", this.onSocketConnect);
  }

  private detachSignalling(): void {
    this.options.socket.off(P2P.offer, this.onOffer);
    this.options.socket.off(P2P.answer, this.onAnswer);
    this.options.socket.off(P2P.candidate, this.onCandidate);
    this.options.socket.off(P2P.announced, this.onAnnounced);
    this.options.socket.off("connect", this.onSocketConnect);
  }

  private async handleSignal(
    payload: SignalPayload,
    kind: "offer" | "answer" | "candidate",
  ): Promise<void> {
    // Not ours. The same relays carry movie-night streaming, which sends no `purpose`.
    if (payload?.purpose !== ACTIVITY_MEDIA) return;
    if (this.disposed) return;

    const socketId = payload.fromPeerId;
    // An offer may be the first we hear of a peer, and it carries the sender's identity
    // because we have no other way to map a fresh socket to a player.
    const userId = this.bySocket.get(socketId) ?? payload.userId;
    if (!userId) return;

    if (!this.links.has(userId)) await this.connect(userId, socketId);
    const link = this.links.get(userId);
    if (!link) return;

    link.setSocketId(socketId);
    this.bySocket.set(socketId, userId);

    if (kind === "offer" && payload.offer) await link.acceptOffer(payload.offer);
    if (kind === "answer" && payload.answer) await link.acceptAnswer(payload.answer);
    if (kind === "candidate" && payload.candidate) await link.addCandidate(payload.candidate);
  }

  private emit(event: string, targetPeerId: string, body: Record<string, unknown>): void {
    this.options.socket.emit(event, {
      roomId: this.options.roomId,
      targetPeerId,
      purpose: ACTIVITY_MEDIA,
      userId: this.options.selfUserId,
      ...body,
    });
  }

  // -------------------------------------------------------------------------

  private onLinkPhase(): void {
    // The mesh's phase is the best of its links: one peer reconnecting while another is
    // live should not report the whole capability as broken.
    const phases: PeerLinkPhase[] = [...this.links.values()].map((link) => link.getPhase());
    if (phases.includes("live")) return this.setPhase("live");
    if (phases.includes("connecting")) return this.setPhase("connecting");
    if (phases.includes("reconnecting")) return this.setPhase("reconnecting");
    if (phases.length > 0 && phases.every((p) => p === "failed")) return this.setPhase("failed");
    this.setPhase("idle");
  }

  private setPhase(phase: MediaPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.options.onPhaseChange?.(phase);
  }
}
