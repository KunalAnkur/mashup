"use client";
import { Anchor, Separator } from "../UI";
import { menuConfig } from "./config/sidebar";
import { useState } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";

const Content = () => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>(
    menuConfig.top.reduce((acc, menuItem) => {
      if (menuItem.hasSubcategory) {
        acc[menuItem.name] = true; // Open by default
      }
      return acc;
    }, {} as { [key: string]: boolean })
  );

  const handleLinkClick = (name: string) => {
    setSelectedLink(name);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top Menu */}
      <div className="flex flex-col gap-2">
        {menuConfig.top.map((menuItem, index) => (
          <div key={index} className="flex flex-col gap-2">
            {/* Render a separator if hasSeparator is true */}
            {menuItem.hasSeparator && <Separator />}

            {/* MAIN LINK */}
            <div
              className="  flex items-center justify-between cursor-pointer hover:bg-hover hover:rounded-md"
              onClick={() =>
                menuItem.hasSubcategory
                  ? toggleDropdown(menuItem.name)
                  : handleLinkClick(menuItem.name)
              }
            >
              <Anchor
                name={menuItem.name}
                icon={
                  menuItem.icon && <menuItem.icon size={20} strokeWidth={2} />
                }
                style="sidebar"
                isSelected={selectedLink === menuItem.name}
                className="flex flex-1"
              />
              {menuItem.hasSubcategory && (
                <div className="flex items-center mr-1">
                  {openDropdowns[menuItem.name] ? (
                    <LuChevronDown size={20} />
                  ) : (
                    <LuChevronRight size={20} />
                  )}
                </div>
              )}
            </div>

            {/* SUBCATEGORIES */}
            {menuItem.hasSubcategory && openDropdowns[menuItem.name] && (
              <div className="flex flex-col gap-2 pl-6">
                {menuItem.subcategory.map((subItem, subIndex) => (
                  <Anchor
                    key={subIndex}
                    name={subItem.name}
                    style="sidebar"
                    isSelected={selectedLink === subItem.name}
                    onClick={() => handleLinkClick(subItem.name)}
                    className="pl-4"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Menu */}
      <div className="flex flex-col gap-2">
        {menuConfig.bottom.map((menuItem) => (
          <div key={menuItem.name} className="flex flex-col gap-2">
            {/* Render a separator if hasSeparator is true */}
            {menuItem.hasSeparator && <Separator />}
            {/* Main Link */}
            <Anchor
              name={menuItem.name}
              icon={menuItem.icon && <menuItem.icon size={20} />}
              style="sidebar"
              isSelected={selectedLink === menuItem.name}
              onClick={() => handleLinkClick(menuItem.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Content;
