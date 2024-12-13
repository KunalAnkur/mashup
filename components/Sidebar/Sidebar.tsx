import "react-icons/lu";
import Header from "./Header";
import Content from "./Content";

const Sidebar = () => {
  return (
    <div className=" h-full p-4  ">
      <div className="h-full w-[230px] p-4 font-semibold text-sm bg-secondaryDark rounded-lg flex flex-col gap-6">
        <Header />
        <Content />
      </div>
    </div>
  );
};

export default Sidebar;
