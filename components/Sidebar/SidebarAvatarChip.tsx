import { useState } from "react";
import {
  dashAvatarChipClass,
  dashAvatarChipCompactClass,
  dashAvatarChipLargeClass,
} from "../UI/classTokens";

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

type SidebarAvatarChipProps = {
  name: string;
  photoUrl?: string | null;
  compact?: boolean;
  large?: boolean;
};

const SidebarAvatarChip = ({ name, photoUrl, compact = false, large = false }: SidebarAvatarChipProps) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const shapeClass = large ? dashAvatarChipLargeClass : compact ? dashAvatarChipCompactClass : dashAvatarChipClass;
  const showPhoto = !!photoUrl && !photoFailed;

  return (
    // Real photos (Google's own avatars are effectively circular, often with transparent
    // corners in their square source file) get forced into a true circle + overflow-hidden
    // — our normal rounded-square chip shape would let the brand-gradient bg peek through
    // those transparent corners. `!` is required to beat the shared token's own
    // rounded-[Npx]/bg-secondary, same reasoning as dashLoginPopoverOverrideClass.
    <span className={showPhoto ? `${shapeClass} !rounded-full !bg-none overflow-hidden` : shapeClass}>
      {showPhoto ? (
        <img
          src={photoUrl as string}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};

export default SidebarAvatarChip;
