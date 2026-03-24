# P2P WebRTC Implementation Guide

## Overview

This document describes the Peer-to-Peer (P2P) WebRTC implementation for the streaming feature. The P2P implementation provides a cost-effective alternative to MediaSoup server-based streaming by establishing direct connections between the host and viewers.

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Stream Room (P2P Mode)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐         Socket.IO Server         ┌──────────┐ │
│  │   Host   │◄────────(Signaling Only)────────►│ Viewer 1 │ │
│  │          │                                   │          │ │
│  └────┬─────┘                                   └─────▲────┘ │
│       │                                               │      │
│       │         Direct P2P Connection                 │      │
│       │         (Audio/Video Stream)                  │      │
│       └───────────────────────────────────────────────┘      │
│                                                               │
│       │                                         ┌──────────┐ │
│       │         Direct P2P Connection           │ Viewer 2 │ │
│       └─────────────────────────────────────────►          │ │
│                   (Audio/Video Stream)          └──────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Backend (Communication Server)**
   - `P2PHandler` - Manages P2P signaling and peer discovery
   - Socket event handlers for WebRTC signaling (offer, answer, ICE candidates)

2. **Frontend (Costume)**
   - `useP2PStream` - Custom hook managing P2P connections
   - `P2PStreamPlayer` - Component for P2P stream playback
   - `PlayerWrapper` - Routes to P2P or MediaSoup based on room type

## Implementation Details

### Backend Components

#### P2PHandler (`communication/src/socket/handlers/p2p.handler.ts`)

**Responsibilities:**
- Manage P2P room state and peer tracking
- Forward WebRTC signaling messages between peers
- Handle peer join/leave events
- Manage stream control events (pause, resume, stop)

**Key Methods:**
- `setupForUser()` - Initialize P2P for a joining user
- `handleOffer()` - Forward WebRTC offer from one peer to another
- `handleAnswer()` - Forward WebRTC answer from one peer to another
- `handleIceCandidate()` - Forward ICE candidates between peers
- `notifyPeerJoined()` - Notify room when new peer joins
- `cleanupPeer()` - Clean up peer resources on disconnect

#### Socket Events

**P2P-Specific Events:**
- `P2P_OFFER` - WebRTC offer from initiating peer
- `P2P_ANSWER` - WebRTC answer from responding peer
- `P2P_ICE_CANDIDATE` - ICE candidate exchange
- `P2P_PEER_JOINED` - New peer joined notification
- `P2P_PEER_LEFT` - Peer left notification
- `P2P_STREAM_STARTED` - Host started streaming
- `P2P_ROOM_CLOSED` - Room closed notification

**Shared Events (with MediaSoup):**
- `STREAM_PAUSED` - Stream paused by host
- `STREAM_RESUMED` - Stream resumed by host
- `STREAM_STOPPED` - Stream stopped by host

### Frontend Components

#### useP2PStream Hook (`costume/hooks/useP2PStream.tsx`)

**Responsibilities:**
- Manage RTCPeerConnection instances for each peer
- Handle WebRTC signaling (offer/answer/ICE)
- Manage local stream capture and track replacement
- Handle connection state and reconnection
- Provide stream control API (pause, resume, stop)

**Key Features:**
- **Host Mode**: Creates peer connections to all viewers, adds local stream tracks
- **Consumer Mode**: Receives peer connections from host, receives remote stream
- **Track Management**: Handles track replacement when source changes
- **Connection Monitoring**: Tracks connection state and ICE connection state

**API (matches useStream for compatibility):**
```typescript
{
  isInitialized: boolean;
  initializeFromJoinResponse: () => Promise<void>;
  pauseProducers: () => void;
  resumeProducers: () => void;
  stopStream: (reason?: string) => void;
  resetState: () => void;
  onPause: (event?: string) => void;
  onPlay: (event?: string) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
}
```

#### P2PStreamPlayer Component (`costume/components/Container/P2PStreamPlayer.tsx`)

**Responsibilities:**
- Integrate useP2PStream hook with video player
- Handle video player events (ready, play, pause, seek)
- Manage pause frames for smooth UX
- Track analytics events
- Handle empty states and error conditions

**Key Features:**
- Source-agnostic (works with file, URL, or screen share)
- Handles both host and consumer scenarios
- Manages pending initialization states
- Integrates with existing player controls

## Connection Flow

### Host Starting Stream

1. Host joins room with `roomType: "stream"`
2. Backend calls `p2pHandler.setupForUser(socketId, roomId, true, username)`
3. Backend notifies room: `P2P_PEER_JOINED` event
4. Host's `useP2PStream` initializes and gets local stream
5. Host emits `P2P_STREAM_STARTED` to notify viewers

### Viewer Joining Stream

1. Viewer joins room with `roomType: "stream"`
2. Backend calls `p2pHandler.setupForUser(socketId, roomId, false, username)`
3. Backend notifies room: `P2P_PEER_JOINED` event with viewer's socketId
4. Host receives `P2P_PEER_JOINED`, creates RTCPeerConnection for viewer
5. Host adds local stream tracks to peer connection
6. Host creates and sends WebRTC offer to viewer
7. Viewer receives offer, creates peer connection, sets remote description
8. Viewer creates and sends answer back to host
9. Both exchange ICE candidates
10. Connection established, viewer receives stream via `ontrack` event

### ICE Candidate Exchange

