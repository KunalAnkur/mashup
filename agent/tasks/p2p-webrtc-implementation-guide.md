# WebRTC P2P Implementation Guide - Code Level Strategy

## Overview
This guide provides step-by-step code implementation for adding WebRTC peer-to-peer functionality alongside the existing MediaSoup streaming system.

---

## STEP 1: Add Socket Events (Type Definitions)

### File: `costume/types/socketEvents.ts`

```typescript
export enum SocketEvent {
  // ... existing events
  
  // P2P WebRTC Events (ADD THESE)
  P2P_OFFER = "p2pOffer",
  P2P_ANSWER = "p2pAnswer",
  P2P_ICE_CANDIDATE = "p2pIceCandidate",
  P2P_CONNECTION_STATE = "p2pConnectionState",
  P2P_STREAM_READY = "p2pStreamReady",
}
```

### File: `communication/src/types/socket.type.ts`

```typescript
// Add P2P event data types
export interface P2POfferData {
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  offer: RTCSessionDescriptionInit;
}

export interface P2PAnswerData {
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  answer: RTCSessionDescriptionInit;
}

export interface P2PIceCandidateData {
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  candidate: RTCIceCandidateInit;
}

export interface P2PConnectionStateData {
  roomId: string;
  peerId: string;
  state: RTCPeerConnectionState;
}
```

---

## STEP 2: Create P2P Handler (Backend)

### File: `communication/src/socket/handlers/p2p.handler.ts` (NEW FILE)

```typescript
import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../types";
import logger from "../../utils/winston";
import { RoomManager } from "../managers/room.manager";

export class P2PHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  /**
   * Handle P2P offer from host to consumer
   */
  public handleP2POffer(
    socket: Socket,
    data: {
      roomId: string;
      toPeerId: string;
      offer: RTCSessionDescriptionInit;
    }
  ): void {
    try {
      const { roomId, toPeerId, offer } = data;
      const user = this.roomManager.getUser(socket.id);

      if (!user || user.roomId !== roomId) {
        logger.warn(`[P2P] Unauthorized offer from ${socket.id}`);
        return;
      }

      // Forward offer to target peer
      this.io.to(toPeerId).emit(SocketEvent.P2P_OFFER, {
        roomId,
        fromPeerId: socket.id,
        toPeerId,
        offer,
      });

      logger.info(`[P2P] Offer forwarded: ${socket.id} → ${toPeerId}`);
    } catch (error) {
      logger.error("[P2P] Error handling offer:", error);
    }
  }

  /**
   * Handle P2P answer from consumer to host
   */
  public handleP2PAnswer(
    socket: Socket,
    data: {
      roomId: string;
      toPeerId: string;
      answer: RTCSessionDescriptionInit;
    }
  ): void {
    try {
      const { roomId, toPeerId, answer } = data;
      const user = this.roomManager.getUser(socket.id);

      if (!user || user.roomId !== roomId) {
        logger.warn(`[P2P] Unauthorized answer from ${socket.id}`);
        return;
      }

      // Forward answer to target peer (host)
      this.io.to(toPeerId).emit(SocketEvent.P2P_ANSWER, {
        roomId,
        fromPeerId: socket.id,
        toPeerId,
        answer,
      });

      logger.info(`[P2P] Answer forwarded: ${socket.id} → ${toPeerId}`);
    } catch (error) {
      logger.error("[P2P] Error handling answer:", error);
    }
  }

  /**
   * Handle ICE candidate exchange
   */
  public handleP2PIceCandidate(
    socket: Socket,
    data: {
      roomId: string;
      toPeerId: string;
      candidate: RTCIceCandidateInit;
    }
  ): void {
    try {
      const { roomId, toPeerId, candidate } = data;
      const user = this.roomManager.getUser(socket.id);

      if (!user || user.roomId !== roomId) {
        logger.warn(`[P2P] Unauthorized ICE candidate from ${socket.id}`);
        return;
      }

      // Forward ICE candidate to target peer
      this.io.to(toPeerId).emit(SocketEvent.P2P_ICE_CANDIDATE, {
        roomId,
        fromPeerId: socket.id,
        toPeerId,
        candidate,
      });

      logger.debug(`[P2P] ICE candidate forwarded: ${socket.id} → ${toPeerId}`);
    } catch (error) {
      logger.error("[P2P] Error handling ICE candidate:", error);
    }
  }

  /**
   * Handle connection state updates
   */
  public handleP2PConnectionState(
    socket: Socket,
    data: {
      roomId: string;
      peerId: string;
      state: RTCPeerConnectionState;
    }
  ): void {
    try {
      const { roomId, peerId, state } = data;
      const user = this.roomManager.getUser(socket.id);

      if (!user || user.roomId !== roomId) {
        return;
      }

      logger.info(`[P2P] Connection state: ${socket.id} → ${peerId}: ${state}`);

      // Broadcast state to room for monitoring
      socket.to(roomId).emit(SocketEvent.P2P_CONNECTION_STATE, {
        roomId,
        peerId: socket.id,
        state,
      });
    } catch (error) {
      logger.error("[P2P] Error handling connection state:", error);
    }
  }

  /**
   * Cleanup P2P connections for a peer
   */
  public cleanupP2PConnections(socketId: string, roomId: string): void {
    try {
      logger.info(`[P2P] Cleaning up connections for ${socketId} in room ${roomId}`);
      
      // Notify other peers that this peer disconnected
      this.io.to(roomId).emit(SocketEvent.P2P_CONNECTION_STATE, {
        roomId,
        peerId: socketId,
        state: "closed",
      });
    } catch (error) {
      logger.error("[P2P] Error cleaning up connections:", error);
    }
  }
}
```

