"use client";

import { LuCrown } from "react-icons/lu";
import Avatar from "@/components/UI/Avatar";

const participantCardClass =
  "relative overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] px-3 py-3";
const currentUserBadgeClass =
  "inline-flex items-center whitespace-nowrap rounded-full bg-rose-400/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-rose-200";
const hostBadgeClass =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-amber-200";

type ParticipantCardProps = {
  avatarAccentClass: string;
  avatarUrl: string;
  delayMs: number;
  displayName: string;
  hostLabel: string;
  isCurrentUser: boolean;
  isHost: boolean;
  youLabel: string;
};

const ParticipantCard = ({
  avatarAccentClass,
  avatarUrl,
  delayMs,
  displayName,
  hostLabel,
  isCurrentUser,
  isHost,
  youLabel,
}: ParticipantCardProps) => {
  return (
    <div
      className={`${participantCardClass} animate-fade-in`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`relative rounded-full bg-gradient-to-br p-[1px] opacity-85 ${avatarAccentClass}`}>
            <Avatar
              url={avatarUrl}
              alt={displayName}
              size={32}
              isDefault={true}
              className="pointer-events-none h-8 w-8"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <p
              className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/[0.84]"
              title={displayName}
              aria-label={displayName}
            >
              {displayName}
            </p>

            {isCurrentUser || isHost ? (
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {isCurrentUser ? (
                  <span className={currentUserBadgeClass}>
                    {youLabel}
                  </span>
                ) : null}

                {isHost ? (
                  <span className={hostBadgeClass}>
                    <LuCrown size={10} />
                    {hostLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
