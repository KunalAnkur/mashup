import Image from "next/image";
import logo from "../public/assets/logo.png";
const page = () => {
  return (
    <div className="bg-secondaryDark hover:bg-hover text-white">
      <div>Hello world</div>
      <Image src={logo} alt="logo" />
    </div>
  );
};

export default page;
