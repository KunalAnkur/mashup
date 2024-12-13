import Image from "next/image";
import { useState } from "react";
import * as constants from "../../constants";

type Props = {
  url?: string;
  alt: string;
  size: number; // Use size instead of separate width and height
  className?: string;
  onClick?: () => void;
};

const Avatar = ({ url, alt, size, className, onClick }: Props) => {
  const [source, setSource] = useState(url || constants.assets.defaultAvatar);

  const handleOnError = () => {
    setSource(constants.assets.defaultAvatar);
  };

  return (
    <div
      className={`rounded-full overflow-hidden ${className}`}
      onClick={onClick}
    >
      <Image
        src={source}
        alt={alt}
        width={size}
        height={size}
        onError={handleOnError}
        className="object-cover"
      />
    </div>
  );
};

export default Avatar;
