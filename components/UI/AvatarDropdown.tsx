"use client";

import { useState, useRef } from "react";
import Avatar from "./Avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/index";
import { logout } from "@/lib/store/slices/authSlice";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { FcGoogle } from "react-icons/fc";
import { IoLogOutOutline } from "react-icons/io5";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import Modal, {
  ModalConfirmContent,
  modalConfirmSurfaceClass,
} from "./Modal";

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

        {/* Google OAuth indicator */}
        {isAuthenticated && user?.profile && (
          <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-white rounded-full p-0.5 md:p-1 shadow-md z-10">
            <FcGoogle size={10} className="md:w-3 md:h-3" />
          </div>
        )}

        {/* Dropdown indicator */}
        {isOpen && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full"></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 md:mt-2 w-64 md:w-72 bg-gradient-to-br from-[#1f1f23] to-[#27272a] border border-white/10 rounded-lg md:rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* User Info Section */}
          <div className="p-3 md:p-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="relative">
                <Avatar
                  url={getAvatarUrl()}
                  alt={getUserDisplayName()}
                  size={40}
                  isDefault={!user?.profile}
                />
                {user?.profile && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                    <FcGoogle size={8} className="md:w-2.5 md:h-2.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-xs md:text-sm truncate font-parkinsans">
                  {getUserDisplayName()}
                </h3>
                {user?.email && (
                  <p className="text-gray-400 text-[10px] md:text-xs truncate mt-0.5">
                    {user.email}
                  </p>
                )}
                {!isAuthenticated && (
                  <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">
                    Not authenticated
                  </p>
                )}
                {user?.profile && (
                  <div className="flex items-center gap-1 mt-1 md:mt-1.5">
                    <FcGoogle size={8} className="md:w-2.5 md:h-2.5" />
                    <span className="text-green-400 text-[10px] md:text-xs font-medium">
                      Google Account
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 md:p-2">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 text-left text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all duration-200 group"
            >
              <div className="p-1 md:p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <IoLogOutOutline size={14} className="text-red-400 md:w-4 md:h-4" />
              </div>
              <span className="text-xs md:text-sm font-medium">{tCommon("logout")}</span>
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
