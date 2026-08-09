import { dashAvatarChipClass, dashAvatarChipCompactClass } from "../UI/classTokens";

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
};

const SidebarAvatarChip = ({ name, photoUrl, compact = false }: SidebarAvatarChipProps) => (
  <span className={compact ? dashAvatarChipCompactClass : dashAvatarChipClass}>
    {photoUrl ? (
      <img
        src={photoUrl}
        alt={name}
        className={`h-full w-full object-cover ${compact ? "rounded-[8px]" : "rounded-[10px]"}`}
      />
    ) : (
      getInitials(name)
    )}
  </span>
);

export default SidebarAvatarChip;
