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
  LuSparkles,
  LuMessageCircle,
  LuUsers,
  LuSettings,
  LuListVideo,
  LuX,
  LuSend,
  LuMessageSquare
} from "react-icons/lu";
import { useRoomContext } from "@/context/RoomContext";
import { showError, showSuccess } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackRoomLinkCopied } from "@/lib/analytics";
import { useSubmitFeedbackMutation } from "@/lib/store/api/feedbackApi";

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    title: "",
    description: "",
    category: "bug" as "bug" | "feature" | "other",
  });

  const { leaveRoom, roomId } = useRoomContext();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const router = useRouter();
  const roomState = useSelector((state: RootState) => state.room);
  const authState = useSelector((state: RootState) => state.auth);
  const host = roomState.host;
  const dispatch = useDispatch();
  const [submitFeedback] = useSubmitFeedbackMutation();

  const tToast = useTranslations("toast");
  const tPanel = useTranslations("panel");
  const tCommon = useTranslations("common");
  const tFeedback = useTranslations("feedback");

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

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackForm.title.length < 3 || feedbackForm.description.length < 10) {
      showError(tToast("invalidInput"), tToast("fillFieldsCorrectly"));
      return;
    }

    setFeedbackLoading(true);
    try {
      if (authState.isAuthenticated) {
        await submitFeedback({
          ...feedbackForm,
          room_id: roomId || undefined,
          room_details: roomState
        });
      
        showSuccess(tToast("feedbackSent"));
        setIsFeedbackOpen(false);
        setFeedbackForm({ title: "", description: "", category: "bug" });
      } else {
        showError(tCommon("error"), tToast("pleaseLogin"));
      }
    } catch {
      showError(tCommon("error"), tToast("couldNotSendFeedback"));
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-[#151518] via-[#1a1a1d] to-[#151518] px-3 py-3 md:px-4 md:py-4 overflow-hidden">
      {/* Feedback Modal - Inline like leave modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-[#151518] via-[#1a1a1d] to-[#151518] rounded-[2rem] shadow-2xl overflow-hidden">
            {/* Dynamic Background Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[60px]" />

            {/* Header */}
            <div className="relative px-6 pt-6 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20">
                  <LuMessageSquare className="text-rose-400" size={20} />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold font-parkinsans">{tFeedback("title")}</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{tFeedback("helpUsImprove")}</p>
                </div>
              </div>
              <button onClick={() => setIsFeedbackOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                <LuX size={20} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="relative p-6 space-y-5">
              {/* Category Chips */}
              <div className="flex p-1 bg-zinc-900/50 rounded-2xl">
                {(["bug", "feature", "other"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, category: cat })}
                    className={`flex-1 py-2 text-[11px] font-bold capitalize transition-all duration-300 rounded-xl ${
                      feedbackForm.category === cat 
                        ? "bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 text-white" 
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {tFeedback(`category.${cat}`)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={tFeedback("topic")}
                  className="w-full bg-zinc-800/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:outline-none focus:border-rose-500/30 transition-all font-medium"
                  value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                />

                <textarea
                  placeholder={tFeedback("descriptionPlaceholder")}
                  rows={4}
                  className="w-full bg-zinc-800/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:outline-none focus:border-rose-500/30 transition-all resize-none font-medium"
                  value={feedbackForm.description}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={feedbackLoading}
                className="group relative w-full py-4 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-2xl transition-all duration-300 shadow-lg shadow-rose-500/20 overflow-hidden active:scale-95 disabled:opacity-50"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {feedbackLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LuSend size={18} />
                      <span>{tFeedback("sendFeedback")}</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c026d3]/12 rounded-full blur-[120px] opacity-70" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e11d48]/12 rounded-full blur-[120px] opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7c3aed]/8 rounded-full blur-[140px] opacity-50" />
      </div>

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

          {/* Right: Actions (Feedback, Link, Leave, Avatar) */}
          <div className="flex items-center gap-1.5">
            {/* Feedback Button (Sparkles) */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 transition-all"
            >
              <LuSparkles size={16} />
            </button>

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

          {/* Desktop Beta Banner */}
          <div className="relative z-10 group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 blur-xl group-hover:opacity-100 opacity-50 transition-opacity duration-500" />
            <div className="relative bg-[#1a1a1d]/40 backdrop-blur-2xl border border-white/5 rounded-2xl p-3.5 shadow-2xl overflow-hidden">
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-amber-500/20 blur-md animate-pulse" />
                    <span className="relative px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-widest rounded-md uppercase">
                      Beta
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-white/90 text-xs font-semibold tracking-tight">
                      {tPanel("activelyImproving")}
                    </p>
                    <p className="text-white/40 text-[10px] leading-none mt-0.5">
                      {tPanel("helpUsShapeMovmash")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[11px] font-bold rounded-lg transition-all duration-300 active:scale-95 shadow-lg shadow-amber-900/5"
                >
                  {tPanel("feedback")}
                </button>
              </div>
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
