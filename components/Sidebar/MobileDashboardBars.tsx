"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { LuHouse, LuGamepad2, LuUserRound, LuLogIn } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackCTAClicked } from "@/lib/analytics";
import Logo from "../UI/Logo";
import LoginDropdown from "../Header/LoginDropdown";
import SidebarProfileMenu from "./SidebarProfileMenu";
import { useDropdownDismiss } from "../UI/useDropdownDismiss";
import {
  dashMobileTopbarClass,
  dashMobileBottombarClass,
  dashMobileTabItemClass,
  dashMobileTabItemActiveClass,
  dashMobileProfileSheetClass,
  dashLogoWordClass,
  dashLoginPopoverOverrideClass,
  dashLoginTriggerClass,
} from "../UI/classTokens";

const MobileDashboardBars = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const t = useTranslations("sidebar");
  const tHome = useTranslations("home");
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useDropdownDismiss({
    isOpen: loginOpen,
    onClose: () => setLoginOpen(false),
    refs: [loginRef],
    closeOnEscape: true,
    pointerEvent: "pointerdown",
  });

  const isHome = pathname === "/" && !profileSheetOpen;
  const isGames = pathname?.startsWith("/games");

  const goTab = (path: string, cta: Parameters<typeof trackCTAClicked>[0]) => {
    setProfileSheetOpen(false);
    trackCTAClicked(cta);
    router.push(path);
  };

  return (
    <>
      <div className={dashMobileTopbarClass}>
        <Link href="/" className="flex items-center gap-2">
          <Logo height={24} width={24} custom />
          <span className={dashLogoWordClass}>{tHome("brand")}</span>
        </Link>
      </div>

      <nav className={dashMobileBottombarClass}>
        <button
          type="button"
          onClick={() => goTab("/", "create_room")}
          className={`${dashMobileTabItemClass} ${isHome ? dashMobileTabItemActiveClass : ""}`}
        >
          <LuHouse size={18} />
          {t("home")}
        </button>
        <button
          type="button"
          onClick={() => goTab("/games", "games")}
          className={`${dashMobileTabItemClass} ${isGames ? dashMobileTabItemActiveClass : ""}`}
        >
          <LuGamepad2 size={18} />
          {t("game")}
        </button>
        <button
          type="button"
          onClick={() => setProfileSheetOpen(true)}
          className={`${dashMobileTabItemClass} ${profileSheetOpen ? dashMobileTabItemActiveClass : ""}`}
        >
          <LuUserRound size={18} />
          {t("profile")}
        </button>
      </nav>

      {profileSheetOpen && (
        <div className={dashMobileProfileSheetClass}>
          {isAuthenticated ? (
            <div className="flex flex-col gap-px">
              <SidebarProfileMenu onNavigate={() => setProfileSheetOpen(false)} />
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
                  panelClassName={`!left-0 !right-0 !w-full ${dashLoginPopoverOverrideClass}`}
                  compact
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MobileDashboardBars;
