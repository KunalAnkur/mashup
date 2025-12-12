const turnConfig = {
  iceServers: [
    {
      urls: [
        "turn:turn.movmash.com:3478?transport=udp",
        "turn:turn.movmash.com:3478?transport=tcp",
        "turns:turn.movmash.com:5349?transport=tcp",
      ],
      username: "movmash",
      credential: "0a6c9d2b2948690",
    },
  ],
  iceTransportPolicy: "relay",
};

export default turnConfig;