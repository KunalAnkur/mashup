import { InputHTMLAttributes } from "react";

type Props = {
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const Input = ({ placeholder, type, className, icon, ...rest }: Props) => {
  return (
    <div className=" h-fit px-3 py-1.5 flex gap-2 items-center  bg-secondaryDark rounded-md w-fit text-sm  text-smoothWhite ">
      <span>{icon}</span>
      <input
        {...rest}
        type={type}
        placeholder={placeholder}
        className={` ${className} border-none outline-none bg-transparent placeholder:text-smoothWhite text-white `}
      />
    </div>
  );
};

export default Input;
