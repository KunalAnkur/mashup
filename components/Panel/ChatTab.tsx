"use client";

import { useState } from "react";
import {
  FaSmile,
  FaSadTear,
  FaLaughSquint,
  FaSurprise,
  FaHeart,
  FaGrinHearts,
  FaArrowCircleUp,
} from "react-icons/fa";

// Generate consistent color for a username
const getUserColor = (username: string) => {
  const colors = [
    {
      gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
      bg: "from-rose-500 via-pink-500 to-fuchsia-500",
    },
    {
      gradient: "from-blue-400 via-cyan-400 to-teal-400",
      bg: "from-blue-500 via-cyan-500 to-teal-500",
    },
    {
      gradient: "from-purple-400 via-indigo-400 to-blue-400",
      bg: "from-purple-500 via-indigo-500 to-blue-500",
    },
    {
      gradient: "from-emerald-400 via-green-400 to-teal-400",
      bg: "from-emerald-500 via-green-500 to-teal-500",
    },
    {
      gradient: "from-orange-400 via-amber-400 to-yellow-400",
      bg: "from-orange-500 via-amber-500 to-yellow-500",
    },
    {
      gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
      bg: "from-violet-500 via-purple-500 to-fuchsia-500",
    },
    {
      gradient: "from-cyan-400 via-blue-400 to-indigo-400",
      bg: "from-cyan-500 via-blue-500 to-indigo-500",
    },
    {
      gradient: "from-pink-400 via-rose-400 to-red-400",
      bg: "from-pink-500 via-rose-500 to-red-500",
    },
  ];

  // Simple hash function to get consistent color for same username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ChatTab = () => {
  const [showEmojis, setShowEmojis] = useState(false);
  const currentUser = "You"; // This would come from auth state
  const messages = [
    {
      user: "ankurkunal",
      text: "Hey everyone! This video is amazing!",
      time: "10:22 PM",
      isCurrentUser: false,
    },
    {
      user: "You",
      text: "I totally agree! The cinematography is stunning.",
      time: "10:25 PM",
      isCurrentUser: true,
    },
    {
      user: "maria_s",
      text: "Can we pause at 15:30? I need to grab some snacks 🍿",
      time: "10:28 PM",
      isCurrentUser: false,
    },
    {
      user: "You",
      text: "Sure thing! Just let me know when you're back.",
      time: "10:29 PM",
      isCurrentUser: true,
    },
    {
      user: "ankurkunal",
      text: "No problem, take your time!",
      time: "10:30 PM",
      isCurrentUser: false,
    },
    {
      user: "jake_doe",
      text: "This is my first time watching this. So excited!",
      time: "10:32 PM",
      isCurrentUser: false,
    },
    {
      user: "sarah_m",
      text: "The soundtrack is incredible! 🎵",
      time: "10:35 PM",
      isCurrentUser: false,
    },
    {
      user: "You",
      text: "Right? I've been listening to it on repeat!",
      time: "10:36 PM",
      isCurrentUser: true,
    },
    {
      user: "alex_t",
      text: "Can someone explain what happened at 20:15?",
      time: "10:38 PM",
      isCurrentUser: false,
    },
  ];

  /*  const videoParticipants = [
    { name: "Chloe", avatar: "C", active: true },
    { name: "Alex", avatar: "A", active: true },
    { name: "David", avatar: "D", active: true },
    { name: "Marco", avatar: "M", active: false },
  ]; */

  return (
    <div className="flex flex-col h-full w-full gap-3">
      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          const isCurrentUser = msg.isCurrentUser || msg.user === currentUser;
          const userColor = getUserColor(msg.user);
          return (
            <div
              key={i}
              className="flex items-start gap-2 group animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Avatar - Show for all users */}
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg bg-gradient-to-br ${userColor.bg}`}
                >
                  {msg.user.charAt(0).toUpperCase()}
                </div>
                {!isCurrentUser && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#18181b] rounded-full"></div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}
                  >
                    {msg.user}
                  </span>
                  <span className="text-gray-500 text-xs">{msg.time}</span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 transition-all duration-200 rounded-tl-none ${
                    isCurrentUser
                      ? `bg-gradient-to-br from-rose-600/20 via-pink-600/20 to-fuchsia-600/20`
                      : "bg-gradient-to-br from-white/5 to-white/[0.02]"
                  }`}
                >
                  <p className="text-white/90 text-sm leading-relaxed break-words">
                    {msg.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Join Notification */}
        <div className="flex justify-center py-2">
          <div className="bg-white/5 rounded-full px-4 py-1.5">
            <span className="text-gray-400 text-xs">
              <span
                className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${
                  getUserColor("Marco").gradient
                }`}
              >
                Marco
              </span>{" "}
              has joined the party
            </span>
          </div>
        </div>
      </div>

      {/* Emoji Bar */}
      {showEmojis && (
        <div className="flex gap-2 bg-gradient-to-br from-[#1f1f23] to-[#27272a] p-2 rounded-xl overflow-x-auto scrollbar-hide animate-slide-up">
          {[
            { icon: FaSmile, color: "text-yellow-400" },
            { icon: FaSadTear, color: "text-blue-400" },
            { icon: FaLaughSquint, color: "text-yellow-300" },
            { icon: FaSurprise, color: "text-pink-400" },
            { icon: FaHeart, color: "text-red-500" },
            { icon: FaGrinHearts, color: "text-pink-500" },
          ].map((emoji, i) => {
            const Icon = emoji.icon;
            return (
              <button
                key={i}
                className={`p-2 rounded-xl bg-white/5 hover:bg-white/10  transition-all duration-200 hover:scale-110 ${emoji.color}`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-1 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl px-3  py-1 shadow-lg">
        <input
          type="text"
          placeholder="Send a message..."
          className="flex-1 bg-transparent outline-none text-white/90 text-sm placeholder:text-gray-500"
        />
        <button
          onClick={() => console.log("send button triggered")}
          className=" p-2 rounded-lg text-gray-400 hover:text-pink-400 hover:bg-white/5 transition-all duration-200"
        >
          <FaArrowCircleUp size={20} />
        </button>
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            showEmojis
              ? "text-pink-400 bg-pink-500/10 "
              : "text-gray-400 hover:text-pink-400 hover:bg-white/5"
          }`}
        >
          <FaSmile size={20} />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ChatTab;
