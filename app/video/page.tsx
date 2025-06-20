"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type ReactPlayer from "react-player";
import { useVideoSync } from "@/hooks/useVideoSync"; // adjust path if needed

const Player = dynamic(() => import("@/components/VideoPlayer/Player"), {
  ssr: false,
});

const Page = () => {
  // const [videoUrl, setVideoUrl] = useState<string | string[]>(['https://www.youtube.com/watch?v=oY8pxDSJhgc', 'https://www.youtube.com/watch?v=sElE_BfQ67s']);
  const [videoUrl, setVideoUrl] = useState<string | string[]>('https://www.youtube.com/watch?v=sElE_BfQ67s');
  const [isHost, setIsHost] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const [input, setInput] = useState<string>('');
  // ⬇️ use the custom hook
  const {
    onPlay,
    onPause,
    onSeeked,
    isPlaying,
    joinRoom,
  } = useVideoSync({ playerRef, isHost });

  const handleHost = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsHost(e.target.checked);
  };

  const handleOnVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      console.log('Video URL:', url);
      setVideoUrl(url);
    }
  };

  const handleJoinRoom = () => {
    joinRoom("my-room", isHost, "random"); // Room ID can be dynamic
  };

  return (
    <div className="h-screen bg-[#030712] text-amber-50 flex flex-col gap-4 items-center justify-center">
      <Player
        playerRef={playerRef}
        url={videoUrl}
        playing={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onSeekEnd={onSeeked}
        // loop={true}
      />

      <input
        onChange={handleOnVideoChange}
        type="file"
        accept="video/*,audio/*,.mp4,.mp3,.mkv,.webm,.3gp,.avi,.mpeg,.mpg,.ogg,.wmv,.wav,.mov"
        multiple
      />

      <label className="flex items-center gap-2">
        <input type="checkbox" onChange={handleHost} />
        Host
      </label>

      <button onClick={handleJoinRoom}>Join Room</button>
      <input
        type="text"
        className="text-black"
        value={input} // <-- bind the value to state
        onChange={(e) => {
          setInput(e.target.value)
        }}
        placeholder="Paste URL"
      />
      <button onClick={() => setVideoUrl(input)}>Change video</button>
    </div>
  );
};

export default Page;