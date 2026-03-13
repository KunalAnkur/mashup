"use client";

import { useState, useMemo } from "react";
import { Tabs } from "@/types/roomTypes";
import ChatTab from "./ChatTab";
import PeopleTab from "./PeopleTab";
import SettingTab from "./SettingTab";
import PlaylistTab from "./PlaylistTab";
import { useDispatch, useSelector } from "react-redux";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { AvatarDropdown } from "../UI";
import Image from "next/image";
import { isMobile } from "react-device-detect";
import * as constants from "../../constants";
// Added icons for tabs and new feedback icon
import {
  LuCheck,
  LuLink,
  LuLogOut,
  LuMessageCircle,
  LuUsers,
  LuSettings,
  LuListVideo,
} from "react-icons/lu";
import { useRoomContext } from "@/context/RoomContext";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackRoomLinkCopied } from "@/lib/analytics";

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);

  const { leaveRoom, roomId } = useRoomContext();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const router = useRouter();
  const roomState = useSelector((state: RootState) => state.room);
  const host = roomState.host;
  const dispatch = useDispatch();

  const tToast = useTranslations("toast");
  const tPanel = useTranslations("panel");
  const tCommon = useTranslations("common");

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

  const getTabIcon = (tab: Tabs) => {
    switch (tab) {
      case Tabs.CHAT: return <LuMessageCircle size={18} />;
      case Tabs.PEOPLE: return <LuUsers size={18} />;
      case Tabs.SETTINGS: return <LuSettings size={18} />;
      case Tabs.PLAYLIST: return <LuListVideo size={18} />;
      default: return <LuMessageCircle size={18} />;
    }
  };

  const getTabLabel = (tab: Tabs) => {
    switch (tab) {
      case Tabs.CHAT: return tPanel("chat.title");
      case Tabs.PEOPLE: return tPanel("people.title");
      case Tabs.SETTINGS: return tPanel("settings.title");
      case Tabs.PLAYLIST: return tPanel("playlist.title");
      default: return tab;
    }
  };

  const handleCopyLink = () => {
    if (roomUrl && roomId) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      trackRoomLinkCopied(roomId);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleLeaveParty = async () => {
    try {
      leaveRoom();
      setShowLeaveConfirm(false);
      router.push("/");
    } catch {
      showError(tToast("failedToLeaveRoom"), tToast("errorLeavingRoom"));
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
    <div className="relative flex flex-col h-full w-full bg-transparent px-3 py-3 md:px-4 md:py-4 overflow-hidden">
      {/* Soft separator: subtle gradient line instead of a hard border */}
      <div className="pointer-events-none absolute left-0 top-6 bottom-6 hidden w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
      <div className="pointer-events-none absolute left-0 top-12 bottom-12 hidden w-px opacity-40 shadow-[0_0_14px_rgba(255,255,255,0.10)] md:block" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent md:hidden" />
      

      <div className="relative z-30 flex flex-col h-full w-full">
        {showLeaveConfirm && (
          <div className="leave-modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30">
                  <LuLogOut className="text-red-400" size={18} />
                </div>
                <h3 className="text-white text-base md:text-lg font-bold font-parkinsans">
                  {tPanel("leaveParty")}
                </h3>
              </div>
              <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed">
                {tPanel("leavePartyMessage")}
              </p>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={handleStay}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200"
                >
                  {tPanel("stay")}
                </button>
                <button
                  onClick={handleLeaveParty}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
                >
                  {tPanel("leave")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* MOBILE VIEW - Unified Compact Header (shown on mobile devices, even in landscape) */}
        {/* ============================================== */}
        {isMobile ? (
        <div className="flex items-center justify-between gap-2 mb-2 w-full">
          {/* Left: Logo */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-md opacity-50"></div>
            <Image
              src={constants.assets.logo}
              alt="Logo"
              width={28}
              height={28}
              className="relative"
            />
          </div>

          {/* Center: Navigation Tabs (Icons Only) */}
          <div className="flex items-center bg-zinc-800/40 backdrop-blur-xl rounded-xl p-1 gap-1 border border-white/5 overflow-x-auto scrollbar-hide">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`p-2 rounded-lg transition-all duration-200 relative
                    ${isActive ? "text-white bg-white/10 shadow-sm" : "text-white/40 hover:text-white/70"}`}
                >
                  {getTabIcon(tab)}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Actions (Link, Leave, Avatar) */}
          <div className="flex items-center gap-1.5">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="relative p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white transition-all"
            >
              {copied ? <LuCheck size={16} className="text-green-400" /> : <LuLink size={16} />}
            </button>

            {/* Leave */}
            <button
              onClick={handleLeaveClick}
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
            >
              <LuLogOut size={16} />
            </button>

            <div className="pl-0.5">
              <AvatarDropdown size={30} />
            </div>
          </div>
        </div>
        ) : null}


        {/* ============================================== */}
        {/* DESKTOP VIEW - Original Layout (hidden on mobile devices, shown on desktop) */}
        {/* ============================================== */}
        {!isMobile ? (
        <div className="hidden md:flex flex-col gap-4 mb-2">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity"></div>
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="relative p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 transition-all duration-200 group z-40"
              >
                {copied ? (
                  <LuCheck size={18} className="text-green-400 transition-colors" />
                ) : (
                  <LuLink size={18} className="text-white/70 group-hover:text-white transition-colors" />
                )}
                {copied && (
                  <div className="absolute top-full -left-8 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-[110] shadow-xl animate-fade-in">
                    {tCommon("linkCopied")}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-zinc-800/15"></div>
                  </div>
                )}
              </button>

              <button
                onClick={handleLeaveClick}
                className="p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-red-600/20 hover:via-rose-600/20 hover:to-pink-600/20 hover:border-red-500/30 border border-zinc-600/15 text-white/70 hover:text-red-400 transition-all duration-200"
              >
                <LuLogOut size={18} />
              </button>

              <AvatarDropdown size={36} />
            </div>
          </div>

          {/* Desktop Tabs */}
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
                  className={`px-3 py-2 font-medium text-sm transition-all duration-200 relative rounded-t-xl z-10 flex-shrink-0
                              ${activeTab === tab ? "text-white" : "text-white/60 hover:text-white/80"}`}
                >
                  <span className="relative z-20 whitespace-nowrap">{getTabLabel(tab)}</span>
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
        </div>
        ) : null}

        {/* Content Area (Shared) */}
        <div className="flex-1 overflow-hidden pt-2 md:pt-4">
          {renderTabContent(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default Panel;
