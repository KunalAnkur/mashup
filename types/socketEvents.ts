export enum SocketEvent {
  // Core socket lifecycle
  DISCONNECT = "disconnect",
  CONNECTION = "connection",
  SOCKET_ERROR = "socket_error",
  // Server is going down for a deploy/restart. The disconnect that follows is expected and
  // short — hold room state and wait for the automatic rejoin instead of tearing the room down.
  SERVER_RESTARTING = "serverRestarting",
  // Room & sync
  JOIN_ROOM = "joinroom",
  ONPLAY = "onplay",
  ONPAUSE = "onpause",
  ONSEEKED = "onseeked",
  SYNCWITHHOST = "syncwithhost",
  HOSTVIDEOSTATE = "hostvideostate",
  NOTIFY = "notify",
  ROOM_INFO_UPDATED = "roomInfoUpdated",
  UPDATE_PLAYLIST = "updatePlaylist",
  PLAYLIST_UPDATED = "playlistUpdated",
  WATCH_TIME = "watchTime",
  HOST_PLAYBACK_STATE = "hostPlaybackState",
  WATCH_LIMIT_REACHED = "watchLimitReached", // Free-tier daily watch limit hit — informational
  FORCE_PAUSE_PLAYBACK = "forcePausePlayback", // Must actually stop playback and block resume
  USAGE_UPDATED = "usageUpdated", // Live remaining-minutes countdown, sent on every daily-limit check
  // Video selection events
  SELECT_VIDEO = "selectVideo",
  VIDEO_SELECTED = "videoSelected",
  REQUEST_CURRENT_VIDEO = "requestCurrentVideo",
  CURRENT_VIDEO_STATE = "currentVideoState",

  // Stream control events
  STREAM_PAUSED = "streamPaused",
  STREAM_RESUMED = "streamResumed",
  STREAM_STOPPED = "streamStopped",
  STREAM_HAS_VIDEO = "streamHasVideo", // Host notifies consumers about video track status

  // Chat-specific events
  JOIN_CHAT_ROOM = "joinChatRoom",
  SEND_CHAT_MESSAGE = "sendChatMessage",
  RECEIVE_CHAT_MESSAGE = "receiveChatMessage",
  USER_TYPING = "userTyping",
  USER_STOPPED_TYPING = "userStoppedTyping",
  LEAVE_CHAT_ROOM = "leaveChatRoom",
  GET_CHAT_HISTORY = "getChatHistory",
  PIN_CHAT_MESSAGE = "pinChatMessage",
  UNPIN_CHAT_MESSAGE = "unpinChatMessage",
  PINNED_CHAT_MESSAGE_UPDATED = "pinnedChatMessageUpdated",

  // Reaction events
  SEND_REACTION = "sendReaction",
  RECEIVE_REACTION = "receiveReaction",
  TOGGLE_MESSAGE_REACTION = "toggleMessageReaction",
  MESSAGE_REACTIONS_UPDATED = "messageReactionsUpdated",

  // Mediasoup / streaming
  GET_TRANSPORT_INFO = "getTransportInfo",
  CONNECT_TRANSPORT = "connectTransport",
  PRODUCE = "produce",
  CONSUME = "consume",
  LEAVE_ROOM = "leaveRoom",
  CLEANUP_STREAM_ROOM = "cleanupStreamRoom",
  UNPAUSE_CONSUMERS = "unpauseConsumers",
  INCOMING_PRODUCER = "incomingProducer",
  HOST_LEFT = "hostLeft",
  HOST_JOINED = "hostJoined",
  USERS_UPDATED = "usersUpdated",
  USERNAME_UPDATED = "usernameUpdated",

  // P2P WebRTC events
  P2P_OFFER = "p2pOffer",
  P2P_ANSWER = "p2pAnswer",
  P2P_ICE_CANDIDATE = "p2pIceCandidate",
  P2P_PEER_JOINED = "p2pPeerJoined",
  P2P_PEER_LEFT = "p2pPeerLeft",
  P2P_STREAM_STARTED = "p2pStreamStarted",
  P2P_ROOM_CLOSED = "p2pRoomClosed",

  // Video call events (bidirectional — premium uses SFU, free uses P2P)
  CALL_JOIN = "callJoin",
  CALL_LEAVE = "callLeave",
  CALL_CONNECT_TRANSPORT = "callConnectTransport",
  CALL_PRODUCE = "callProduce",
  CALL_CONSUME = "callConsume",
  CALL_UNPAUSE_CONSUMERS = "callUnpauseConsumers",
  CALL_INCOMING_PRODUCER = "callIncomingProducer",
  CALL_PARTICIPANT_JOINED = "callParticipantJoined",
  CALL_PARTICIPANT_LEFT = "callParticipantLeft",
  CALL_MEDIA_STATE = "callMediaState",
  // P2P signaling for free-tier calls (separate from stream P2P events)
  CALL_P2P_OFFER = "callP2pOffer",
  CALL_P2P_ANSWER = "callP2pAnswer",
  CALL_P2P_ICE = "callP2pIce",
}