---

## STEP 3: Integrate P2P Handler into Socket Index

### File: `communication/src/socket/index.ts` (MODIFY)

```typescript
// Add import at top
import { P2PHandler } from "./handlers/p2p.handler";

export class UnifiedSocketHandler {
  // Add property
  private p2pHandler: P2PHandler;

  public async listen(io: Server): Promise<void> {
    this.io = io;

    // Initialize handlers
    this.chatHandler = new ChatHandler(io, this.roomManager);
    this.videoSyncHandler = new VideoSyncHandler(io, this.roomManager, this.chatHandler);
    this.mediaSoupHandler = new MediaSoupHandler(io, this.roomManager, this.chatHandler);
    this.p2pHandler = new P2PHandler(io, this.roomManager); // ADD THIS LINE

    // ... rest of initialization
  }

  private handleStreamListeners(socket: Socket): void {
    // ... existing MediaSoup listeners

    // ADD P2P LISTENERS
    socket.on(SocketEvent.P2P_OFFER, (data) =>
      this.p2pHandler.handleP2POffer(socket, data)
    );

    socket.on(SocketEvent.P2P_ANSWER, (data) =>
      this.p2pHandler.handleP2PAnswer(socket, data)
    );

    socket.on(SocketEvent.P2P_ICE_CANDIDATE, (data) =>
      this.p2pHandler.handleP2PIceCandidate(socket, data)
    );

    socket.on(SocketEvent.P2P_CONNECTION_STATE, (data) =>
      this.p2pHandler.handleP2PConnectionState(socket, data)
    );
  }

  private handleLeaveRoom(socket: Socket, data?: { roomId?: string }): void {
    const user = this.roomManager.getUser(socket.id);
    if (!user) return;

    const roomId = data?.roomId?.trim() || user.roomId;
    
    // ... existing cleanup code

    // ADD P2P CLEANUP (before MediaSoup cleanup)
    this.p2pHandler.cleanupP2PConnections(socket.id, roomId);

    // ... rest of cleanup
  }
}
```

---

## STEP 4: Extend useStream Hook (Frontend) - Part 1: Add P2P State

### File: `costume/hooks/useStream.tsx` (MODIFY)

```typescript
// Add to interface
interface UseStreamParams {
  // ... existing params
  streamMode?: 'mediasoup' | 'p2p'; // ADD THIS
}

export const useStream = ({
  roomId,
  getStream,
  onStreamReceived,
  onStreamPaused,
  onStreamResumed,
  onStreamStopped,
  isHost,
  enabled = true,
  username,
  email,
  profile,
  streamMode = 'mediasoup', // ADD THIS with default
}: UseStreamParams) => {
  const { socket } = useSocket();

  // ADD P2P STATE AND REFS
  const [currentMode, setCurrentMode] = useState<'mediasoup' | 'p2p'>(streamMode);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // ... existing MediaSoup refs and state remain unchanged
```

---

## STEP 5: Extend useStream Hook - Part 2: Add P2P Functions

### File: `costume/hooks/useStream.tsx` (CONTINUE MODIFYING)

Add these functions after the existing MediaSoup functions:

