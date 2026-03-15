"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs } from "@/types/roomTypes";
import ChatTab from "./ChatTab";
import PeopleTab from "./PeopleTab";
import SettingTab from "./SettingTab";
import PlaylistTab from "./PlaylistTab";
import { useDispatch, useSelector } from "react-redux";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  AvatarDropdown,
  Modal,
  ModalConfirmContent,
  modalConfirmSurfaceClass,
} from "../UI";
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
import { AnimatePresence, motion } from "framer-motion";
import PanelHeaderActionButton from "./PanelHeaderActionButton";

const mobileTabRailClass =
  "flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-white/[0.035] p-1.5 backdrop-blur-xl scrollbar-hide";
const mobileTabButtonBaseClass =
  "relative flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full p-1.5 text-white transition-colors duration-200";
const desktopTabRailClass =
  "relative grid w-full gap-1 rounded-full bg-white/[0.035] p-1.5";
const desktopTabButtonBaseClass =
  "relative inline-flex min-h-[30px] min-w-0 w-full items-center justify-center overflow-hidden rounded-full p-1.5 text-[14px] leading-none font-medium text-white transition-colors duration-200";
const activeTabPillClass =
  "bg-[linear-gradient(135deg,rgba(190,24,93,0.96)_0%,rgba(190,24,93,0.9)_38%,rgba(168,85,247,0.8)_100%)]";
const activeTabPillTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.82,
} as const;
const tabContentTransition = {
  type: "spring",
  stiffness: 340,
  damping: 32,
  mass: 0.88,
} as const;
const swipeThreshold = 56;

type SwipeAxis = "x" | "y" | null;
type SwipeState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  axis: SwipeAxis;
  enabled: boolean;
};

const initialSwipeState: SwipeState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  axis: null,
  enabled: false,
};

const tabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 36 : direction < 0 ? -36 : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : direction < 0 ? 36 : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
};

const isSwipeBlockedTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, option, button, a, label, [role='button'], [role='link'], [contenteditable='true'], [data-no-tab-swipe='true']",
    ),
  );
};

