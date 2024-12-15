import Image from "next/image";

type Props = {
  title: string;
};

const AuthHeader = ({ title }: Props) => {
  return (
    <header className="flex flex-col items-center justify-center gap-8">
      <Image src={"/assets/logo.svg"} alt="logo" width={70} height={70} />
      <h1 className="text-3xl text-center font-bold text-white">{title}</h1>
    </header>
  );
};

export default AuthHeader;