```typescript
  // ============================================================================
  // P2P Functions (ADD THESE AFTER MEDIASOUP FUNCTIONS)
  // ============================================================================

  /**
   * Create RTCPeerConnection for a specific peer
   */
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // TODO: Add TURN servers for production
      ],
    };

    const pc = new RTCPeerConnection(config);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit(SocketEvent.P2P_ICE_CANDIDATE, {
          roomId,
          toPeerId: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[P2P] Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (socket) {
        socket.emit(SocketEvent.P2P_CONNECTION_STATE, {
          roomId,
          peerId,
          state: pc.connectionState,
        });
      }

      // Handle disconnection/failure
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn(`[P2P] Connection ${pc.connectionState} with ${peerId}`);
        // TODO: Implement reconnection logic
      }

      if (pc.connectionState === 'closed') {
        peerConnectionsRef.current.delete(peerId);
      }
    };

    // For consumers: handle incoming tracks
    if (!isHost) {
      pc.ontrack = (event) => {
        console.log(`[P2P] Received track from ${peerId}:`, event.track.kind);
        const stream = event.streams[0];
        if (stream) {
          onStreamReceivedRef.current?.(stream);
        }
      };
    }

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [socket, roomId, isHost]);

  /**
   * Initialize P2P mode
   */
  const initializeP2PMode = useCallback(async () => {
    if (!socket || !roomId || !enabled) return;

    console.log(`[P2P] Initializing P2P mode as ${isHost ? 'HOST' : 'CONSUMER'}`);
    setCurrentMode('p2p');

    if (isHost) {
      console.log('[P2P] Host ready - will create offers when consumers join');
    } else {
      console.log('[P2P] Consumer waiting for offer from host');
    }

    setIsInitialized(true);
  }, [socket, roomId, isHost, enabled]);

  /**
   * Host: Create offer for a specific consumer
   */
  const createOfferForPeer = useCallback(async (peerId: string) => {
    if (!isHost || !socket) return;

    try {
      console.log(`[P2P] Creating offer for ${peerId}`);
      const pc = createPeerConnection(peerId);
      
      // Add local stream tracks
      const stream = getStreamRef.current();
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
          console.log(`[P2P] Added ${track.kind} track to connection with ${peerId}`);
        });
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit(SocketEvent.P2P_OFFER, {
        roomId,
        toPeerId: peerId,
        offer: pc.localDescription!.toJSON(),
      });

      console.log(`[P2P] Offer sent to ${peerId}`);
    } catch (error) {
      console.error(`[P2P] Error creating offer for ${peerId}:`, error);
    }
  }, [isHost, socket, roomId, createPeerConnection]);

  /**
   * Consumer: Handle incoming offer from host
   */
  const handleP2POffer = useCallback(async (data: {
    roomId: string;
    fromPeerId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    if (isHost || !socket || data.roomId !== roomId) return;

    try {
      const { fromPeerId, offer } = data;
      console.log(`[P2P] Received offer from ${fromPeerId}`);

      const pc = createPeerConnection(fromPeerId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process queued ICE candidates
      const queuedCandidates = iceCandidateQueueRef.current.get(fromPeerId) || [];
      for (const candidate of queuedCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueueRef.current.delete(fromPeerId);

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit(SocketEvent.P2P_ANSWER, {
        roomId,
        toPeerId: fromPeerId,
        answer: pc.localDescription!.toJSON(),
      });

      console.log(`[P2P] Answer sent to ${fromPeerId}`);
    } catch (error) {
      console.error('[P2P] Error handling offer:', error);
    }
  }, [isHost, socket, roomId, createPeerConnection]);

  /**
   * Host: Handle incoming answer from consumer
   */
  const handleP2PAnswer = useCallback(async (data: {
    roomId: string;
    fromPeerId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    if (!isHost || data.roomId !== roomId) return;

    try {
      const { fromPeerId, answer } = data;
      console.log(`[P2P] Received answer from ${fromPeerId}`);

      const pc = peerConnectionsRef.current.get(fromPeerId);
      if (!pc) {
        console.warn(`[P2P] No peer connection found for ${fromPeerId}`);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Process queued ICE candidates
      const queuedCandidates = iceCandidateQueueRef.current.get(fromPeerId) || [];
      for (const candidate of queuedCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueueRef.current.delete(fromPeerId);

      console.log(`[P2P] Connection established with ${fromPeerId}`);
    } catch (error) {
      console.error('[P2P] Error handling answer:', error);
    }
  }, [isHost, roomId]);

  /**
   * Handle incoming ICE candidate
   */
  const handleP2PIceCandidate = useCallback(async (data: {
    roomId: string;
    fromPeerId: string;
    candidate: RTCIceCandidateInit;
  }) => {
    if (data.roomId !== roomId) return;

    try {
      const { fromPeerId, candidate } = data;
      const pc = peerConnectionsRef.current.get(fromPeerId);

      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue candidate if remote description not set yet
        if (!iceCandidateQueueRef.current.has(fromPeerId)) {
          iceCandidateQueueRef.current.set(fromPeerId, []);
        }
        iceCandidateQueueRef.current.get(fromPeerId)!.push(candidate);
      }
    } catch (error) {
      console.error('[P2P] Error handling ICE candidate:', error);
    }
  }, [roomId]);

  /**
   * Replace tracks on all P2P connections (when video source changes)
   */
  const replaceP2PTracks = useCallback(async (newStream: MediaStream) => {
    if (!isHost || currentMode !== 'p2p') return;

    const audioTrack = newStream.getAudioTracks()[0];
    const videoTrack = newStream.getVideoTracks()[0];

    for (const [peerId, pc] of peerConnectionsRef.current) {
      try {
        const senders = pc.getSenders();
        
        for (const sender of senders) {
          if (sender.track?.kind === 'audio' && audioTrack) {
            await sender.replaceTrack(audioTrack);
            console.log(`[P2P] Replaced audio track for ${peerId}`);
          } else if (sender.track?.kind === 'video' && videoTrack) {
            await sender.replaceTrack(videoTrack);
            console.log(`[P2P] Replaced video track for ${peerId}`);
          }
        }
      } catch (error) {
        console.error(`[P2P] Error replacing tracks for ${peerId}:`, error);
      }
    }
  }, [isHost, currentMode]);

  /**
   * Cleanup all P2P connections
   */
  const cleanupP2PConnections = useCallback(() => {
    console.log('[P2P] Cleaning up all peer connections');
    
    for (const [peerId, pc] of peerConnectionsRef.current) {
      try {
        pc.close();
      } catch (error) {
        console.warn(`[P2P] Error closing connection to ${peerId}:`, error);
      }
    }
    
    peerConnectionsRef.current.clear();
    iceCandidateQueueRef.current.clear();
  }, []);
```

