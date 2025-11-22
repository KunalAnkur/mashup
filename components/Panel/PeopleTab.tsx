"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { FaCrown, FaUserShield } from "react-icons/fa";
import Avatar from "../UI/Avatar";

// Generate consistent color for a username (same as ChatTab)
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

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Mock data - replace with real participants from socket/API
const mockParticipants = [
  {
    id: "1",
    name: "You",
    email: "you@example.com",
    isHost: true,
    hasRemote: false,
  },
  {
    id: "2",
    name: "ankurkunal",
    email: "ankur@example.com",
    isHost: false,
    hasRemote: false,
  },
  {
    id: "3",
    name: "maria_s",
    email: "maria@example.com",
    isHost: false,
    hasRemote: true,
  },
  {
    id: "4",
    name: "jake_doe",
    email: "jake@example.com",
    isHost: false,
    hasRemote: false,
  },
];

const PeopleTab = () => {
  const host = useSelector((state: RootState) => state.room.host);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Get avatar URL helper
  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=fff&size=200`;
  };

  // Handle giving remote control to a user (host only)
  const handleGiveRemote = (userId: string) => {
    if (host) {
      // TODO: Emit socket event to give remote control
      console.log("Giving remote control to user:", userId);
    }
  };

  // Filter participants - put host first, then current user, then others
  const sortedParticipants = [...mockParticipants].sort((a, b) => {
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    if (a.name === "You" || a.name === currentUser?.name) return -1;
    if (b.name === "You" || b.name === currentUser?.name) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Participants List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex items-center gap-2 mb-1 px-1">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Participants ({sortedParticipants.length})
          </h3>
        </div>

        {sortedParticipants.map((participant) => {
          const userColor = getUserColor(participant.name);
          const isCurrentUser =
            participant.name === "You" ||
            participant.name === currentUser?.name;

          return (
            <div
              key={participant.id}
              className="group bg-gradient-to-br from-[#1f1f23] to-[#27272a] border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all duration-200 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    url={getAvatarUrl(participant.name)}
                    alt={participant.name}
                    size={40}
                    isDefault={true}
                  />
                  {participant.isHost && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-1 shadow-lg">
                      <FaCrown className="text-white" size={10} />
                    </div>
                  )}
                  {participant.hasRemote && (
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full p-1 shadow-lg">
                      <FaUserShield className="text-white" size={10} />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient} truncate`}
                    >
                      {participant.name}
                      {isCurrentUser && (
                        <span className="text-gray-500 ml-1">(You)</span>
                      )}
                    </span>
                    {participant.isHost && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-medium">
                        Host
                      </span>
                    )}
                    {participant.hasRemote && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-full text-rose-400 text-xs font-medium">
                        Remote
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate mt-0.5">
                    {participant.email}
                  </p>
                </div>

                {/* Give Remote Button (Host only, not for self) */}
                {host && !participant.isHost && !isCurrentUser && (
                  <button
                    onClick={() => handleGiveRemote(participant.id)}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/50 rounded-lg transition-all duration-200 group"
                    title="Give remote control"
                  >
                    <FaUserShield
                      className="text-gray-400 group-hover:text-rose-400"
                      size={14}
                    />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default PeopleTab;
