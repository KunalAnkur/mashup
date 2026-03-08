export enum SocketEvent {
  // Core socket lifecycle
  DISCONNECT = "disconnect",
  CONNECTION = "connection",
  SOCKET_ERROR = "socket_error",
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
}
