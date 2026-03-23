import { UserColor } from "./types";
import { chatMessageAvatarBaseClass, chatMessageAvatarImageClass } from "./styles";

interface UserAvatarProps {
  displayUserName: string;
  userProfile?: string;
  userColor: UserColor;
  isCurrentUser: boolean;
}

export const UserAvatar = ({
  displayUserName,
  userProfile,
  userColor,
  isCurrentUser,
}: UserAvatarProps) => {
  return (
    <div className="relative">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

      {userProfile ? (
        <>
          <img
            src={userProfile}
            alt={displayUserName}
            className={chatMessageAvatarImageClass}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className={`${chatMessageAvatarBaseClass} hidden bg-gradient-to-br ${userColor.bg}`}
          >
            {displayUserName.charAt(0).toUpperCase()}
          </div>
        </>
      ) : (
        <div
          className={`relative ${chatMessageAvatarBaseClass} bg-gradient-to-br ${userColor.bg} ring-2 ring-white/5`}
        >
          {displayUserName.charAt(0).toUpperCase()}
        </div>
      )}

      {!isCurrentUser && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-[#18181b] rounded-full shadow-lg">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
      )}
    </div>
  );
};

// Made with Bob