const Panel = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
  const [copied, setCopied] = useState(false);
  const [tabDirection, setTabDirection] = useState(0);

  const { leaveRoom, roomId } = useRoomContext();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const router = useRouter();
  const roomState = useSelector((state: RootState) => state.room);
  const host = roomState.host;
  const dispatch = useDispatch();
  const swipeStateRef = useRef<SwipeState>(initialSwipeState);

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

  const activeTabIndex = visibleTabs.indexOf(activeTab);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setTabDirection(0);
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

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

  const getTabIcon = (tab: Tabs, size = 18) => {
    switch (tab) {
      case Tabs.CHAT: return <LuMessageCircle size={size} />;
      case Tabs.PEOPLE: return <LuUsers size={size} />;
      case Tabs.SETTINGS: return <LuSettings size={size} />;
      case Tabs.PLAYLIST: return <LuListVideo size={size} />;
      default: return <LuMessageCircle size={size} />;
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

  const getTabTone = (tab: Tabs) => {
    switch (tab) {
      case Tabs.CHAT:
        return {
          activePill: activeTabPillClass,
          inactiveText: "text-white/46 hover:text-white/76",
          icon: "text-fuchsia-200",
        };
      case Tabs.PEOPLE:
        return {
          activePill: activeTabPillClass,
          inactiveText: "text-white/46 hover:text-white/76",
          icon: "text-cyan-200",
        };
      case Tabs.SETTINGS:
        return {
          activePill: activeTabPillClass,
          inactiveText: "text-white/46 hover:text-white/76",
          icon: "text-amber-200",
        };
      case Tabs.PLAYLIST:
        return {
          activePill: activeTabPillClass,
          inactiveText: "text-white/46 hover:text-white/76",
          icon: "text-emerald-200",
        };
      default:
        return {
          activePill: activeTabPillClass,
          inactiveText: "text-white/46 hover:text-white/76",
          icon: "text-white",
        };
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

  const resetSwipeState = () => {
    swipeStateRef.current = initialSwipeState;
  };

  const selectTab = (nextTab: Tabs) => {
    if (nextTab === activeTab) {
      return;
    }

    const nextIndex = visibleTabs.indexOf(nextTab);

    if (nextIndex === -1) {
      return;
    }

    setTabDirection(nextIndex > activeTabIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  const shiftTab = (step: -1 | 1) => {
    const nextTab = visibleTabs[activeTabIndex + step];

    if (!nextTab) {
      return;
    }

    selectTab(nextTab);
  };

  const handleContentPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.pointerType === "mouse" && event.button !== 0) || isSwipeBlockedTarget(event.target)) {
      resetSwipeState();
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    swipeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
      enabled: true,
    };
  };

  const handleContentPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const swipeState = swipeStateRef.current;

    if (!swipeState.enabled || swipeState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;

    if (!swipeState.axis) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        return;
      }

      swipeState.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.1 ? "x" : "y";

      if (swipeState.axis === "y") {
        resetSwipeState();
        return;
      }
    }

    if (swipeState.axis === "x") {
      event.preventDefault();
    }
  };

  const handleContentPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const swipeState = swipeStateRef.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!swipeState.enabled || swipeState.pointerId !== event.pointerId) {
      resetSwipeState();
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;

    if (
      swipeState.axis === "x" &&
      Math.abs(deltaX) > swipeThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.1
    ) {
      shiftTab(deltaX < 0 ? 1 : -1);
    }

    resetSwipeState();
  };

  const handleContentPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetSwipeState();
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-transparent px-3 py-3 md:px-4 md:py-4 overflow-hidden">
      {/* Soft separator: subtle gradient line instead of a hard border */}
      <div className="pointer-events-none absolute left-0 top-6 bottom-6 hidden w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
      <div className="pointer-events-none absolute left-0 top-12 bottom-12 hidden w-px opacity-40 shadow-[0_0_14px_rgba(255,255,255,0.10)] md:block" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent md:hidden" />
      

      <div className="relative z-30 flex flex-col h-full w-full">
        <Modal
          open={showLeaveConfirm}
          onClose={handleStay}
          closeOnBackdropClick={false}
          closeOnEscape={false}
          overlayClassName="leave-modal z-50"
          panelClassName={modalConfirmSurfaceClass}
        >
          <ModalConfirmContent
            icon={<LuLogOut size={18} className="text-current" />}
            title={tPanel("leaveParty")}
            message={tPanel("leavePartyMessage")}
            cancelLabel={tPanel("stay")}
            confirmLabel={tPanel("leave")}
            onCancel={handleStay}
            onConfirm={handleLeaveParty}
          />
        </Modal>

        {/* ============================================== */}
        {/* MOBILE VIEW - Unified Compact Header (shown on mobile devices, even in landscape) */}
        {/* ============================================== */}
        {isMobile ? (
        <div className="flex items-center justify-between gap-2 mb-3 w-full">
          {/* Left: Logo */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-md opacity-50"></div>
            <Image
              src={constants.assets.logo}
              alt="Logo"
              width={26}
              height={26}
              className="relative"
            />
          </div>

          {/* Center: Navigation Tabs (Icons Only) */}
          <div className={mobileTabRailClass}>
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab;
              const tabTone = getTabTone(tab);
              return (
                <button
                  key={tab}
                  onClick={() => selectTab(tab)}
                  className={`${mobileTabButtonBaseClass} ${
                    isActive ? "text-white" : tabTone.inactiveText
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="panel-active-pill"
                      className={`pointer-events-none absolute inset-0 rounded-full ${tabTone.activePill}`}
                      transition={activeTabPillTransition}
                    />
                  ) : null}
                  <span className={`relative z-10 ${isActive ? "" : "opacity-90"}`}>{getTabIcon(tab, 18)}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions (Link, Leave, Avatar) */}
          <div className="flex items-center gap-1.5">
            {/* Copy Link */}
            <PanelHeaderActionButton
              onClick={handleCopyLink}
              className="bg-white/5 text-white/60 hover:text-white"
              aria-label={tPanel("copyLink")}
            >
              {copied ? <LuCheck size={15} className="text-green-400" /> : <LuLink size={15} />}
            </PanelHeaderActionButton>

            {/* Leave */}
            <PanelHeaderActionButton
              onClick={handleLeaveClick}
              className="bg-red-500/10 text-red-400 hover:text-red-300"
              aria-label={tPanel("leaveParty")}
            >
              <LuLogOut size={15} />
            </PanelHeaderActionButton>

            <div className="pl-0.5">
              <AvatarDropdown size={28} />
            </div>
          </div>
        </div>
        ) : null}


        {/* ============================================== */}
        {/* DESKTOP VIEW - Original Layout (hidden on mobile devices, shown on desktop) */}
        {/* ============================================== */}
        {!isMobile ? (
        <div className="hidden md:flex flex-col gap-3 mb-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-md opacity-50"></div>
                <Image
                  src={constants.assets.logo}
                  alt="Logo"
                  width={26}
                  height={26}
                  className="relative"
                />
              </div>
              <h2 className="text-base font-bold text-white font-parkinsans">
                Movmash
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <PanelHeaderActionButton
                onClick={handleCopyLink}
                className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 group z-40"
                aria-label={tPanel("copyLink")}
              >
                {copied ? (
                  <LuCheck size={16} className="text-green-400 transition-colors" />
                ) : (
                  <LuLink size={16} className="text-white/70 group-hover:text-white transition-colors" />
                )}
                {copied && (
                  <div className="absolute top-full -left-8 -translate-x-1/2 mt-2 px-3 py-1.5 bg-zinc-900 text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-[110] shadow-xl">
                    {tCommon("linkCopied")}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-zinc-900"></div>
                  </div>
                )}
              </PanelHeaderActionButton>

              <PanelHeaderActionButton
                onClick={handleLeaveClick}
                className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl text-white/70 hover:from-red-600/20 hover:via-rose-600/20 hover:to-pink-600/20 hover:text-red-400"
                aria-label={tPanel("leaveParty")}
              >
                <LuLogOut size={16} />
              </PanelHeaderActionButton>

              <AvatarDropdown size={28} />
            </div>
          </div>

          {/* Desktop Tabs */}
          <div>
            <div
              className={desktopTabRailClass}
              style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
            >
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab;
                const tabTone = getTabTone(tab);

                return (
                  <button
                    key={tab}
                    onClick={() => selectTab(tab)}
                    className={`${desktopTabButtonBaseClass} ${
                      isActive ? "text-white" : tabTone.inactiveText
                    }`}
                    aria-pressed={isActive}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="panel-active-pill"
                        className={`pointer-events-none absolute inset-0 rounded-full ${tabTone.activePill}`}
                        transition={activeTabPillTransition}
                      />
                    ) : null}
                    <span className="relative z-10 whitespace-nowrap">{getTabLabel(tab)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        ) : null}

        {/* Content Area (Shared) */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full"
            style={{ touchAction: "pan-y" }}
            onPointerDown={handleContentPointerDown}
            onPointerMove={handleContentPointerMove}
            onPointerUp={handleContentPointerUp}
            onPointerCancel={handleContentPointerCancel}
          >
            <AnimatePresence custom={tabDirection} initial={false} mode="wait">
              <motion.div
                key={activeTab}
                custom={tabDirection}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabContentTransition}
                className="h-full"
              >
                {renderTabContent(activeTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;
