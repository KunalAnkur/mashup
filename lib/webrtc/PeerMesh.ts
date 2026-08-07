/**
 * PeerMesh — the WebRTC plumbing shared by every peer-to-peer feature.
 *
 * Movmash has two P2P features that are entirely different products but almost identical
 * transports: the host streaming a video file to viewers, and members of a Couple room on a
 * video call. Both need connections per peer, offer/answer, ICE, renegotiation when the source
 * changes, and full re-establishment when a socket reconnects. Written twice, that logic
 * drifts, and only the path being actively tested stays correct — which is exactly how the
 * host-reconnect bug survived: the SFU stream path handled it, the P2P one never had.
 *
 * So this class owns the transport, and features supply only what actually differs:
 * which signalling events carry the SDP, who is allowed to make the first offer, which tracks
 * to publish, and what to do with the tracks that arrive.
 *
 * Deliberately framework-free. The negotiation state machine here is order-sensitive, and
 * expressing it through React effects is what made the existing P2P code so hard to reason
 * about — dependency arrays, stale closures and Strict Mode double-invocation all silently
 * change the order things happen in. A hook wires this up; it does not implement it.
 */

export type PeerDirection = "sendonly" | "recvonly" | "sendrecv";

export interface PeerSignaling {
  sendOffer(peerId: string, description: RTCSessionDescriptionInit): void;
  sendAnswer(peerId: string, description: RTCSessionDescriptionInit): void;
  sendIce(peerId: string, candidate: RTCIceCandidateInit): void;
}

export interface PeerMeshOptions {
  /**
   * Our own socket id. Not decoration: a reconnect mints a new one, and at that moment every
   * remote peer still holds a connection addressed to the old id. Changing this is the signal
   * to rebuild everything — see `setSelfId`.
   */
  selfId: string | null;
  iceServers: RTCIceServer[];
  /** Whether we publish tracks, receive them, or both. */
  direction: PeerDirection;
  /**
   * Whether we make the first offer to this peer.
   *
   * Streaming passes `() => isHost` — only the host ever offers, so glare cannot happen.
   * A mesh call passes a deterministic tiebreak (e.g. `selfId < peerId`) so exactly one side
   * of each pair opens the connection.
   */
  shouldInitiateTo(peerId: string): boolean;
  /**
   * Whether we are the "polite" peer with this peer, for glare resolution. Only consulted
   * when both sides can negotiate; must disagree between the two ends of a pair, so a
   * comparison of the two ids is the usual answer.
   */
  isPoliteWith?(peerId: string): boolean;
  /** Tracks to publish. Called on every connect and every renegotiation, never cached. */
  getLocalTracks(): MediaStreamTrack[] | null;
  /**
   * How SDP and ICE reach the other side. Injected rather than assumed so the mesh has no
   * knowledge of socket event names — that is the only thing separating a stream negotiation
   * from a call negotiation on the wire.
   */
  signaling: PeerSignaling;
  onRemoteStream?(peerId: string, stream: MediaStream): void;
  onPeerClosed?(peerId: string): void;
  onConnectionState?(peerId: string, state: RTCPeerConnectionState): void;
  /** Prefix for this mesh's logs, e.g. "[P2P:stream]". Keeps two meshes distinguishable. */
  logPrefix?: string;
}

interface PeerEntry {
  peerId: string;
  pc: RTCPeerConnection;
  /** Tracks received from this peer, accumulated as `ontrack` fires one kind at a time. */
  remoteStream: MediaStream;
  /**
   * Candidates that arrived before the remote description was set. Adding one then throws, so
   * they are held here and flushed once a remote description exists.
   */
  pendingCandidates: RTCIceCandidateInit[];
  /** Perfect-negotiation bookkeeping (see `handleOffer`). */
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingRemoteAnswerPending: boolean;
  polite: boolean;
  closed: boolean;
}

export class PeerMesh {
  private options: PeerMeshOptions;
  private peers: Map<string, PeerEntry> = new Map();
  /** The roster we were last told about, kept so `setSelfId` can rebuild against it. */
  private roster: Set<string> = new Set();
  private selfId: string | null;
  private disposed = false;

  constructor(options: PeerMeshOptions) {
    this.options = options;
    this.selfId = options.selfId;
  }

