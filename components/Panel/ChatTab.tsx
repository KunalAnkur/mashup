"use client";

import { useState } from "react";
import {
  FaSmile,
  FaSadTear,
  FaLaughSquint,
  FaSurprise,
  FaHeart,
  FaGrinHearts,
} from "react-icons/fa";

const ChatTab = () => {
  const [showEmojis, setShowEmojis] = useState(false);
  const messages = [
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:22 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:33 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:35 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:38 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:40 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:42 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:45 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:47 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:50 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:52 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "10:55 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "10:57 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-sky-400",
      time: "11:00 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "11:02 PM",
    },
    {
      user: "ankurkunal",
      text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      color: "text-red-400",
      time: "11:05 PM",
    },
  ];

  /*  const videoParticipants = [
    { name: "Chloe", avatar: "C", active: true },
    { name: "Alex", avatar: "A", active: true },
    { name: "David", avatar: "D", active: true },
    { name: "Marco", avatar: "M", active: false },
  ]; */

  return (
    <div className="flex flex-col h-full w-full gap-2">
      {/* Video Grid Area */}
      {/* <div className="grid grid-cols-2 gap-3">
        {videoParticipants.map((participant, i) => (
          <div
            key={i}
            className="bg-zinc-800 rounded-lg flex flex-col items-start justify-end p-3 h-32 relative overflow-hidden"
          >
            {participant.active ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20"></div>
                <div className="relative z-10 bg-zinc-900/80 px-2 py-1 rounded text-white text-xs font-medium">
                  {participant.name}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-gray-600 text-2xl mb-2">🔇</div>
                <span className="text-gray-400 text-sm">
                  {participant.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div> */}
      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 ">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-600 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {msg.user.charAt(0).toUpperCase()}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0 ">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-bold text-sm ${msg.color}`}>
                  {msg.user}
                </span>
                <span className="text-gray-500 text-xs">{msg.time}</span>
              </div>
              <p className="text-white/70 text-sm  break-words">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* System Message Example */}
        <div className="flex justify-center my-2">
          <span className="text-gray-500 text-xs">
            Marco has joined the party.
          </span>
        </div>
      </div>

      {/* Emoji Bar (shown when emoji button clicked) */}
      {showEmojis && (
        <div className="flex gap-2 bg-zinc-800 p-3 w-full rounded-lg overflow-x-auto">
          <FaSmile
            size={30}
            className="text-2xl text-yellow-400 cursor-pointer"
          />
          <FaSadTear
            size={30}
            className="text-2xl text-blue-400 cursor-pointer"
          />
          <FaLaughSquint
            size={30}
            className="text-2xl text-yellow-300 cursor-pointer"
          />
          <FaSurprise
            size={30}
            className="text-2xl text-pink-400 cursor-pointer"
          />
          <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
          <FaGrinHearts
            size={30}
            className="text-2xl text-pink-500 cursor-pointer"
          />
          <FaSurprise
            size={30}
            className="text-2xl text-pink-400 cursor-pointer"
          />
          <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
          <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
          <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2 bg-zinc-700 rounded-xl px-3 py-2.5">
        <input
          type="text"
          placeholder="Send a message..."
          className="flex-1 bg-transparent outline-none text-white/70 text-sm placeholder:text-white/50"
        />
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="text-gray-400 hover:text-gray-300 transition"
        >
          <FaSmile size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;
