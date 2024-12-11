import "react-icons/lu";
import Header from "./Header";
import Content from "./Content";

const Sidebar = () => {
  return (
    <div className="font-semibold text-sm w-[230px] h-full bg-secondaryDark rounded-lg p-4 flex flex-col gap-6">
      <Header />
      <Content />
    </div>
  );
};

export default Sidebar;
