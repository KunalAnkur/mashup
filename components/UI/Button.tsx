import { ReactNode, ButtonHTMLAttributes } from "react";
import { button } from "./config";
type Props = {
  name: string;
  icon?: ReactNode;
  className?: string;
  style?: "general" | "primary" | "secondary";
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
      className={`flex items-center  text-sm gap-2 w-fit font-semibold rounded-lg   ${
        button.styles[style as keyof typeof button.styles]
      }  ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{name}</span>
    </button>
  );
};

export default Button;