---

## STEP 6: Extend useStream Hook - Part 3: Add P2P Event Listeners

### File: `costume/hooks/useStream.tsx` (CONTINUE MODIFYING)

Add these useEffect hooks after existing ones:

```typescript
  // ============================================================================
  // P2P Event Listeners (ADD THESE)
  // ============================================================================

  // Listen for P2P offers (consumers only)
  useEffect(() => {
    if (!socket || isHost || currentMode !== 'p2p' || !enabled) return;

    socket.on(SocketEvent.P2P_OFFER, handleP2POffer);

    return () => {
      socket.off(SocketEvent.P2P_OFFER, handleP2POffer);
    };
  }, [socket, isHost, currentMode, enabled, handleP2POffer]);

  // Listen for P2P answers (host only)
  useEffect(() => {
    if (!socket || !isHost || currentMode !== 'p2p' || !enabled) return;

    socket.on(SocketEvent.P2P_ANSWER, handleP2PAnswer);

    return () => {
      socket.off(SocketEvent.P2P_ANSWER, handleP2PAnswer);
    };
  }, [socket, isHost, currentMode, enabled, handleP2PAnswer]);

  // Listen for ICE candidates (both host and consumers)
  useEffect(() => {
    if (!socket || currentMode !== 'p2p' || !enabled) return;

    socket.on(SocketEvent.P2P_ICE_CANDIDATE, handleP2PIceCandidate);

    return () => {
      socket.off(SocketEvent.P2P_ICE_CANDIDATE, handleP2PIceCandidate);
    };
  }, [socket, currentMode, enabled, handleP2PIceCandidate]);

  // Listen for USERS_UPDATED to create offers for new consumers (host only)
  useEffect(() => {
    if (!socket || !isHost || currentMode !== 'p2p' || !enabled || !roomId) return;

    const handleUsersUpdated = (data: { roomId: string; users: any[] }) => {
      if (data.roomId !== roomId) return;

      // Create offers for new consumers
      const consumers = data.users.filter(u => !u.host && u.socketId !== socket.id);
      
      for (const consumer of consumers) {
        // Only create offer if we don't already have a connection
        if (!peerConnectionsRef.current.has(consumer.socketId)) {
          console.log(`[P2P] New consumer detected: ${consumer.socketId}`);
          createOfferForPeer(consumer.socketId);
        }
      }
    };

    socket.on(SocketEvent.USERS_UPDATED, handleUsersUpdated);

    return () => {
      socket.off(SocketEvent.USERS_UPDATED, handleUsersUpdated);
    };
  }, [socket, isHost, currentMode, enabled, roomId, createOfferForPeer]);

  // Cleanup P2P connections on unmount or mode change
  useEffect(() => {
    return () => {
      if (currentMode === 'p2p') {
        cleanupP2PConnections();
      }
    };
  }, [currentMode, cleanupP2PConnections]);
```

