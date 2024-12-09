import { BiLeftArrow } from "react-icons/bi";
import { LinkComp, Logo, Separator } from "../UI";
import { HiHome } from "react-icons/hi";
import { CiWavePulse1 } from "react-icons/ci";
import { sidebarLinks } from "./config/sidebar";
import { GiGlobe } from "react-icons/gi";

const Sidebar = () => {
  return (
    <div className="text-sm w-[250px] h-[680px] bg-secondaryDark rounded-lg p-4 flex flex-col justify-between ">
      <div className="flex flex-col  gap-2">
        {/* LOGO */}
        <div className="flex justify-between items-center">
          <Logo size="md" href="/" />
          <BiLeftArrow />
        </div>
        {/* HOME LINK + Separator */}
        <LinkComp name="Home" url="/" icon={<HiHome />} style="sidebar" />
        <Separator />
        {/* CREATE PARTY LINKS + Separator */}
        <div className="flex flex-col gap-2">
          <LinkComp
            name="Create Party"
            url="/global-parties"
            style="sidebar"
            icon={<CiWavePulse1 />}
          />
          {sidebarLinks.map((link) => (
            <LinkComp
              key={link.name}
              name={link.name}
              url={link.url}
              style="sidebar"
              className="pl-8"
            />
          ))}
        </div>
        <Separator />
        {/* GLOBAL PARTIES LINK */}
        <LinkComp
          name="Global Parties"
          url="/global-parties"
          style="sidebar"
          icon={<GiGlobe />}
        />
      </div>
      {/* FOOTER */}
      <span>footerhere</span>
    </div>
  );
};

export default Sidebar;
