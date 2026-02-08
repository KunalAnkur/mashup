import Image from "next/image";
import Logo from "./Logo";

type Props = {
  title: string;
};

const AuthHeader = ({ title }: Props) => {
  return (
    <header className="flex flex-col items-center justify-center gap-4">
      <Logo width={70} height={70} custom={true} />
      <h1 className="text-3xl text-center font-bold text-white">{title}</h1>
    </header>
  );
};

export default AuthHeader;
