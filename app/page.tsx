"use client";
import Button from "@/components/UI/Button";
import { Logo } from "../components";
import { FaArrowRight } from "react-icons/fa";
import { useRouter } from "next/navigation";
import LinkComp from "@/components/UI/Link";
import { sidebarLinks } from "@/components/Sidebar/config/sidebar";
const Page = () => {
  const router = useRouter();
  return (
    <div className="bg-black">
      <Logo />
      <Button
        name="GO TO TEST-PAGE"
        onClick={() => {
          console.log("Button clicked!");
          router.push("/test-page");
        }}
        style="party"
        icon={<FaArrowRight />}
      />
      =========================
      <LinkComp
        name={sidebarLinks[0].name}
        url={sidebarLinks[0].url}
        icon={<FaArrowRight />}
        hasDropdown
        style="sidebar"
      />
    </div>
  );
};

export default Page;
