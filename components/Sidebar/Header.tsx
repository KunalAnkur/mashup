/* only logo */

import { LuChevronLeft } from "react-icons/lu";
import { Logo } from "../UI";

const Header = () => {
  return (
    <div className="flex justify-between items-center hover:opacity-50 ">
      <Logo size="md" href="/" />
      <button className="" onClick={() => window.history.back()}>
        <LuChevronLeft size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Header;
