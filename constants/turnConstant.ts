const turnConfig = {
  iceServers: [
    {
      urls: [
        "turn:turn.movmash.com:3478?transport=udp",
        "turn:turn.movmash.com:3478?transport=tcp",
        "turns:turn.movmash.com:5349?transport=tcp",
      ],
      username: "movmash",
      credential: "movmash@123",
    },
  ],
};

export default turnConfig;