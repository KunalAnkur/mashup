/* only logo */

import { LuChevronLeft } from "react-icons/lu";
import { Logo } from "../UI";

const Header = () => {
  return (
    <div className="flex justify-between items-center hover:opacity-95">
      <Logo size="md" href="/" />
      <button
        className="hover:bg-hover p-1 rounded-md"
        onClick={() => window.history.back()} //goes back.
      >
        <LuChevronLeft size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Header;
