import { useState } from "react";
import { LinkComp, Logo, Separator } from "../UI";
import { HiHome } from "react-icons/hi";
import { sidebarLinks } from "./config/sidebar";
import { LuChevronLeft, LuGlobe, LuRadio } from "react-icons/lu";
import { MdFeedback } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";

const Sidebar = () => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const handleLinkClick = (name: string) => {
    setSelectedLink(name);
  };

  return (
    <div className="font-semibold text-sm w-[230px] h-full bg-secondaryDark rounded-lg p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-2">
        {/* LOGO */}
        <div className="flex justify-between items-center mb-4">
          <Logo size="sm" href="/" />
          <LuChevronLeft size={20} strokeWidth={3} />
        </div>
        {/* HOME LINK + Separator */}
        <LinkComp
          name="Home"
          icon={<HiHome size={20} />}
          style="sidebar"
          isSelected={selectedLink === "Home"}
          onClick={() => handleLinkClick("Home")}
        />
        <Separator />
        {/* CREATE PARTY LINKS + Separator */}
        <div className="flex flex-col gap-2">
          <LinkComp
            name="Create Party"
            style="sidebar"
            icon={<LuRadio size={20} strokeWidth={2} />}
            isSelected={selectedLink === "Create Party"}
            onClick={() => handleLinkClick("Create Party")}
          />
          {sidebarLinks.map((link) => (
            <LinkComp
              key={link.name}
              name={link.name}
              style="sidebar"
              className="pl-8"
              isSelected={selectedLink === link.name}
              onClick={() => handleLinkClick(link.name)}
            />
          ))}
        </div>
        <Separator />
        {/* GLOBAL PARTIES LINK */}
        <LinkComp
          name="Global Parties"
          style="sidebar"
          icon={<LuGlobe size={20} strokeWidth={2} />}
          isSelected={selectedLink === "Global Parties"}
          onClick={() => handleLinkClick("Global Parties")}
        />
      </div>
      {/* FOOTER */}
      <div className="flex flex-col gap-2">
        <Separator />
        <LinkComp
          name="Feedback"
          style="sidebar"
          icon={<MdFeedback size={20} />}
          isSelected={selectedLink === "Feedback"}
          onClick={() => handleLinkClick("Feedback")}
        />
        <LinkComp
          name="Settings"
          style="sidebar"
          icon={<IoMdSettings size={20} />}
          isSelected={selectedLink === "Settings"}
          onClick={() => handleLinkClick("Settings")}
        />
      </div>
    </div>
  );
};

export default Sidebar;
