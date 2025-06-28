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

  CONNECT_TRANSPORT = "connectTransport",
  PRODUCE = "produce",
  CONSUME = "consume",
  LEAVE_ROOM = "leaveRoom",
  UNPAUSE_CONSUMERS = "unpauseConsumers",
  INCOMING_PRODUCER = "incomingProducer"
}
