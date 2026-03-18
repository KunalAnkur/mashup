import { InputHTMLAttributes } from "react";
import { input } from "./config";
import { FaCircleCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { IoEye, IoEyeOff } from "react-icons/io5";

type Props = {
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
  label?: string;
  isChecked?: boolean;
  isPassword?: boolean;
  showPassword?: boolean;
  style?: "general" | "auth";
  onTogglePassword?: () => void; // To handle password visibility toggle
} & InputHTMLAttributes<HTMLInputElement>;

const Input = ({
  placeholder,
  type = "text",
  className = "",
  icon,
  isChecked,
  isPassword = false,
  showPassword = false,
  style = "general",
  label,
  onTogglePassword,
  ...rest
}: Props) => {
  const wrapperClass =
    style === "auth" ? "flex flex-col gap-1" : "inline-block";
  const inputWrapperClass = `h-fit px-3 py-1.5 flex gap-2 items-center rounded-md text-sm text-smoothWhite ${
    input.styles[style as keyof typeof input.styles]
  }`;
  const inputClass =
    "border-none text-base outline-none bg-transparent placeholder:text-smoothWhite text-white w-full ";

  const renderValidationIcon = () => {
    if (style === "auth" && !isPassword) {
      return isChecked ? (
        <FaCircleCheck
          size={16}
          className="text-green-500 bg-white rounded-full overflow-hidden    "
        />
      ) : (
        <RxCross2
          size={16}
          strokeWidth={1.5}
          className="text-white bg-red-500 rounded-full p-0.5"
        />
      );
    }
    return null;
  };

  const renderPasswordToggle = () => {
    if (style === "auth" && isPassword) {
      return (
        <button type="button" onClick={onTogglePassword}>
          {showPassword ? (
            <IoEye size={20} color="white" />
          ) : (
            <IoEyeOff size={20} color="white" />
          )}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className={wrapperClass}>
        {style === "auth" && label && (
          <label className="text-xs text-white">{label}</label>
        )}
        <div className={inputWrapperClass}>
          {style === "general" && icon && <span>{icon}</span>}
          <input
            {...rest}
            type={isPassword && showPassword ? "text" : type}
            placeholder={placeholder}
            className={`${inputClass} ${className}`}
          />

          {renderValidationIcon()}
          {renderPasswordToggle()}
        </div>
      </div>
      {!isChecked && style === "auth" && label === "Username" && (
        <span className="text-[9px] text-smoothWhite text-right">
          This username is already taken.
        </span>
      )}
      {!isChecked && style === "auth" && label === "Email" && (
        <span className="text-[9px] text-smoothWhite text-right">
          Please enter a valid email address.
        </span>
      )}
    </div>
  );
};

export default Input;
