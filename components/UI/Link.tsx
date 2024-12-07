import { ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";
import { link } from "./config";
import Link from "next/link";
type Props = {
  name: string;
  icon?: ReactNode;
  hasDropdown?: boolean;
  className?: string;
  style?: "sidebar" | "general";
  url: string;
};

const LinkComp = ({
  name,
  icon,
  url,
  className,
  hasDropdown = false,
  style = "general",
}: Props) => {
  return (
    <Link
      href={url}
      className={` flex items-center p-3  ${
        link.styles[style as keyof typeof link.styles]
      } ${className}`}
    >
      <div className="flex items-center gap-2 ">
        {icon && <span>{icon}</span>}
        <span>{name}</span>
      </div>
      {hasDropdown && (
        <span className="">
          <FaChevronDown />
        </span>
      )}
    </Link>
  );
};

export default LinkComp;
