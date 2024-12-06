import * as constants from "../constants";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  brandName?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "md",
  href = "/",
  brandName = constants.seo.BRAND_NAME,
  showText = true,
}) => {
  const sizeClasses = {
    sm: {
      image: "w-5 h-5",
      text: "text-sm",
      container: "gap-2",
    },
    md: {
      image: "w-10 h-10",
      text: "text-lg",
      container: "gap-3",
    },
    lg: {
      image: "w-16 h-16",
      text: "text-xl",
      container: "gap-4",
    },
  };

  return (
    <Link
      href={href}
      className={`
        inline-flex 
        items-center 
        ${sizeClasses[size].container}
        hover:opacity-80 
        transition-opacity 
        duration-300
      `}
    >
      <div
        className={`
          relative 
          ${sizeClasses[size].image}
        `}
      >
        <Image
          src={constants.assets.logo}
          alt="Logo"
          fill
          className="object-contain"
        />
      </div>

      {showText && (
        <span
          className={`
          font-bold 
          text-white
          ${sizeClasses[size].text}
        `}
        >
          {brandName}
        </span>
      )}
    </Link>
  );
};

export default Logo;
