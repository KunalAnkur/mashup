import { HiHome } from "react-icons/hi";
import { IoMdSettings } from "react-icons/io";
import { LuGlobe, LuRadio } from "react-icons/lu";
import { MdFeedback } from "react-icons/md";
export const sidebarLinks = [
  { name: "Device", url: "/device" },
  { name: "Link", url: "/link" },
  { name: "Netflix", url: "/netflix" },
  { name: "Youtube", url: "/youtube" },
];

export const sidebarTitles = ["Home", "Create Party", "Global Parties"];

export const menuConfig = {
  top: [
    {
      name: "Home",
      icon: HiHome,
      link: "/",
      hasSubcategory: false,
      subcategory: [],
      hasSeparator: false,
    },
    {
      name: "Create Party",
      icon: LuRadio,
      hasSubcategory: true,
      subcategory: [
        {
          name: "Device",
          icon: "",
          link: "/device",
        },
        {
          name: "Link",
          icon: "",
          link: "/link",
        },
        {
          name: "Netflix",
          icon: "",
          link: "/netflix",
        },
        {
          name: "Youtube",
          icon: "",
          link: "/youtube",
        },
      ],
      hasSeparator: true,
    },

    {
      name: "Global Parties",
      icon: LuGlobe,
      link: "/",
      hasSubcategory: false,
      subcategory: [],
      hasSeparator: true,
    },
  ],
  bottom: [
    {
      name: "Feedback",
      icon: MdFeedback,
      link: "/",
      hasSubcategory: false,
      subcategory: [],
      hasSeparator: true,
    },
    {
      name: "Settings",
      icon: IoMdSettings,
      link: "/",
      hasSubcategory: false,
      subcategory: [],
      hasSeparator: false,
    },
  ],
};
