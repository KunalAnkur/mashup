"use client";

import { useState, useRef } from "react";
import Avatar from "./Avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/index";
import { logout } from "@/lib/store/slices/authSlice";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { IoLogOutOutline } from "react-icons/io5";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import Modal, {
  ModalConfirmContent,
  modalConfirmSurfaceClass,
} from "./Modal";

const dropdownSurfaceClass =
  "absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(33,33,39,0.96),rgba(24,24,30,0.96))] shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:w-60";
const dropdownContentClass = "flex flex-col gap-0.5 p-2";
const dropdownUserCardClass =
  "flex items-center gap-2.5 rounded-xl px-2.5 py-2";
const dropdownMetaTextClass = "text-[9px] md:text-[10px] text-white/42";
const dropdownDividerClass = "h-px w-full bg-white/8";
const dropdownLogoutButtonClass =
  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-white/80 transition-all duration-200 hover:bg-rose-500/10 hover:text-white";
const dropdownLogoutIconClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#571b24] via-[#7a1f34] to-[#5d1b34] text-rose-200 leading-none";

interface AvatarDropdownProps {
  size?: number;
  className?: string;
}

const AvatarDropdown = ({ size = 40, className = "" }: AvatarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const showEmailField = !user?.isGuestUser;

  // ALL useEffects REMOVED FOR TESTING - no event listeners at all

  // Determine avatar URL with fallbacks
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

  // Get user display name
  const getUserDisplayName = () => {
    if (isAuthenticated && user?.name) {
      return user.name;
    }
    if (isAuthenticated && user?.username) {
      return user.username;
    }
    return "Guest";
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsOpen(false);
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
      // Always clear local state and redirect, even if API call fails
      dispatch(logout());
      setShowLogoutConfirm(false);
      // Use window.location for a hard redirect to bypass any loading states
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
        onClick={toggleDropdown}
        className={`cursor-pointer transition-transform hover:scale-105 block leading-none relative ${className}`}
      >
        <Avatar
          url={getAvatarUrl()}
          alt={getUserDisplayName()}
          size={size}
          isDefault={!isAuthenticated || !user?.profile}
        />

        {/* Dropdown indicator */}
        {isOpen && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full"></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`${dropdownSurfaceClass} z-50`}>
          <div className={dropdownContentClass}>
            {/* User Info Section */}
            <div className={dropdownUserCardClass}>
              <Avatar
                url={getAvatarUrl()}
                alt={getUserDisplayName()}
                size={30}
                isDefault={!user?.profile}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h3 className="truncate font-parkinsans text-[11px] font-semibold text-white md:text-xs">
                  {getUserDisplayName()}
                </h3>
                {showEmailField && user?.email && (
                  <p className={`${dropdownMetaTextClass} mt-0.5 truncate`}>
                    {user.email}
                  </p>
                )}
                {!isAuthenticated && (
                  <p className={`${dropdownMetaTextClass} mt-0.5`}>
                    Not authenticated
                  </p>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className={dropdownDividerClass} />
            <button
              onClick={handleLogoutClick}
              className={dropdownLogoutButtonClass}
            >
              <div className={dropdownLogoutIconClass}>
                <IoLogOutOutline
                  size={13}
                  className="block md:h-[13px] md:w-[13px]"
                />
              </div>
              <p className="min-w-0 text-[11px] font-medium md:text-xs">
                {tCommon("logout")}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal - ALL onClick handlers REMOVED for testing */}
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
