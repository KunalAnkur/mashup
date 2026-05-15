"use client";
import { useState } from "react";

type Props = {
  url?: string;
  alt: string;
  size: number;
  className?: string;
  isDefault?: boolean;
  isPremium?: boolean;
  onClick?: () => void;
};

const Avatar = ({ url, alt, size, className, isPremium, onClick }: Props) => {
  const defaultAvatar = "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211471.png";
  const [source, setSource] = useState(url || defaultAvatar);

  const handleOnError = () => {
    setSource(defaultAvatar);
  };

  const img = (
    <div
      className={`rounded-full overflow-hidden ${!isPremium ? className || "" : ""}`}
      onClick={!isPremium ? onClick : undefined}
      style={{
        width: size,
        height: size,
        cursor: onClick && !isPremium ? "pointer" : undefined,
      }}
    >
      <img
        src={source}
        alt={alt}
        width={size}
        height={size}
        onError={handleOnError}
        className="object-cover rounded-full"
      />
    </div>
  );

  if (!isPremium) return img;

  // Premium ring wrapper — 2px rose/fuchsia gradient border
  const ringPad = 2;
  return (
    <div
      className={`rounded-full p-[2px] bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 ${className || ""}`}
      onClick={onClick}
      style={{
        width: size + ringPad * 2,
        height: size + ringPad * 2,
        cursor: onClick ? "pointer" : undefined,
        flexShrink: 0,
      }}
    >
      <div className="rounded-full overflow-hidden w-full h-full">
        <img
          src={source}
          alt={alt}
          width={size}
          height={size}
          onError={handleOnError}
          className="object-cover rounded-full w-full h-full"
        />
      </div>
    </div>
  );
};

export default Avatar;