  // ── Configuration ──────────────────────────────────────────────────────────

  /**
   * Point the mesh at a new socket identity.
   *
   * A reconnect gives us a new socket id, which invalidates every existing connection at once:
   * the remote ends are still addressed to the id we no longer have, so nothing we send will
   * reach them and nothing they send will reach us. The only correct response is to tear the
   * mesh down and rebuild it, which is what this does.
   *
   * Idempotent for an unchanged id, so a re-render that passes the same value costs nothing.
   */
  public setSelfId(selfId: string | null): void {
    if (this.disposed || selfId === this.selfId) return;

    const previous = this.selfId;
    this.selfId = selfId;
    this.log(`self id changed ${previous ?? "none"} -> ${selfId ?? "none"}; rebuilding mesh`);

    this.closeAllPeers();
    if (selfId) this.reconcile();
  }

  /** Replace the ICE servers used for connections opened from now on. */
  public setIceServers(iceServers: RTCIceServer[]): void {
    if (this.disposed) return;
    this.options.iceServers = iceServers;
  }

  /**
   * Tell the mesh who else is present. Peers that disappeared are closed; peers that appeared
   * get a connection if we are the side that initiates. If we are not, we simply wait — their
   * offer will create the connection lazily in `handleOffer`.
   */
  public setPeers(peerIds: string[]): void {
    if (this.disposed) return;

    const next = new Set(peerIds.filter((id) => id && id !== this.selfId));

    for (const peerId of this.roster) {
      if (!next.has(peerId)) this.closePeer(peerId, "left the room");
    }

    this.roster = next;
    this.reconcile();
  }

  // ── Signalling input ───────────────────────────────────────────────────────

  /**
   * Apply a remote offer, using the perfect-negotiation pattern.
   *
   * With a mesh both sides can offer at the same moment ("glare"). Rather than trying to
   * prevent it, each pair agrees in advance who yields: the impolite peer ignores a colliding
   * offer and keeps its own, the polite peer drops its own and accepts. Only one side ever
   * backs down, so the pair always converges. Streaming never hits this (only the host offers)
   * but a call does constantly, and getting it wrong shows up as a connection that negotiates
   * forever without ever delivering media.
   */
  public async handleOffer(
    peerId: string,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (this.disposed || !peerId || peerId === this.selfId) return;

    const entry = this.peers.get(peerId) ?? this.createPeer(peerId);
    if (!entry || entry.closed) return;

    const { pc } = entry;

    const readyForOffer =
      !entry.makingOffer &&
      (pc.signalingState === "stable" || entry.settingRemoteAnswerPending);
    const collision = !readyForOffer;

    entry.ignoreOffer = !entry.polite && collision;
    if (entry.ignoreOffer) {
      this.log(`ignoring colliding offer from ${peerId} (we are impolite)`);
      return;
    }

    try {
      await pc.setRemoteDescription(description);
      await this.flushPendingCandidates(entry);

      // Implicit answer creation — the browser fills in the right SDP for current state.
      await pc.setLocalDescription();
      if (pc.localDescription) {
        this.options.signaling.sendAnswer(peerId, pc.localDescription.toJSON());
        this.log(`sent answer to ${peerId}`);
      }
    } catch (error) {
      this.warn(`failed to answer ${peerId}`, error);
    }
  }

  /** Apply a remote answer to an offer we made. */
  public async handleAnswer(
    peerId: string,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (this.disposed) return;

    const entry = this.peers.get(peerId);
    if (!entry || entry.closed) return;

    try {
      entry.settingRemoteAnswerPending = true;
      await entry.pc.setRemoteDescription(description);
      await this.flushPendingCandidates(entry);
    } catch (error) {
      this.warn(`failed to apply answer from ${peerId}`, error);
    } finally {
      entry.settingRemoteAnswerPending = false;
    }
  }

  /**
   * Add a remote ICE candidate.
   *
   * Candidates routinely arrive before the offer they belong to — the two travel over the same
   * socket but are produced independently, and trickle ICE starts the moment the remote sets
   * its local description. Adding one with no remote description throws, so they are queued
   * and flushed once a description exists.
   */
  public async handleIce(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (this.disposed || !candidate) return;

    const entry = this.peers.get(peerId);
    if (!entry || entry.closed) return;

    if (!entry.pc.remoteDescription) {
      entry.pendingCandidates.push(candidate);
      return;
    }

    try {
      await entry.pc.addIceCandidate(candidate);
    } catch (error) {
      // Expected when we deliberately ignored the offer these candidates belong to.
      if (!entry.ignoreOffer) this.warn(`failed to add ICE candidate from ${peerId}`, error);
    }
  }

