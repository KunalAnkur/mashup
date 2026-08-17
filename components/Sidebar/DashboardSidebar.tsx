"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  LuHouse,
  LuRadio,
  LuChevronDown,
  LuMonitor,
  LuFileUp,
  LuLink2,
  LuYoutube,
  LuGamepad2,
  LuInfo,
  LuChevronRight,
  LuLogIn,
} from "react-icons/lu";
import { LuSparkles } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { sidebarIllustration } from "@/constants/assets";
import { useTranslations } from "@/i18n/I18nProvider";
import { useScreenShareSupport } from "@/hooks";
import { trackCTAClicked } from "@/lib/analytics";
import Logo from "../UI/Logo";
import LoginDropdown from "../Header/LoginDropdown";
import SidebarProfileMenu from "./SidebarProfileMenu";
import SidebarAvatarChip from "./SidebarAvatarChip";
import { useDropdownDismiss } from "../UI/useDropdownDismiss";
import {
  dashRailLeftClass,
  dashLogoRowClass,
  dashLogoWordClass,
  dashNavClass,
  dashNavItemBaseClass,
  dashNavItemActiveClass,
  dashNavItemHoverClass,
  dashNavItemBadgeClass,
  dashNavChevClass,
  dashSubmenuOuterClass,
  dashSubmenuListClass,
  dashSubmenuItemClass,
  dashSubmenuItemDefaultClass,
  dashSubmenuItemActiveClass,
  dashCozyCardClass,
  dashCozyArtClass,
  dashCozyImgClass,
  dashCozyScrimClass,
  dashCozyCopyClass,
  dashCozyTitleClass,
  dashCozyDescriptionClass,
  dashAccountZoneClass,
  dashUpgradeButtonClass,
  dashProfileTriggerClass,
  dashLoginTriggerClass,
  dashPopoverPanelClass,
  dashPopoverBackdropClass,
  dashLoginPopoverOverrideClass,
} from "../UI/classTokens";

const DashboardSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const t = useTranslations("sidebar");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");

  const [watchTogetherOpen, setWatchTogetherOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  useDropdownDismiss({
    isOpen: profileOpen,
    onClose: () => setProfileOpen(false),
    refs: [profileRef],
    closeOnEscape: true,
    pointerEvent: "pointerdown",
  });
  useDropdownDismiss({
    isOpen: loginOpen,
    onClose: () => setLoginOpen(false),
    refs: [loginRef],
    closeOnEscape: true,
    pointerEvent: "pointerdown",
  });

  const canScreenShare = useScreenShareSupport();

  const isHome = pathname === "/";
  const isGames = pathname?.startsWith("/games");
  const isScreenShare = pathname === "/stream/screen";
  const isFileShare = pathname === "/stream";
  const isAddUrl = pathname === "/sync";
  const isYoutube = pathname === "/youtube";

  const go = (path: string, cta: Parameters<typeof trackCTAClicked>[0]) => {
    trackCTAClicked(cta);
    router.push(path);
  };

  return (
    <aside className={dashRailLeftClass}>
      <Link href="/" className={dashLogoRowClass}>
        <Logo height={30} width={30} custom />
        <span className={dashLogoWordClass}>{tHome("brand")}</span>
      </Link>

      <nav className={dashNavClass}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`${dashNavItemBaseClass} ${isHome ? dashNavItemActiveClass : dashNavItemHoverClass}`}
        >
          <LuHouse size={18} className={isHome ? "text-pink-600" : undefined} />
          {t("home")}
        </button>

        <button
          type="button"
          onClick={() => setWatchTogetherOpen((v) => !v)}
          className={`${dashNavItemBaseClass} ${dashNavItemHoverClass}`}
        >
          <LuRadio size={18} />
          {t("watchTogether")}
          <LuChevronDown
            size={15}
            className={`${dashNavChevClass} ${watchTogetherOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={dashSubmenuOuterClass}
          style={{ gridTemplateRows: watchTogetherOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className={dashSubmenuListClass}>
              {/* The rail is hidden under 760px, but a tablet can be wide enough to show it and
                  still have no getDisplayMedia — so this follows the capability, not the width. */}
              {canScreenShare && (
                <button
                  type="button"
                  onClick={() => go("/stream/screen", "stream")}
                  className={`${dashSubmenuItemClass} ${isScreenShare ? dashSubmenuItemActiveClass : dashSubmenuItemDefaultClass}`}
                >
                  <LuMonitor size={15} />
                  {tHome("screenShare")}
                </button>
              )}
              <button
                type="button"
                onClick={() => go("/stream", "stream")}
                className={`${dashSubmenuItemClass} ${isFileShare ? dashSubmenuItemActiveClass : dashSubmenuItemDefaultClass}`}
              >
                <LuFileUp size={15} />
                {tHome("fileShare")}
              </button>
              <button
                type="button"
                onClick={() => go("/sync", "sync")}
                className={`${dashSubmenuItemClass} ${isAddUrl ? dashSubmenuItemActiveClass : dashSubmenuItemDefaultClass}`}
              >
                <LuLink2 size={15} />
                {tHome("addUrl")}
              </button>
              <button
                type="button"
                onClick={() => go("/youtube", "sync")}
                className={`${dashSubmenuItemClass} ${isYoutube ? dashSubmenuItemActiveClass : dashSubmenuItemDefaultClass}`}
              >
                <LuYoutube size={15} />
                {tHome("youtube")}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => go("/games", "games")}
          className={`${dashNavItemBaseClass} ${isGames ? dashNavItemActiveClass : dashNavItemHoverClass}`}
        >
          <LuGamepad2 size={18} className={isGames ? "text-pink-600" : undefined} />
          {t("game")}
          <span className={dashNavItemBadgeClass}>NEW</span>
        </button>

        <a
          href="https://movmash.com/about"
          target="_blank"
          rel="noopener noreferrer"
          className={`${dashNavItemBaseClass} ${dashNavItemHoverClass}`}
        >
          <LuInfo size={18} />
          {t("about")}
        </a>
      </nav>

      <div className={dashCozyCardClass}>
        <div className={dashCozyArtClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sidebarIllustration}
            alt=""
            loading="lazy"
            decoding="async"
            className={dashCozyImgClass}
          />
          <div className={dashCozyScrimClass} />
        </div>
        <div className={dashCozyCopyClass}>
          <h3 className={dashCozyTitleClass}>{t("cozyTitle")}</h3>
          <p className={dashCozyDescriptionClass}>{t("cozyDescription")}</p>
        </div>
      </div>

      <div className={dashAccountZoneClass}>
        <Link href="/pricing" className={dashUpgradeButtonClass}>
          <LuSparkles size={14} />
          {tCommon("upgradePlan")}
        </Link>

        {isAuthenticated ? (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className={dashProfileTriggerClass}
            >
              <SidebarAvatarChip name={user?.name || user?.username || "?"} photoUrl={user?.profile} compact />
              <SidebarProfileTriggerSummary />
              <LuChevronRight
                size={15}
                className={`ml-auto shrink-0 text-dashTextMute transition-transform ${
                  profileOpen ? "rotate-90" : ""
                }`}
              />
            </button>
            {profileOpen && (
              <>
                <div className={dashPopoverBackdropClass} onClick={() => setProfileOpen(false)} />
                <div className={dashPopoverPanelClass}>
                  <SidebarProfileMenu onNavigate={() => setProfileOpen(false)} />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative" ref={loginRef}>
            <button
              type="button"
              onClick={() => setLoginOpen((v) => !v)}
              className={dashLoginTriggerClass}
            >
              <LuLogIn size={14} />
              {tHome("login")}
            </button>
            {loginOpen && (
              <LoginDropdown
                onClose={() => setLoginOpen(false)}
                panelClassName={`!bottom-[calc(100%+10px)] !top-auto !left-0 !right-0 !w-full ${dashLoginPopoverOverrideClass}`}
                compact
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

const SidebarProfileTriggerSummary = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const tCommon = useTranslations("common");
  const displayName = isAuthenticated ? user?.name || user?.username || "" : "";
  // Same fix as SidebarProfileMenu/AvatarDropdown — a guest's auto-generated username reads
  // exactly like a real account's handle, so label it explicitly instead.
  const handle = !isAuthenticated
    ? ""
    : user?.isGuestUser
      ? tCommon("guestAccount")
      : user?.username
        ? `@${user.username}`
        : "";
  return (
    <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
      <span className="w-full truncate text-[13.5px] font-semibold text-dashText">{displayName}</span>
      {handle ? (
        <span className="w-full truncate text-[11.5px] text-dashTextMute">{handle}</span>
      ) : null}
    </span>
  );
};

export default DashboardSidebar;
