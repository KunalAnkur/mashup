"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Logo,
  Separator,
  LinkComp,
  Avatar,
  Button,
  PartyCard,
  Input,
} from "../components";

import { FaArrowRight } from "react-icons/fa";
import { sidebarLinks } from "@/components/Sidebar/config/sidebar";
import { FaMagnifyingGlass } from "react-icons/fa6";

const Page = () => {
  const router = useRouter();
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const handleLinkClick = (linkName: string) => {
    setSelectedLink(linkName);
  };

  return (
    <div className="bg-primaryDark  p-16">
      <Logo />
      <Separator />
      <Button
        name="GO TO TEST-PAGE"
        onClick={() => {
          console.log("Button clicked!");
          router.push("/test-page");
        }}
        style="party"
        icon={<FaArrowRight />}
      />
      <Separator />
      <LinkComp
        name={sidebarLinks[0].name}
        url={"/"}
        icon={<FaArrowRight />}
        hasDropdown
        style="sidebar"
        isSelected={selectedLink === sidebarLinks[0].name}
        onClick={() => handleLinkClick(sidebarLinks[0].name)}
      />
      <Separator />
      <Avatar
        url="https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-175803.jpg?t=st=1733684954~exp=1733688554~hmac=e9ff778edf2b98f64ef4c545f38e54df1cbdd79eaf53e5e6b6060d0ee51c4251&w=996"
        alt="Avatar"
        size={70}
      />
      <Separator />
      <PartyCard />
      <Separator />
      <Input
        placeholder="Search"
        icon={<FaMagnifyingGlass color="white" />}
        type="text"
      />
    </div>
  );
};

export default Page;
