"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useRoomContext, UserInfo } from "@/context/RoomContext";
import { LuUsers } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import ParticipantCard from "./PeopleTab/ParticipantCard";

const DEFAULT_DISPLAY_NAME = "User";
const countBadgeClass =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-white/[0.38]";
const emptyStateClass =
  "relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] px-4 py-10";

const USER_COLORS = [
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
] as const;

type CurrentUserIdentity = {
  username?: string | null;
  email?: string | null;
} | null | undefined;

const getUserColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

const getDisplayName = (user: Pick<UserInfo, "name" | "username">) =>
  user.username || user.name || DEFAULT_DISPLAY_NAME;

const getAvatarUrl = (user: UserInfo) => {
  if (user.profile) {
    return user.profile;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    getDisplayName(user)
  )}&background=random&color=fff&size=200`;
};

const isCurrentParticipant = (user: UserInfo, currentUser: CurrentUserIdentity) => {
  const usernameMatches =
    Boolean(currentUser?.username) && user.username === currentUser.username;
  const emailMatches = Boolean(currentUser?.email) && user.email === currentUser.email;

  return usernameMatches || emailMatches;
};

const getParticipantKey = (participant: UserInfo, index: number) =>
  participant.socketId || participant.email || `${getDisplayName(participant)}-${index}`;

const sortParticipants = (participants: UserInfo[], currentUser: CurrentUserIdentity) =>
  [...participants].sort((a, b) => {
    if (a.host) return -1;
    if (b.host) return 1;
    if (isCurrentParticipant(a, currentUser)) return -1;
    if (isCurrentParticipant(b, currentUser)) return 1;
    return 0;
  });

const PeopleTab = () => {
  const { participants } = useRoomContext();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const t = useTranslations("panel.people");
  const tCommon = useTranslations("common");
  const sortedParticipants = sortParticipants(participants, currentUser);
  const participantCountLabel =
    sortedParticipants.length === 1 ? t("participant") : t("participants");

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="space-y-3 pb-2">
          <div className="flex justify-center px-1">
            <span className={countBadgeClass}>
              {sortedParticipants.length} {participantCountLabel}
            </span>
          </div>

          {sortedParticipants.length === 0 ? (
            <div className={emptyStateClass}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.06),transparent_24%)]" />
              <div className="relative flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-white/[0.42]">
                  <LuUsers size={20} />
                </div>
                <p className="text-sm font-medium text-white/[0.78]">{t("noParticipants")}</p>
                <p className="mt-1 text-xs text-white/[0.42]">{t("waitingForOthers")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedParticipants.map((participant, index) => {
                const displayName = getDisplayName(participant);
                const userColor = getUserColor(displayName);
                const isCurrentUser = isCurrentParticipant(participant, currentUser);

                return (
                  <ParticipantCard
                    key={getParticipantKey(participant, index)}
                    avatarAccentClass={userColor.bg}
                    avatarUrl={getAvatarUrl(participant)}
                    delayMs={index * 45}
                    displayName={displayName}
                    hostLabel={tCommon("host")}
                    isCurrentUser={isCurrentUser}
                    isHost={participant.host}
                    youLabel={tCommon("you")}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default PeopleTab;
