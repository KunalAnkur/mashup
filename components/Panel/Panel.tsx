"use client";

import { useState, useMemo } from "react";
import { Tabs } from "@/types/roomTypes";
import ChatTab from "./ChatTab";
import PeopleTab from "./PeopleTab";
import SettingTab from "./SettingTab";
import PlaylistTab from "./PlaylistTab";
import { useDispatch, useSelector } from "react-redux";
import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { AvatarDropdown } from "../UI";
import Image from "next/image";
import * as constants from "../../constants";
import { LuCheck, LuLink, LuLogOut } from "react-icons/lu";
import { useRoomContext } from "@/context/RoomContext";
import { showError } from "@/utils/toast";
// New Import
import FeedbackModal from "../Modals/FeedbackModal";

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);
  // New State for Feedback Modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  const { leaveRoom, roomId } = useRoomContext();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const router = useRouter();
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const roomState = useSelector((state: RootState) => state.room);
  const host = roomState.host;
  const dispatch = useDispatch();

  const roomUrl = roomId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}` : '';

  const visibleTabs = useMemo(() => {
    const isStreaming = roomState.playlist.some((item) => item.type === "stream");

    return Object.values(Tabs).filter((tab) => {
      if (tab === Tabs.PLAYLIST) {
        return isStreaming ? host : true;
      }
      return true;
    });
  }, [roomState.playlist, host]);

  const renderTabContent = (tab: Tabs) => {
    switch (tab) {
      case Tabs.PLAYLIST:
        return <PlaylistTab />;
      case Tabs.PEOPLE:
        return <PeopleTab />;
      case Tabs.SETTINGS:
        return <SettingTab />;
      default:
        return <ChatTab />;
    }
  };

  const handleCopyLink = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleLeaveParty = async () => {
    try {
      if (host) {
        const response = await inactiveMyRoomApi();
        console.log("Room inactivated:", response);
      }
      leaveRoom();
      setShowLeaveConfirm(false);
      router.push("/");
    } catch (error) {
      showError("Failed to leave room", "There was an error leaving the room. You have been removed locally.");
      dispatch(exitRoom());
      router.push("/");
      setShowLeaveConfirm(false);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleStay = () => {
    setShowLeaveConfirm(false);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-[#151518] via-[#1a1a1d] to-[#151518] px-3 py-3 md:px-4 md:py-4 overflow-hidden">
      {/* New Feedback Modal Component */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        roomId={roomId || undefined}
      />

      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c026d3]/12 rounded-full blur-[120px] opacity-70" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e11d48]/12 rounded-full blur-[120px] opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7c3aed]/8 rounded-full blur-[140px] opacity-50" />
      </div>
      
      <div className="relative z-30 flex flex-col h-full w-full">
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30">
                <LuLogOut className="text-red-400" size={18} />
              </div>
              <h3 className="text-white text-base md:text-lg font-bold font-parkinsans">
                Leave Party?
              </h3>
            </div>
            <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed">
              Are you sure you want to leave this party? You&apos;ll need the
              room ID to rejoin.
            </p>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={handleStay}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveParty}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4 mb-2">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 md:gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <Image
                src={constants.assets.logo}
                alt="Logo"
                width={24}
                height={24}
                className="relative md:w-7 md:h-7"
              />
            </div>
            <h2 className="text-sm md:text-base font-bold text-white font-parkinsans group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:via-pink-400 group-hover:to-fuchsia-400 transition-all duration-300">
              Movmash
            </h2>
          </button>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={handleCopyLink}
              className="relative p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 transition-all duration-200 group"
            >
              {copied ? (
                <LuCheck size={16} className="text-green-400 transition-colors md:w-[18px] md:h-[18px]" />
              ) : (
                <LuLink size={16} className="text-white/70 group-hover:text-white transition-colors md:w-[18px] md:h-[18px]" />
              )}
              {copied && (
                <div className="absolute top-full -left-8 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-10 shadow-xl animate-fade-in">
                  Link copied!
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-zinc-800/15"></div>
                </div>
              )}
            </button>

            <button
              onClick={handleLeaveClick}
              className="p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-red-600/20 hover:via-rose-600/20 hover:to-pink-600/20 hover:border-red-500/30 border border-zinc-600/15 text-white/70 hover:text-red-400 transition-all duration-200"
            >
              <LuLogOut size={16} className="md:w-[18px] md:h-[18px]" />
            </button>

            <AvatarDropdown size={32} className="md:w-9 md:h-9" />
          </div>
        </div>
      </div>

      {/* Beta Message Box */}
<div className="relative z-10 mb-3 md:mb-4 mt-2 group">
  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 blur-xl group-hover:opacity-100 opacity-50 transition-opacity duration-500" />
  
  <div className="relative bg-[#1a1a1d]/40 backdrop-blur-2xl border border-white/5 rounded-xl md:rounded-2xl p-2.5 md:p-3.5 shadow-2xl overflow-hidden">
    {/* Decorative corner glow */}
    <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
    
    <div className="flex items-center justify-between gap-2 md:gap-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/20 blur-md animate-pulse" />
          <span className="relative px-1.5 md:px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] md:text-[10px] font-black tracking-widest rounded-md uppercase">
            Beta
          </span>
        </div>
        <div className="flex flex-col">
          <p className="text-white/90 text-[11px] md:text-xs font-semibold tracking-tight">
            Actively Improving
          </p>
          <p className="text-white/40 text-[9px] md:text-[10px] leading-none mt-0.5">
            Help us shape Movmash
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="px-3 md:px-4 py-1 md:py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] md:text-[11px] font-bold rounded-lg transition-all duration-300 active:scale-95 shadow-lg shadow-amber-900/5"
      >
        Feedback
      </button>
    </div>
  </div>
</div>
      
        {/* Tabs */}
        <div className="flex items-center w-full justify-between pt-2 pb-1 overflow-x-auto scrollbar-hide">
  {visibleTabs.map((tab) => {
    const getTabGradient = (tabName: string) => {
      switch (tabName) {
        case Tabs.CHAT: return "from-purple-500/20 via-pink-500/20 to-fuchsia-500/20";
        case Tabs.PEOPLE: return "from-blue-500/20 via-cyan-500/20 to-teal-500/20";
        case Tabs.SETTINGS: return "from-amber-500/20 via-orange-500/20 to-red-500/20";
        case Tabs.PLAYLIST: return "from-emerald-500/20 via-green-500/20 to-lime-500/20";
        default: return "from-zinc-800/20 via-zinc-700/20 to-zinc-800/20";
      }
    };

    const getTabBorderGradient = (tabName: string) => {
      switch (tabName) {
        case Tabs.CHAT: return "from-purple-600 via-pink-600 to-fuchsia-600";
        case Tabs.PEOPLE: return "from-blue-600 via-cyan-600 to-teal-600";
        case Tabs.SETTINGS: return "from-amber-600 via-orange-600 to-red-600";
        case Tabs.PLAYLIST: return "from-emerald-600 via-green-600 to-lime-600";
        default: return "from-rose-600 via-pink-600 to-fuchsia-600";
      }
    };

    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-2.5 md:px-3 py-1.5 md:py-2 font-medium text-[11px] md:text-xs lg:text-sm transition-all duration-200 relative rounded-t-xl z-10 flex-shrink-0
                    ${activeTab === tab ? "text-white" : "text-white/60 hover:text-white/80"}`}
      >
        <span className="relative z-20 whitespace-nowrap">{tab}</span>
        {activeTab === tab && (
          <>
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${getTabBorderGradient(tab)} rounded-full z-10`}></div>
            <div className={`absolute inset-0 bg-gradient-to-br ${getTabGradient(tab)} rounded-t-xl z-0`}></div>
          </>
        )} 
      </button>
    );
  })}
</div>

        <div className="flex-1 overflow-hidden pt-2 md:pt-4">
          {renderTabContent(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default Panel;