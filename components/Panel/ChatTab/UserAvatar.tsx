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
          className={`relative ${chatMessageAvatarBaseClass} bg-gradient-to-br ${userColor.bg}`}
        >
          {displayUserName.charAt(0).toUpperCase()}
        </div>
      )}

      {!isCurrentUser && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-400 border-2 border-[#18181b] rounded-full" />
      )}
    </div>
  );
};
