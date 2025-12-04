# Socket V2 Migration - Unified Single Namespace Architecture

## Overview

This refactoring moves from **multiple namespaces** (old: `/chat`, `/stream`, `/`) to a **single unified namespace** architecture. This simplifies the socket management and prevents connection issues.

## Architecture

### Provider Hierarchy (Important!)

```
SocketProvider          (Socket connection - defined in layout)
  └── RoomProvider      (Room management - MUST be parent of all others)
        └── ChatProvider    (Chat functionality)
              └── VideoSelectionProvider
                    └── Page Content (StreamPlayer/SyncPlayer/Panel)
```

### Key Components

1. **SocketContext** (`context/SocketContext.tsx`)
   - Manages raw socket connection
   - Provides `socket` and `isConnected`
   - Single namespace (no `/chat`, `/stream` etc.)

2. **RoomContext** (`context/RoomContext.tsx`) - **NEW**
   - **Central room management**
   - Handles room joining/leaving ONCE
   - Provides `joinResponse` with MediaSoup data
   - Tracks host leave, room close events
   - Must wrap all other providers

3. **ChatContext** (`context/ChatContext.tsx`)
   - Uses RoomContext for room state
   - Enables chat when `isJoined` is true
   - Loads chat history from `joinResponse`

## Hooks

### useRoomContext (from RoomContext)
```typescript
const { 
  isJoined,      // Is room successfully joined?
  isLoading,     // Join in progress?
  roomType,      // "stream" | "sync"
  joinResponse,  // Server response with MediaSoup data
  isHost,        // Is current user the host?
  leaveRoom,     // Function to leave
} = useRoomContext();
```

### useStream (for Stream rooms)
```typescript
const {
  isInitialized,              // MediaSoup ready?
  initializeFromJoinResponse, // Must call with joinResponse
  pauseProducers,
  resumeProducers,
  replaceProducerTracks,
} = useStream({
  roomId,
  getStream,
  onStreamReceived,
  isHost,
  enabled: isJoined && roomType === "stream",
});
```

### useSync (for Sync rooms)
```typescript
const {
  onPlay,
  onPause,
  onSeeked,
  onReady,
  isPlaying,
  selectVideo,
} = useSync({
  playerRef,
  isHost,
  roomId,
  enabled: isJoined && roomType === "sync",
});
```

### useChat
```typescript
const {
  messages,
  sendMessage,
  sendReaction,
  handleTyping,
} = useChat({
  roomId,
  isHost,
  enabled: isJoined, // Both stream and sync rooms have chat
});
```

## Room Types

### Stream Room (`type: "stream"`)
- Uses MediaSoup for WebRTC streaming
- Host produces video/audio streams
- Consumers receive via MediaSoup transports
- Used for: Screen sharing, local file streaming

### Sync Room (`type: "sync"`)
- Uses URL-based playback sync
- Host controls play/pause/seek
- Participants sync to host's state
- Used for: YouTube, Vimeo, direct URLs

## Data Flow

### Join Flow
```
1. Page mounts with RoomProvider
2. RoomContext auto-joins room via socket
3. Server responds with:
   - For stream: rtpCapabilities, sendTransportOptions/recvTransportOptions
   - For sync: roomType confirmation
   - For both: chatHistory
4. ChatContext loads chat history from joinResponse
5. StreamPlayer/SyncPlayer initializes based on roomType
```

### Stream Room Data Flow
```
Host:
1. RoomContext joins → receives rtpCapabilities + sendTransportOptions
2. StreamPlayer calls initializeFromJoinResponse(joinResponse)
3. useStream creates MediaSoup device and producer transport
4. getStream() captures video/audio
5. produceMedia() sends tracks via transport

Consumer:
1. RoomContext joins → receives rtpCapabilities + recvTransportOptions + existingProducers
2. StreamPlayer calls initializeFromJoinResponse(joinResponse)
3. useStream creates MediaSoup device and consumer transport
4. consume() receives tracks from host
5. onStreamReceived() callback provides MediaStream
```

### Sync Room Data Flow
```
Host:
1. RoomContext joins
2. SyncPlayer initializes useSync
3. Host actions (play/pause/seek) emit events
4. Other users receive and apply state

Consumer:
1. RoomContext joins
2. Server emits SYNCWITHHOST to host
3. Host responds with HOSTVIDEOSTATE
4. Consumer applies state via applySyncState()
```

## Backend (socket-v2)

### UnifiedSocketHandler (`communication/src/socket-v2/index.ts`)
- Single entry point for all socket events
- Routes to feature handlers based on event

### Handlers
- `ChatHandler` - Message sending, typing indicators, reactions
- `VideoSyncHandler` - Play/pause/seek sync
- `MediaSoupHandler` - WebRTC transport/producer/consumer management

### Room Manager
- Tracks users in rooms
- Stores room type (stream/sync)
- Provides host lookup

## Socket Events (Key Ones)

### Room
- `joinroom` - Join with roomType
- `leaveRoom` - Leave room
- `hostLeft` - Host left notification

### Chat
- `sendChatMessage` / `receiveChatMessage`
- `userTyping` / `userStoppedTyping`
- `sendReaction` / `receiveReaction`

### Video Sync
- `onplay` / `onpause` / `onseeked`
- `syncwithhost` / `hostvideostate`
- `selectVideo` / `videoSelected`
- `requestCurrentVideo` / `currentVideoState`

### MediaSoup
- `connectTransport`
- `produce`
- `consume`
- `incomingProducer`
- `streamPaused` / `streamResumed`

## Migration Checklist

- [x] Create RoomContext for centralized room management
- [x] Update ChatContext to use RoomContext
- [x] Update StreamPlayer to use RoomContext
- [x] Update SyncPlayer to use RoomContext
- [x] Update room page with correct provider hierarchy
- [x] Update Panel to use RoomContext for leave
- [x] Fix useStream initialization flow
- [x] Update useSync with better logging
- [x] Update useChat for consistency

## Troubleshooting

### "No RTP capabilities" error
- Check that joinResponse has rtpCapabilities
- Ensure room is joined before initializing stream

### Consumer not receiving stream
- Check INCOMING_PRODUCER event is received
- Verify consumer transport is created
- Check existingProducers in join response

### Video sync not working
- Verify roomType is "sync"
- Check that host is emitting events
- Ensure consumer is listening for HOSTVIDEOSTATE
