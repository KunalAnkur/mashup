const turnConfig = {
  iceServers: [
    {
      urls: [
        "turn:turn.dev.movmash.com:3478?transport=udp",
        "turn:turn.dev.movmash.com:3478?transport=tcp",
        "turns:turn.dev.movmash.com:5349?transport=tcp",
      ],
      username: "movmash",
      credential: "movmash@123",
    },
  ],
};

export default turnConfig;