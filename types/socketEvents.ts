export enum SocketEvent {
  DISCONNECT = "disconnect",
  CONNECTION = "connection",
  JOIN_ROOM = "joinroom",
  ONPLAY = "onplay",
  ONPAUSE = "onpause",
  ONSEEKED = "onseeked",
  SYNCWITHHOST = "syncwithhost",
  HOSTVIDEOSTATE = "hostvideostate",
  NOTIFY = "notify",
  CHATMESSAGE = "chatmessage",

  // Video selection events
  SELECT_VIDEO = "selectVideo",
  VIDEO_SELECTED = "videoSelected",
  REQUEST_CURRENT_VIDEO = "requestCurrentVideo",
  CURRENT_VIDEO_STATE = "currentVideoState",

  // Stream control events
  STREAM_PAUSED = "streamPaused",
  STREAM_RESUMED = "streamResumed",

  CONNECT_TRANSPORT = "connectTransport",
  PRODUCE = "produce",
  CONSUME = "consume",
  LEAVE_ROOM = "leaveRoom",
  UNPAUSE_CONSUMERS = "unpauseConsumers",
  INCOMING_PRODUCER = "incomingProducer"
}
