"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useRoomContext, UserInfo } from "@/context/RoomContext";
import { FaCrown, FaUserShield } from "react-icons/fa";
import Avatar from "../UI/Avatar";

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

const PeopleTab = () => {
  const { participants } = useRoomContext();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Get avatar URL helper
  const getAvatarUrl = (user: UserInfo) => {
    if (user.profile) {
      return user.profile;
    }
    const displayName = user.name || user.username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=random&color=fff&size=200`;
  };

  // Filter participants - put host first, then current user, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.host) return -1;
    if (b.host) return 1;
    if (a.username === currentUser?.username || a.email === currentUser?.email) return -1;
    if (b.username === currentUser?.username || b.email === currentUser?.email) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full w-full gap-3 md:gap-4">
      {/* Participants List */}
      <div className="flex-1 flex flex-col gap-2 md:gap-3 overflow-y-auto pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex items-center gap-1.5 md:gap-2 mb-2 px-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-full">
            {sortedParticipants.length} {sortedParticipants.length === 1 ? 'Participant' : 'Participants'}
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {sortedParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 flex items-center justify-center mb-3 md:mb-4">
              <FaUserShield className="text-white/50" size={20} />
            </div>
            <p className="text-white/70 text-xs md:text-sm font-medium">No participants yet</p>
            <p className="text-white/50 text-[10px] md:text-xs mt-1">Waiting for others to join...</p>
          </div>
        ) : (
          sortedParticipants.map((participant, index) => {
            const displayName = participant.username || participant.name || "User";
            const userColor = getUserColor(displayName);
            const isCurrentUser =
              participant.username === currentUser?.username ||
              participant.email === currentUser?.email;

          return (
            <div
              key={participant.socketId}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Glow effect on hover */}
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${userColor.bg} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              {/* Card */}
              <div className="relative bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:border-purple-500/30">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Avatar with enhanced styling */}
                  <div className="relative flex-shrink-0">
                    {/* Avatar glow */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${userColor.bg} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300`}></div>
                    
                    {/* Avatar border */}
                    <div className={`relative rounded-full p-0.5 bg-gradient-to-br ${userColor.bg} ${isCurrentUser ? 'ring-2 ring-rose-500/50' : ''}`}>
                      <Avatar
                        url={getAvatarUrl(participant)}
                        alt={displayName}
                        size={40}
                        isDefault={true}
                        className="md:w-12 md:h-12"
                      />
                    </div>
                    
                    {/* Host crown badge */}
                    {participant.host && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 rounded-full p-1 md:p-1.5 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-500/20">
                        <FaCrown className="text-white" size={10} />
                      </div>
                    )}
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg"></div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2.5 flex-wrap">
                      <span
                        className={`font-bold text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient} truncate`}
                      >
                        {displayName}
                      </span>
                      
                      {isCurrentUser && (
                        <span className="px-1.5 md:px-2 py-0.5 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full text-rose-300 text-[9px] md:text-[10px] font-semibold uppercase tracking-wide">
                          You
                        </span>
                      )}
                      
                      {participant.host && (
                        <span className="px-1.5 md:px-2 py-0.5 bg-gradient-to-r from-yellow-500/25 via-amber-500/25 to-yellow-500/25 rounded-full text-yellow-300 text-[9px] md:text-[10px] font-semibold uppercase tracking-wide shadow-lg shadow-yellow-500/10">
                          Host
                        </span>
                      )}
                    </div>
                    
                    {participant.email && (
                      <div className="flex items-center gap-1 md:gap-1.5 mt-1 md:mt-1.5">
                        <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/40"></div>
                        <p className="text-white/60 text-[10px] md:text-xs truncate font-medium">
                          {participant.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default PeopleTab;