---

## STEP 7: Extend useStream Hook - Part 4: Update Return API

### File: `costume/hooks/useStream.tsx` (CONTINUE MODIFYING)

Update the return statement to include P2P functions:

```typescript
  return {
    isInitialized,
    
    // Mode-aware initialization
    initializeFromJoinResponse: currentMode === 'mediasoup' 
      ? initializeFromJoinResponse 
      : initializeP2PMode,
    
    // MediaSoup functions (existing)
    pauseProducers: notifyPausedPlayback,
    resumeProducers,
    stopStream: stopHostStream,
    resetState: currentMode === 'mediasoup' ? resetState : cleanupP2PConnections,
    
    // P2P functions (new)
    initializeP2PMode,
    createOfferForPeer,
    replaceP2PTracks,
    cleanupP2PConnections,
    
    // Current mode
    currentMode,
    
    // Existing callbacks
    onPause: (event?: string) => {
      if (event === 'seekend' || isSeekingRef.current) return;
      if (currentMode === 'mediasoup') {
        notifyPausedPlayback();
      }
      // P2P doesn't need pause/resume signaling (direct connection)
    },
    onPlay: (event?: string) => {
      if (isSeekingRef.current) return;
      if (currentMode === 'mediasoup') {
        resumeProducers();
      }
      // P2P doesn't need pause/resume signaling
    },
    onSeekStart: () => {
      isSeekingRef.current = true;
    },
    onSeekEnd: () => {
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    },
  };
};
```

---

## STEP 8: Update StreamPlayer Component

### File: `costume/components/Container/StreamPlayer.tsx` (MODIFY)

```typescript
const StreamPlayer = ({ fullscreenTargetRef, setFocus }: Props) => {
  // ... existing state

  // ADD: Determine stream mode (later this will be based on user premium status)
  const streamMode: 'mediasoup' | 'p2p' = 'mediasoup'; // Default to mediasoup for now
  // TODO: Change to: const streamMode = authState.user?.isPremium ? 'mediasoup' : 'p2p';

  // ... existing useStreamSource hook

  // Update useStream hook call
  const {
    isInitialized,
    initializeFromJoinResponse, // This will be mode-aware now
    onSeekStart,
    onSeekEnd,
    onPlay: streamOnPlay,
    onPause,
    stopStream,
    currentMode, // NEW: Get current mode
  } = useStream({
    roomId: roomState.roomId,
    getStream,
    isHost,
    enabled: isJoined,
    username: authState.user?.username || authState.user?.name || "User",
    email: authState.user?.email,
    profile: authState.user?.profile,
    onStreamReceived: handleStreamReceived,
    onStreamPaused: handleStreamPaused,
    onStreamResumed: handleStreamResumed,
    onStreamStopped: handleStreamStopped,
    streamMode, // NEW: Pass stream mode
  });

  // ... rest of component remains the same
  
  // Optional: Add mode indicator for debugging
  console.log(`[StreamPlayer] Current streaming mode: ${currentMode}`);
};
```

---

## STEP 9: Testing Strategy

### Test Scenario 1: Single Host, Single Consumer (P2P)

1. **Setup**:
   - Set `streamMode = 'p2p'` in StreamPlayer
   - Host creates room and starts streaming
   - Consumer joins room

2. **Expected Flow**:
   ```
   Host: initializeP2PMode() → ready
   Consumer: joins → initializeP2PMode() → ready
   Host: receives USERS_UPDATED → createOfferForPeer(consumerId)
   Consumer: receives P2P_OFFER → handleP2POffer() → sends P2P_ANSWER
   Host: receives P2P_ANSWER → handleP2PAnswer() → connection established
   Both: exchange ICE candidates
   Consumer: receives stream via ontrack event
   ```

