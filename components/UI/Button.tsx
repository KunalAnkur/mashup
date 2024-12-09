import { ReactNode, ButtonHTMLAttributes } from "react";
import { button } from "./config";
type Props = {
  name: string;
  icon?: ReactNode;
  className?: string;
  style?: "general" | "party" | "gradientBtn";
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({
  name,
  icon,
  className,
  style = "general",
  ...rest
}: Props) => {
  return (
    <button
      {...rest}
      className={`flex items-center ${
        button.styles[style as keyof typeof button.styles]
      } ${className}`}
    >
      <div className={`flex items-center text-sm gap-2 `}>
        {icon && <span>{icon}</span>}
        <span className="text-sm">{name}</span>
      </div>
    </button>
  );
};

export default Button;