  // ── Local media ────────────────────────────────────────────────────────────

  /**
   * Swap the outgoing tracks on every open connection — a new file selected, or screen share
   * replacing a file.
   *
   * `replaceTrack` is deliberate: it swaps the media on the existing sender without touching
   * the SDP, so there is no renegotiation and no interruption for the viewer. Only when a kind
   * has no sender yet (audio appearing on a previously video-only stream) do we add a track,
   * which does trigger renegotiation via `onnegotiationneeded`.
   */
  public async replaceLocalTracks(): Promise<void> {
    if (this.disposed) return;

    const tracks = this.options.getLocalTracks();
    if (!tracks?.length) {
      this.warn("replaceLocalTracks: no local tracks available");
      return;
    }

    for (const entry of this.peers.values()) {
      if (entry.closed) continue;

      for (const track of tracks) {
        // Prefer a transceiver already negotiated for this kind — including a receive-only one
        // opened while we had nothing to send. Reusing it turns the existing media section
        // two-way; calling addTrack instead would append a second section for the same kind
        // and leave the first permanently silent.
        const transceiver = entry.pc.getTransceivers().find((t) => {
          if (t.sender.track?.kind === track.kind) return true;
          return !t.sender.track && t.receiver.track?.kind === track.kind;
        });

        try {
          if (transceiver) {
            await transceiver.sender.replaceTrack(track);
            if (transceiver.direction === "recvonly") {
              transceiver.direction = "sendrecv";
            }
          } else {
            entry.pc.addTrack(track);
          }
        } catch (error) {
          this.warn(`failed to publish ${track.kind} to ${entry.peerId}`, error);
        }
      }
    }
  }

  // ── Introspection ──────────────────────────────────────────────────────────

  public getConnectionState(peerId: string): RTCPeerConnectionState | null {
    return this.peers.get(peerId)?.pc.connectionState ?? null;
  }

  public getPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  // ── Teardown ───────────────────────────────────────────────────────────────

  /** Close one peer's connection and forget it. */
  public closePeer(peerId: string, reason = "closed"): void {
    const entry = this.peers.get(peerId);
    if (!entry) return;

    entry.closed = true;
    try {
      entry.pc.close();
    } catch {
      // A connection can already be closed by the browser; nothing to do.
    }

    this.peers.delete(peerId);
    this.log(`closed connection with ${peerId} (${reason})`);
    this.options.onPeerClosed?.(peerId);
  }

  /** Close every connection but keep the mesh usable. */
  public closeAllPeers(): void {
    for (const peerId of Array.from(this.peers.keys())) {
      this.closePeer(peerId, "mesh reset");
    }
  }

  /** Permanent teardown. The mesh ignores everything after this. */
  public close(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.closeAllPeers();
    this.roster.clear();
    this.log("mesh closed");
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /** Open connections to any rostered peer we are responsible for initiating to. */
  private reconcile(): void {
    if (!this.selfId) return;

    for (const peerId of this.roster) {
      if (this.peers.has(peerId)) continue;
      if (!this.options.shouldInitiateTo(peerId)) continue;

      const entry = this.createPeer(peerId);
      if (entry) void this.negotiate(entry);
    }
  }

  private createPeer(peerId: string): PeerEntry | null {
    if (this.disposed) return null;

    const pc = new RTCPeerConnection({ iceServers: this.options.iceServers });
    const entry: PeerEntry = {
      peerId,
      pc,
      remoteStream: new MediaStream(),
      pendingCandidates: [],
      makingOffer: false,
      ignoreOffer: false,
      settingRemoteAnswerPending: false,
      polite: this.options.isPoliteWith?.(peerId) ?? false,
      closed: false,
    };
    this.peers.set(peerId, entry);
    this.log(`opened connection with ${peerId} (polite=${entry.polite})`);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.options.signaling.sendIce(peerId, event.candidate.toJSON());
      }
    };

