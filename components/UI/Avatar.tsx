"use client";
import { useState } from "react";

type Props = {
  url?: string;
  alt: string;
  size: number;
  className?: string;
  isDefault?: boolean; // renamed from 'default'
  onClick?: () => void;
};

const Avatar = ({ url, alt, size, className, onClick }: Props) => {
  const defaultAvatar = "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211471.png";
  const [source, setSource] = useState(url || defaultAvatar);

  const handleOnError = () => {
    setSource(defaultAvatar);
  };

  return (
    <div
      className={`rounded-full overflow-hidden ${className || ""}`}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        cursor: onClick ? "pointer" : "default",
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
};

export default Avatar;
