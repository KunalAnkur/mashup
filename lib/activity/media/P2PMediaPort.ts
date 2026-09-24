/**
 * The media capability, over direct peer connections.
 *
 * This is the Couple path. A Crowd room gets `SfuMediaPort` instead, over MediaSoup,
 * and a room is on one or the other for its whole life — the mode is fixed from the
 * host's tier when they join and never flips. So this is not one half of a migration:
 * both implementations are permanent, and the reason the game talks to an interface is
 * that it must not be able to tell which one it got.
 *
 * Almost nothing is left here. Discovery, the links themselves, the datagram pipe and
 * the recovery logic all live in `ActivityPeerMesh`, because the SFU path needs every
 * one of them unchanged — what differs between the two modes is only how a *picture*
 * travels. This file is the part that is genuinely peer-to-peer: putting the host's
 * stream on the same connections that already carry input.
 */

import type { Socket } from "socket.io-client";
import type {
  DataPort,
  MediaPhase,
  MediaPort,
  MediaProfile,
  MediaStats,
} from "@movmash/arcade-client";

import { ActivityPeerMesh } from "./ActivityPeerMesh";
import { readLinkStats, toEncodeProfile } from "./stats";

export { ACTIVITY_MEDIA } from "./ActivityPeerMesh";

export interface P2PMediaPortOptions {
  socket: Socket;
  roomId: string;
  iceServers: RTCIceServer[];
  /** Who we are. Used to decide which side offers, so both never do. */
  selfUserId: string;
  onPhaseChange?: (phase: MediaPhase) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
}

export class P2PMediaPort implements MediaPort {
  remote: MediaStream | null = null;
  phase: MediaPhase = "idle";

  private readonly mesh: ActivityPeerMesh;
  private handlers = new Set<(userId: string, bytes: Uint8Array) => void>();
  private published: { stream: MediaStream; profile: MediaProfile } | null = null;
  private disposed = false;

  constructor(options: P2PMediaPortOptions) {
    this.mesh = new ActivityPeerMesh({
      socket: options.socket,
      roomId: options.roomId,
      iceServers: options.iceServers,
      selfUserId: options.selfUserId,
      onPhaseChange: (phase) => {
        this.phase = phase;
        options.onPhaseChange?.(phase);
      },
      onRemoteStream: (stream) => {
        this.remote = stream;
        options.onRemoteStream?.(stream);
      },
      onData: (userId, bytes) => {
        for (const handler of this.handlers) handler(userId, bytes);
      },
      // A link built after `publish` must carry the picture too — a guest who joins
      // second, or reconnects, gets it without the host doing anything.
      localMedia: () =>
        this.published
          ? { stream: this.published.stream, profile: toEncodeProfile(this.published.profile) }
          : null,
    });
  }

  /**
   * The datagram pipe's own health, which is not the same question as `phase`.
   *
   * On this path they happen to agree — the peer connections carry both — but a game
   * asking "can I send input" must ask this, because on the Crowd path the two answers
   * genuinely differ.
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

  async publish(stream: MediaStream, profile: MediaProfile): Promise<void> {
    if (this.disposed) return;
    this.published = { stream, profile };
    await this.mesh.publishToAll(stream, toEncodeProfile(profile));
  }

  async updateProfile(patch: Partial<MediaProfile>): Promise<void> {
    if (!this.published) return;
    this.published.profile = { ...this.published.profile, ...patch };
    await this.mesh.updateProfileOnAll(toEncodeProfile(this.published.profile));
  }

  /**
   * Stop sending, and close the connections with it.
   *
   * Deliberately the full teardown rather than only dropping the tracks: this is the
   * end of a session, not a pause, and a datagram channel to a game that is over has
   * nothing left to carry. A host who merely wants silence should stop the tracks.
   */
  unpublish(): void {
    this.published = null;
    this.mesh.closeAll();
  }

  reconnect(): void {
    this.mesh.reconnect();
  }

  async stats(): Promise<MediaStats> {
    return readLinkStats(await this.mesh.firstLink()?.getStats());
  }

  /** Open a link to a peer, or re-address an existing one. */
  connect(userId: string, socketId: string): Promise<void> {
    return this.mesh.connect(userId, socketId);
  }

  disconnect(userId: string): void {
    this.mesh.disconnect(userId);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.published = null;
    this.mesh.dispose();
    this.handlers.clear();
  }
}
