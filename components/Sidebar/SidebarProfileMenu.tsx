"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  LuCrown,
  LuSparkles,
  LuChevronRight,
  LuHistory,
  LuCircleHelp,
  LuInfo,
  LuLogOut,
} from "react-icons/lu";
import { RootState } from "@/lib/store";
import { logout } from "@/lib/store/slices/authSlice";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { useGetMySubscriptionQuery } from "@/lib/store/api/userApi";
import { setSubscription } from "@/lib/store/slices/subscriptionSlice";
import { useTranslations } from "@/i18n/I18nProvider";
import { showError } from "@/utils/toast";
import { getTierDisplayName, hasActivePaidSubscription } from "@/utils/subscription";
import Modal, { ModalConfirmContent, modalConfirmSurfaceClass } from "../UI/Modal";
import SidebarAvatarChip from "./SidebarAvatarChip";
import {
  dashPopoverRowClass,
  dashPopoverRowIconClass,
  dashPopoverRowIconUpgradeClass,
  dashPopoverDividerClass,
  dashPopoverDangerRowClass,
  dashProfileNameClass,
  dashProfileHandleClass,
} from "../UI/classTokens";

type SidebarProfileMenuProps = {
  onNavigate?: () => void;
};

const SidebarProfileMenu = ({ onNavigate }: SidebarProfileMenuProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const subscription = useSelector((state: RootState) => state.subscription.subscription);
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const tToast = useTranslations("toast");

  const { data: subscriptionData } = useGetMySubscriptionQuery(undefined, {
    skip: !isAuthenticated || !!user?.isGuestUser,
  });
  useEffect(() => {
    if (subscriptionData?.data) dispatch(setSubscription(subscriptionData.data));
  }, [subscriptionData, dispatch]);

  const isPremiumUser = hasActivePaidSubscription(subscription);
  const tierDisplayName = getTierDisplayName(subscription?.tier);
  const displayName = user?.name || user?.username || "Guest";
  // Guests get an auto-generated username/no email — showing that verbatim reads exactly
  // like a real account's handle. Show an explicit "Guest account" label instead so it's
  // never mistaken for a logged-in user.
  const handle = user?.isGuestUser
    ? tCommon("guestAccount")
    : user?.username
      ? `@${user.username}`
      : user?.email || "";

  const go = (path: string) => {
    onNavigate?.();
    router.push(path);
  };

  const handleLogoutConfirm = async () => {
    try {
      if (isAuthenticated && token) {
        await logoutApi().unwrap();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      showError(tToast("logoutFailed"), tToast("errorLoggingOut"));
    } finally {
      dispatch(logout());
      setShowLogoutConfirm(false);
      window.location.href = "/";
    }
  };

  return (
    <>
      <button type="button" className={dashPopoverRowClass} onClick={() => go("/profile")}>
        <SidebarAvatarChip name={displayName} photoUrl={user?.profile} />
        <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
          <span className={`w-full ${dashProfileNameClass}`}>{displayName}</span>
          <span className={`w-full ${dashProfileHandleClass}`}>{handle}</span>
        </span>
        <LuChevronRight size={15} className="ml-auto shrink-0 text-dashTextMute" />
      </button>

      <div className={dashPopoverDividerClass} />

      <button type="button" className={dashPopoverRowClass} onClick={() => go("/pricing")}>
        <span className={dashPopoverRowIconUpgradeClass}>
          {isPremiumUser ? <LuCrown size={14} /> : <LuSparkles size={14} />}
        </span>
        {isPremiumUser ? tierDisplayName : tCommon("upgradePlan")}
        <LuChevronRight size={15} className="ml-auto shrink-0 text-dashTextMute" />
      </button>

      <button type="button" className={dashPopoverRowClass} onClick={() => go("/subscription")}>
        <span className={dashPopoverRowIconClass}>
          <LuHistory size={14} />
        </span>
        {tSidebar("purchaseHistory")}
        <LuChevronRight size={15} className="ml-auto shrink-0 text-dashTextMute" />
      </button>

      <a
        className={dashPopoverRowClass}
        href="https://movmash.com/contact"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={dashPopoverRowIconClass}>
          <LuCircleHelp size={14} />
        </span>
        {tSidebar("helpSupport")}
        <LuChevronRight size={15} className="ml-auto shrink-0 text-dashTextMute" />
      </a>

      <a
        className={dashPopoverRowClass}
        href="https://movmash.com/about"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={dashPopoverRowIconClass}>
          <LuInfo size={14} />
        </span>
        {tSidebar("aboutMovmash")}
        <LuChevronRight size={15} className="ml-auto shrink-0 text-dashTextMute" />
      </a>

      <div className={dashPopoverDividerClass} />

      <button
        type="button"
        className={dashPopoverDangerRowClass}
        onClick={() => setShowLogoutConfirm(true)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-rose-500/10 text-rose-600">
          <LuLogOut size={14} />
        </span>
        {tCommon("logout")}
      </button>

      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        closeOnBackdropClick={false}
        closeOnEscape={false}
        overlayClassName="logout-modal z-[9999]"
        panelClassName={modalConfirmSurfaceClass}
      >
        <ModalConfirmContent
          icon={<LuLogOut size={18} className="text-current" />}
          title={tCommon("confirmLogout")}
          message={tCommon("confirmLogoutMessage")}
          cancelLabel={tCommon("cancel")}
          confirmLabel={isLoggingOut ? tCommon("loggingOut") : tCommon("logout")}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirm}
          confirmDisabled={isLoggingOut}
        />
      </Modal>
    </>
  );
};

export default SidebarProfileMenu;
