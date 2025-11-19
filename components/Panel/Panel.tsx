"use client";

import { useState } from "react";
import { MdCheck } from "react-icons/md";
import { Tabs } from "@/types/roomTypes";
import ChatTab from "./ChatTab";
import PeopleTab from "./PeopleTab";
import SettingTab from "./SettingTab";
import { useDispatch, useSelector } from "react-redux";
import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { AvatarDropdown } from "../UI";
import Image from "next/image";
import * as constants from "../../constants";
import { LuCheck, LuLink, LuLogOut } from "react-icons/lu";

const TABS = Object.values(Tabs);

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const roomUrl = "https://movmash.com/room/3wJz21";
  const router = useRouter();
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const host = useSelector((state: RootState) => state.room.host);
  const dispatch = useDispatch();

  const renderTabContent = (tab: Tabs) => {
    switch (tab) {
      case Tabs.PEOPLE:
        return <PeopleTab />;
      case Tabs.SETTINGS:
        return <SettingTab />;
      default:
        return <ChatTab />;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLeaveParty = async () => {
    const response = await inactiveMyRoomApi();
    if (host) {
      console.log(response);
    } else {
    }
    dispatch(exitRoom());
    router.push("/");
    setShowLeaveConfirm(false);
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleStay = () => {
    setShowLeaveConfirm(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#18181b] px-4  py-6">
      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-bold mb-2">Leave Party?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to leave this party?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStay}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                No, Stay
              </button>
              <button
                onClick={handleLeaveParty}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className=" flex flex-col gap-4">
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <div className="flex gap-4 items-center justify-center ">
            <button
              className="flex items-center justify-center gap-2"
              /* onClick={() => router.push("/")} landing page direciton*/
            >
              <Image
                src={constants.assets.logo}
                alt="Logo"
                width={24}
                height={24}
              />
              <h2 className="text-md font-semibold text-white/90">Movmash</h2>
            </button>
            {/*   <div className="w-px h-[10px] bg-gray-500" /> */}
          </div>
          {/* Room Link */}
          <div className="flex items-center justify-end  gap-1 ">
            <button onClick={handleCopyLink} className="relative">
              {copied ? (
                <LuCheck
                  size={18}
                  className="text-green-500 transition-colors"
                />
              ) : (
                <LuLink
                  size={18}
                  className="text-gray-400 hover:text-pink-500 transition-colors cursor-pointer"
                />
              )}

              {copied && (
                <span className="w-[60px] -right-6  absolute -top-4 text-[10px] text-green-400">
                  Link copied!
                </span>
              )}
            </button>
            {/* Leave Party Button */}
            <button
              onClick={handleLeaveClick}
              className="flex gap-1  items-center justify-center text-sm   text-gray-400 hover:text-white/60 rounded-lg transition-colors     px-2 py-1"
            >
              <LuLogOut size={18} />
            </button>
            {/* Avatar Dropdown */}
            <AvatarDropdown size={36} />
          </div>
        </div>
      </div>

      {/* Tabs - Simple underline style */}
      <div className="flex justify-center pt-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition relative
                            ${
                              activeTab === tab
                                ? "text-white"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden  pt-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
};

export default Panel;
