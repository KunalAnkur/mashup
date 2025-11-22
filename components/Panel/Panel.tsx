"use client";

import { useState } from "react";
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
    <div className="flex flex-col h-full w-full bg-[#18181b] px-4 py-4">
      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a]  rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <LuLogOut className="text-red-400" size={20} />
              </div>
              <h3 className="text-white text-lg font-bold font-parkinsans">
                Leave Party?
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to leave this party? You&apos;ll need the
              room ID to rejoin.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStay}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10  text-white text-sm font-medium rounded-xl transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveParty}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            className="flex items-center gap-2 group"
            /* onClick={() => router.push("/")} landing page direciton*/
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Image
                src={constants.assets.logo}
                alt="Logo"
                width={28}
                height={28}
                className="relative"
              />
            </div>
            <h2 className="text-base font-bold text-white font-parkinsans group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:via-pink-400 group-hover:to-fuchsia-400 transition-all duration-300">
              Movmash
            </h2>
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 transition-all duration-200 group"
            >
              {copied ? (
                <LuCheck
                  size={18}
                  className="text-green-400 transition-colors"
                />
              ) : (
                <LuLink
                  size={18}
                  className="text-gray-400 group-hover:text-pink-400 transition-colors"
                />
              )}
              {copied && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#2a2a2e] text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-10 shadow-xl border border-white/10 animate-fade-in">
                  Link copied!
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-[#2a2a2e]"></div>
                </div>
              )}
            </button>

            {/* Leave Party Button */}
            <button
              onClick={handleLeaveClick}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 transition-all duration-200"
            >
              <LuLogOut size={18} />
            </button>

            {/* Avatar Dropdown */}
            <AvatarDropdown size={36} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-1 pt-2 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-medium text-sm transition-all duration-200 relative rounded-t-xl
                            ${
                              activeTab === tab
                                ? "text-white"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
          >
            {tab}
            {activeTab === tab && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 rounded-full"></div>
                <div className="absolute inset-0 bg-white/5 rounded-t-xl"></div>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden pt-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
};

export default Panel;