3. **Verification**:
   - Check browser console for P2P logs
   - Verify consumer sees host's video
   - Check connection state: should be "connected"

### Test Scenario 2: Multiple Consumers

1. **Setup**:
   - Host creates room
   - Consumer 1 joins
   - Consumer 2 joins
   - Consumer 3 joins

2. **Expected Behavior**:
   - Host maintains 3 separate RTCPeerConnections
   - Each consumer has 1 connection to host
   - All consumers receive stream independently

3. **Verification**:
   - Host: `peerConnectionsRef.current.size === 3`
   - Each consumer sees video
   - Check network tab: no media through server

### Test Scenario 3: Track Replacement

1. **Setup**:
   - P2P connection established
   - Host switches video source (file → screen share)

2. **Expected Flow**:
   - Host: `replaceP2PTracks(newStream)` called
   - All peer connections get new tracks
   - Consumers continue receiving stream without reconnection

3. **Verification**:
   - No connection drops
   - Consumers see new video source
   - Check logs for "Replaced video track" messages

---

## STEP 10: Debugging Tips

### Enable Verbose Logging

```typescript
// In useStream.tsx, add detailed logging
const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
  const pc = new RTCPeerConnection(config);
  
  // Log all ICE connection state changes
  pc.oniceconnectionstatechange = () => {
    console.log(`[P2P] ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
  };
  
  // Log all ICE gathering state changes
  pc.onicegatheringstatechange = () => {
    console.log(`[P2P] ICE gathering state with ${peerId}: ${pc.iceGatheringState}`);
  };
  
  // Log all signaling state changes
  pc.onsignalingstatechange = () => {
    console.log(`[P2P] Signaling state with ${peerId}: ${pc.signalingState}`);
  };
  
  return pc;
}, []);
```

### Check WebRTC Stats

```typescript
// Add this function to monitor connection quality
const getConnectionStats = async (peerId: string) => {
  const pc = peerConnectionsRef.current.get(peerId);
  if (!pc) return;
  
  const stats = await pc.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
      console.log(`[P2P Stats] ${peerId}:`, report);
    }
  });
};
```

### Common Issues and Solutions

1. **ICE Candidates Not Exchanging**:
   - Check firewall settings
   - Verify STUN servers are reachable
   - Add TURN servers for NAT traversal

2. **Connection Stuck in "connecting"**:
   - Check if remote description is set
   - Verify ICE candidates are being added
   - Check for symmetric NAT (requires TURN)

3. **No Video Received**:
   - Verify tracks are added to peer connection
   - Check `ontrack` event is firing
   - Verify stream has active tracks

---

## STEP 11: Production Considerations

### Add TURN Servers

```typescript
const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
  ],
};
```

### Implement Reconnection Logic

```typescript
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'failed') {
    console.log(`[P2P] Connection failed with ${peerId}, attempting reconnection`);
    
    // Restart ICE
    pc.restartIce();
    
    // Or recreate connection
    setTimeout(() => {
      if (isHost) {
        createOfferForPeer(peerId);
      }
    }, 1000);
  }
};
```

### Add Connection Quality Monitoring

```typescript
// Monitor bandwidth and packet loss
setInterval(async () => {
  for (const [peerId, pc] of peerConnectionsRef.current) {
    const stats = await pc.getStats();
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 0;
        const lossRate = packetsLost / (packetsLost + packetsReceived);
        
        if (lossRate > 0.05) {
          console.warn(`[P2P] High packet loss with ${peerId}: ${(lossRate * 100).toFixed(2)}%`);
        }
      }
    });
  }
}, 5000);
```

---

## Summary

This implementation strategy provides:

1. ✅ **Backend signaling** via P2PHandler
2. ✅ **Frontend P2P logic** in useStream hook
3. ✅ **Mode-aware initialization** (MediaSoup or P2P)
4. ✅ **Complete offer/answer/ICE flow**
5. ✅ **Track replacement support**
6. ✅ **Connection cleanup**
7. ✅ **Testing scenarios**
8. ✅ **Debugging tools**
9. ✅ **Production considerations**

The code is designed to coexist with MediaSoup without breaking existing functionality. You can switch between modes by changing the `streamMode` parameter.

**Next Steps**:
1. Implement backend P2P handler
2. Add P2P functions to useStream
3. Test with 2 users (host + consumer)
4. Test with multiple consumers
5. Add TURN servers for production
6. Implement monetization logic (premium vs free)