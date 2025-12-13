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

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);
  const { leaveRoom, roomId } = useRoomContext(); // Use centralized room management
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const router = useRouter();
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const roomState = useSelector((state: RootState) => state.room);
  const host = roomState.host;
  const dispatch = useDispatch();

  // Generate room URL dynamically
  const roomUrl = roomId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}` : '';

  // Determine which tabs to show based on source type and host status
  // - For stream with file source: Playlist tab only visible to host (since files are local)
  // - For stream with stream source (screen): Playlist tab visible to all (shows platform being streamed)
  // - For sync: Playlist tab visible to all (everyone can see the URLs)
  const visibleTabs = useMemo(() => {
    const isStreaming = roomState.type === "stream";

    return Object.values(Tabs).filter((tab) => {
      if (tab === Tabs.PLAYLIST) {
        // For file streaming: only show to host (files are local, non-hosts can't see them)
        // For screen streaming or sync: always show (everyone can see)
        return isStreaming ? host : true;
      }
      return true;
    });
  }, [roomState.type, roomState.source, host]);

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
      // 1. Call the API to inactivate the room (if host)
      if (host) {
        const response = await inactiveMyRoomApi();
        console.log("Room inactivated:", response);
      }

      // 2. Leave the room via RoomContext (handles socket disconnect and cleanup)
      leaveRoom();
      setShowLeaveConfirm(false);
      router.push("/");
      // 3. Navigate to home page
      // setTimeout(() => {
      //   router.push("/");
      //   setShowLeaveConfirm(false);
      // }, 100);
    } catch (error) {
      // console.error("Error leaving party:", error);
      showError("Failed to leave room", "There was an error leaving the room. You have been removed locally.");
      // Still navigate even if there's an error
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
    <div className="flex flex-col h-full w-full bg-transparent px-4 py-4">
      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30">
                <LuLogOut className="text-red-400" size={20} />
              </div>
              <h3 className="text-white text-lg font-bold font-parkinsans">
                Leave Party?
              </h3>
            </div>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              Are you sure you want to leave this party? You&apos;ll need the
              room ID to rejoin.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStay}
                className="flex-1 px-4 py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-sm font-medium rounded-xl transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveParty}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="relative p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 transition-all duration-200 group"
            >
              {copied ? (
                <LuCheck
                  size={18}
                  className="text-green-400 transition-colors"
                />
              ) : (
                <LuLink
                  size={18}
                  className="text-white/70 group-hover:text-white transition-colors"
                />
              )}
              {copied && (
                <div className="absolute top-full -left-8 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-10 shadow-xl animate-fade-in">
                  Link copied!
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-zinc-800/15"></div>
                </div>
              )}
            </button>

            {/* Leave Party Button */}
            <button
              onClick={handleLeaveClick}
              className="p-2 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-red-600/20 hover:via-rose-600/20 hover:to-pink-600/20 hover:border-red-500/30 border border-zinc-600/15 text-white/70 hover:text-red-400 transition-all duration-200"
            >
              <LuLogOut size={18} />
            </button>

            {/* Avatar Dropdown */}
            <AvatarDropdown size={36} />
          </div>
        </div>
      </div>
      
{/* Tabs */}
<div className="flex items-center w-full justify-between pt-2 pb-1">
  {visibleTabs.map((tab) => {
    // Different gradient colors for each tab type
    const getTabGradient = (tabName: string) => {
      switch (tabName) {
        case Tabs.CHAT:
          return "from-purple-500/20 via-pink-500/20 to-fuchsia-500/20";
        case Tabs.PEOPLE:
          return "from-blue-500/20 via-cyan-500/20 to-teal-500/20";
        case Tabs.SETTINGS:
          return "from-amber-500/20 via-orange-500/20 to-red-500/20";
        case Tabs.PLAYLIST:
          return "from-emerald-500/20 via-green-500/20 to-lime-500/20";
        default:
          return "from-zinc-800/20 via-zinc-700/20 to-zinc-800/20";
      }
    };

    const getTabBorderGradient = (tabName: string) => {
      switch (tabName) {
        case Tabs.CHAT:
          return "from-purple-600 via-pink-600 to-fuchsia-600";
        case Tabs.PEOPLE:
          return "from-blue-600 via-cyan-600 to-teal-600";
        case Tabs.SETTINGS:
          return "from-amber-600 via-orange-600 to-red-600";
        case Tabs.PLAYLIST:
          return "from-emerald-600 via-green-600 to-lime-600";
        default:
          return "from-rose-600 via-pink-600 to-fuchsia-600";
      }
    };

    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 font-medium text-xs sm:text-sm transition-all duration-200 relative rounded-t-xl z-10
                    ${
                      activeTab === tab
                        ? "text-white"
                        : "text-white/60 hover:text-white/80"
                    }`}
      >
        <span className="relative z-20">{tab}</span>
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

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden pt-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
};

export default Panel;
