"use client";

import { useId, useRef, useState } from "react";
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
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const showEmailField = !user?.isGuestUser;

  useDropdownDismiss({
    isOpen,
    onClose: () => setIsOpen(false),
    refs: [dropdownRef],
    closeOnEscape: true,
    pointerEvent: "pointerdown",
  });

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
          isDefault={!isAuthenticated || !user?.profile}
        />

        {/* Dropdown indicator */}
        {isOpen && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full"></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <DropdownPanel
          id={dropdownMenuId}
          role="menu"
          aria-label="Account menu"
          className="z-50"
        >
          {/* User Info Section */}
          <DropdownHeaderRow
            avatar={
              <Avatar
                url={getAvatarUrl()}
                alt={getUserDisplayName()}
                size={30}
                isDefault={!user?.profile}
              />
            }
            title={getUserDisplayName()}
            titleClassName={`truncate font-parkinsans font-semibold text-white ${appDropdownLabelClass}`}
            meta={showEmailField && user?.email ? user.email : null}
            metaClassName={`${appDropdownMetaTextClass} mt-0.5 truncate`}
            secondary={!isAuthenticated ? "Not authenticated" : null}
            secondaryClassName={`${appDropdownMetaTextClass} mt-0.5`}
          />

          {/* Menu Items */}
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