```
Host                    Server                  Viewer
 │                        │                        │
 ├─ ICE Candidate ───────►│                        │
 │                        ├─ Forward ─────────────►│
 │                        │                        │
 │                        │◄─ ICE Candidate ───────┤
 │◄─ Forward ─────────────┤                        │
 │                        │                        │
```

## Configuration

### ICE Servers

Currently using public STUN servers:
```typescript
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
```

**Note:** For production, consider adding TURN servers for NAT traversal in restrictive networks.

## Advantages of P2P

1. **Cost Savings**: No server bandwidth costs for media streaming
2. **Lower Latency**: Direct peer-to-peer connections
3. **Scalability**: Server only handles signaling, not media
4. **Simple Infrastructure**: No need for MediaSoup workers

## Limitations

1. **Host Bandwidth**: Host must upload to each viewer individually
2. **NAT Traversal**: May require TURN servers in some networks
3. **Scalability**: Limited by host's upload bandwidth
4. **Browser Compatibility**: Requires WebRTC support

## Future Enhancements

### Monetization Integration (Not Yet Implemented)

The architecture is designed to support dual-mode streaming:

```typescript
// Future implementation example
if (user.isPremium) {
  // Use MediaSoup (server-relayed)
  return <StreamPlayer />;
} else {
  // Use P2P (direct connection)
  return <P2PStreamPlayer />;
}
```

### Connection Quality Monitoring

Future enhancements could include:
- Bandwidth estimation
- Packet loss monitoring
- Automatic quality adjustment
- Fallback to lower quality on poor connections

### Advanced Features

- **Simulcast**: Multiple quality layers for adaptive streaming
- **SVC**: Scalable Video Coding for better quality adaptation
- **Data Channels**: For chat, file transfer, etc.
- **Recording**: Server-side recording of P2P streams

## Testing

### Manual Testing Steps

1. **Single Viewer Test**
   - Host creates stream room
   - Host starts streaming (file/URL/screen)
   - Viewer joins room
   - Verify viewer receives stream
   - Test pause/resume/stop

2. **Multiple Viewers Test**
   - Host creates stream room
   - Multiple viewers join
   - Verify all viewers receive stream
   - Test one viewer leaving (others should continue)

3. **Source Switching Test**
   - Host switches between file, URL, and screen share
   - Verify tracks are replaced correctly
   - Verify viewers receive updated stream

4. **Network Conditions Test**
   - Test with poor network conditions
   - Verify ICE candidate exchange completes
   - Check connection state handling

### Debug Logging

Enable detailed logging by checking browser console:
- `[P2P]` prefix for P2P-related logs
- Connection state changes
- ICE candidate exchange
- Track additions/replacements

## Troubleshooting

### Common Issues

1. **No Stream Received**
   - Check ICE candidate exchange in console
   - Verify STUN servers are accessible
   - Check firewall/NAT settings
   - May need TURN server

2. **Connection Fails**
   - Check browser WebRTC support
   - Verify socket connection is stable
   - Check for CORS issues
   - Review ICE connection state logs

3. **Audio/Video Out of Sync**
   - Check track replacement logic
   - Verify both tracks are added to peer connection
   - Check for track ended events

4. **Host Can't Stream to Multiple Viewers**
   - Check host's upload bandwidth
   - Verify peer connections are created for each viewer
   - Check for connection state failures

## Migration from MediaSoup

The P2P implementation is designed to be a drop-in replacement:

1. **Same API**: `useP2PStream` matches `useStream` API
2. **Same Component Structure**: `P2PStreamPlayer` mirrors `StreamPlayer`
3. **Same Events**: Reuses stream control events where possible
4. **Easy Switching**: Change `PlayerWrapper` routing logic

## Code Examples

### Creating a P2P Connection (Host)

```typescript
// In useP2PStream hook
const pc = new RTCPeerConnection(ICE_SERVERS);

// Add local stream tracks
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream);
});

// Create and send offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit(SocketEvent.P2P_OFFER, {
  roomId,
  targetPeerId: viewerId,
  offer: pc.localDescription?.toJSON(),
});
```

### Receiving Stream (Viewer)

```typescript
// In useP2PStream hook
pc.ontrack = (event) => {
  const stream = new MediaStream();
  stream.addTrack(event.track);
  onStreamReceived(stream);
};
```

## Performance Considerations

1. **Host Upload Bandwidth**: Each viewer requires separate upload stream
2. **Connection Overhead**: Each peer connection has overhead
3. **CPU Usage**: Encoding/decoding for each connection
4. **Recommended Limits**: 
   - Small groups: 2-5 viewers per host
   - Medium groups: Consider MediaSoup
   - Large groups: Definitely use MediaSoup

## Security Considerations

1. **Signaling Security**: Socket.IO authentication required
2. **Media Encryption**: WebRTC uses DTLS-SRTP by default
3. **Peer Verification**: Server validates all signaling messages
4. **Room Access**: Server enforces room membership

## Conclusion

The P2P WebRTC implementation provides a cost-effective streaming solution for small to medium-sized groups. It maintains API compatibility with the existing MediaSoup implementation, allowing for easy switching based on user tier or room size.

For production deployment, consider:
- Adding TURN servers for better NAT traversal
- Implementing connection quality monitoring
- Setting viewer limits based on host capabilities
- Providing fallback to MediaSoup for large groups