import { ReactNode, ButtonHTMLAttributes } from "react";
import { button } from "./config";
type Props = {
  name: string;
  icon?: ReactNode;

  className?: string;
  style?: "sidebar" | "general" | "party";
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
      className={`flex items-center p-3 border ${
        button.styles[style as keyof typeof button.styles]
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span>{name}</span>
      </div>
    </button>
  );
};

export default Button;
