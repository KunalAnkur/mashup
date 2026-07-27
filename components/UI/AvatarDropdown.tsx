"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/index";
import { logout } from "@/lib/store/slices/authSlice";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { useGetMySubscriptionQuery } from "@/lib/store/api/userApi";
import { setSubscription } from "@/lib/store/slices/subscriptionSlice";
import { useEffect } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { LuCrown, LuSparkles } from "react-icons/lu";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import Modal, {
  ModalConfirmContent,
  modalConfirmSurfaceClass,
} from "./Modal";
import {
  appDropdownLabelClass,
  appDropdownLogoutIconChipClass,
  appDropdownMetaTextClass,
} from "./classTokens";
import { useDropdownDismiss } from "./useDropdownDismiss";
import {
  DropdownActionRow,
  DropdownDivider,
  DropdownHeaderRow,
  DropdownPanel,
} from "./DropdownPrimitives";
import { getTierDisplayName, hasActivePaidSubscription } from "@/utils/subscription";

interface AvatarDropdownProps {
  size?: number;
  className?: string;
}

const AvatarDropdown = ({ size = 40, className = "" }: AvatarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuId = useId();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );
  const subscription = useSelector(
    (state: RootState) => state.subscription.subscription
  );
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const showEmailField = !user?.isGuestUser;

  // Fetch subscription when authenticated so premium status is always current
  const { data: subscriptionData } = useGetMySubscriptionQuery(undefined, {
    skip: !isAuthenticated || !!user?.isGuestUser,
  });
  useEffect(() => {
    if (subscriptionData?.data) {
      dispatch(setSubscription(subscriptionData.data));
    }
  }, [subscriptionData, dispatch]);

  const isPremiumUser = hasActivePaidSubscription(subscription);
  const tierDisplayName = getTierDisplayName(subscription?.tier);

  useDropdownDismiss({
    isOpen,
    onClose: () => setIsOpen(false),
    refs: [dropdownRef],
    closeOnEscape: true,
    pointerEvent: "pointerdown",
  });

  const getAvatarUrl = () => {
    if (isAuthenticated && user?.profile) {
      return user.profile;
    }
    if (isAuthenticated && user?.name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=random&color=fff&size=200`;
    }
    return "https://randomuser.me/api/portraits/women/44.jpg";
  };

  const getUserDisplayName = () => {
    if (isAuthenticated && user?.name) return user.name;
    if (isAuthenticated && user?.username) return user.username;
    return "Guest";
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };

  const handleSubscriptionClick = () => {
    setIsOpen(false);
    router.push("/subscription");
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

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={dropdownMenuId}
        className={`cursor-pointer transition-transform hover:scale-105 block leading-none relative ${className}`}
      >
        <Avatar
          url={getAvatarUrl()}
          alt={getUserDisplayName()}
          size={size}
          isPremium={isPremiumUser}
          isDefault={!isAuthenticated || !user?.profile}
        />

        {/* Paid tier crown badge */}
        {isPremiumUser && (
          <span
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 shadow-md shadow-rose-500/40 ring-[1.5px] ring-black/40"
            aria-label={tierDisplayName}
          >
            <LuCrown size={8} className="text-white" />
          </span>
        )}

        {/* Dropdown indicator (non-premium) */}
        {isOpen && !isPremiumUser && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <DropdownPanel
          id={dropdownMenuId}
          role="menu"
          aria-label={tCommon("accountMenu")}
          className="z-50 w-44 md:w-48"
        >
          {/* User Info Section */}
          <DropdownHeaderRow
            avatar={
              <Avatar
                url={getAvatarUrl()}
                alt={getUserDisplayName()}
                size={30}
                isPremium={isPremiumUser}
                isDefault={!user?.profile}
              />
            }
            title={getUserDisplayName()}
            titleClassName={`truncate font-parkinsans font-semibold text-white ${appDropdownLabelClass}`}
            meta={
              isPremiumUser ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-rose-300 ring-1 ring-rose-500/25">
                  <LuCrown size={8} />
                  <span>{tierDisplayName}</span>
                </span>
              ) : showEmailField && user?.email ? user.email : null
            }
            metaClassName={`${appDropdownMetaTextClass} mt-0.5 truncate`}
            secondary={!isAuthenticated ? tCommon("notAuthenticated") : null}
            secondaryClassName={`${appDropdownMetaTextClass} mt-0.5`}
          />

          {/* Menu Items */}
          <DropdownDivider />
          <DropdownActionRow
            onClick={handleSubscriptionClick}
            role="menuitem"
            iconChipClassName={
              isPremiumUser
                ? "bg-gradient-to-br from-rose-500/25 via-pink-500/25 to-fuchsia-500/25 text-rose-300 ring-1 ring-rose-500/30"
                : "bg-white/[0.06] text-amber-100"
            }
            icon={
              isPremiumUser
                ? <LuCrown size={13} className="block md:h-[13px] md:w-[13px]" />
                : <LuSparkles size={13} className="block md:h-[13px] md:w-[13px]" />
            }
            label={isPremiumUser ? tierDisplayName : tCommon("upgrade")}
          />
          <DropdownDivider />
          <DropdownActionRow
            onClick={handleLogoutClick}
            role="menuitem"
            variant="danger"
            iconChipClassName={appDropdownLogoutIconChipClass}
            icon={
              <IoLogOutOutline
                size={13}
                className="block md:h-[13px] md:w-[13px]"
              />
            }
            label={tCommon("logout")}
          />
        </DropdownPanel>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        open={showLogoutConfirm}
        onClose={handleLogoutCancel}
        closeOnBackdropClick={false}
        closeOnEscape={false}
        overlayClassName="logout-modal z-[9999]"
        panelClassName={modalConfirmSurfaceClass}
      >
        <ModalConfirmContent
          icon={<IoLogOutOutline size={18} className="text-current" />}
          title={tCommon("confirmLogout")}
          message={tCommon("confirmLogoutMessage")}
          cancelLabel={tCommon("cancel")}
          confirmLabel={isLoggingOut ? tCommon("loggingOut") : tCommon("logout")}
          onCancel={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
          confirmDisabled={isLoggingOut}
        />
      </Modal>
    </div>
  );
};

export default AvatarDropdown;