    // Fires whenever the browser decides the SDP no longer matches the senders — on creation
    // once tracks are added, and again whenever a track is added or removed later. Letting the
    // browser tell us when to renegotiate is what makes mid-session source changes work.
    pc.onnegotiationneeded = () => {
      void this.negotiate(entry);
    };

    pc.onconnectionstatechange = () => {
      this.log(`connection with ${peerId}: ${pc.connectionState}`);
      this.options.onConnectionState?.(peerId, pc.connectionState);

      // An ICE restart re-gathers candidates on the existing connection, which recovers from a
      // network path dying without tearing down the media or re-running the whole handshake.
      // Only the initiating side may do it, or both would restart at once.
      if (pc.connectionState === "failed" && this.options.shouldInitiateTo(peerId)) {
        this.log(`restarting ICE with ${peerId}`);
        try {
          pc.restartIce();
        } catch (error) {
          this.warn(`ICE restart failed for ${peerId}`, error);
        }
      }
    };

    if (this.receives()) {
      pc.ontrack = (event) => {
        const { track } = event;
        this.log(`received ${track.kind} track from ${peerId}`);

        entry.remoteStream.addTrack(track);
        track.addEventListener("ended", () => {
          try {
            entry.remoteStream.removeTrack(track);
          } catch {
            // Track already detached; harmless.
          }
        });

        // Emitted per track rather than waiting for a complete set: audio and video arrive
        // separately, and a consumer that waits for both never renders an audio-only stream.
        this.options.onRemoteStream?.(peerId, entry.remoteStream);
      };
    }

    const tracks = this.sends() ? this.options.getLocalTracks() : null;

    if (tracks?.length) {
      for (const track of tracks) {
        try {
          pc.addTrack(track);
        } catch (error) {
          this.warn(`failed to add ${track.kind} track for ${peerId}`, error);
        }
      }
    } else if (this.receives()) {
      // Nothing to publish yet — a viewer watching a caller before starting their own camera.
      //
      // Without this the offer would carry no media sections at all, because an offer is built
      // from the transceivers that exist, and a connection with no tracks has none. The other
      // side would answer an empty offer and the negotiation would complete having agreed to
      // exchange nothing. Declaring recvonly transceivers gives the answerer somewhere to
      // attach its media, and `replaceLocalTracks` later upgrades these same transceivers to
      // sendrecv when this peer does start publishing.
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
        this.log(`no local tracks for ${peerId}; opened receive-only`);
      } catch (error) {
        this.warn(`failed to add receive-only transceivers for ${peerId}`, error);
      }
    }

    return entry;
  }

  /**
   * Produce and send an offer. Guarded by `makingOffer` so a collision is detectable in
   * `handleOffer`, and driven by implicit `setLocalDescription()` so the browser derives the
   * correct SDP for the connection's current state.
   */
  private async negotiate(entry: PeerEntry): Promise<void> {
    if (this.disposed || entry.closed) return;

    try {
      entry.makingOffer = true;
      await entry.pc.setLocalDescription();
      if (entry.pc.localDescription) {
        this.options.signaling.sendOffer(entry.peerId, entry.pc.localDescription.toJSON());
        this.log(`sent offer to ${entry.peerId}`);
      }
    } catch (error) {
      this.warn(`failed to create offer for ${entry.peerId}`, error);
    } finally {
      entry.makingOffer = false;
    }
  }

  private async flushPendingCandidates(entry: PeerEntry): Promise<void> {
    if (!entry.pendingCandidates.length) return;

    const queued = entry.pendingCandidates;
    entry.pendingCandidates = [];

    for (const candidate of queued) {
      try {
        await entry.pc.addIceCandidate(candidate);
      } catch (error) {
        this.warn(`failed to add queued ICE candidate from ${entry.peerId}`, error);
      }
    }
  }

  private sends(): boolean {
    return this.options.direction !== "recvonly";
  }

  private receives(): boolean {
    return this.options.direction !== "sendonly";
  }

  private log(message: string): void {
    console.log(`${this.options.logPrefix ?? "[PeerMesh]"} ${message}`);
  }

  private warn(message: string, error?: unknown): void {
    console.warn(`${this.options.logPrefix ?? "[PeerMesh]"} ${message}`, error ?? "");
  }
}
