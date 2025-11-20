"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/index";
import { logout } from "@/lib/store/slices/authSlice";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { FcGoogle } from "react-icons/fc";
import { IoLogOutOutline } from "react-icons/io5";

interface AvatarDropdownProps {
  size?: number;
  className?: string;
}

const AvatarDropdown = ({ size = 40, className = "" }: AvatarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );
  const [logoutApi, logoutState] = useLogoutMutation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close confirmation dialog when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = () => {
      if (showLogoutConfirm) {
        setShowLogoutConfirm(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showLogoutConfirm) {
        setShowLogoutConfirm(false);
      }
    };

    if (showLogoutConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [showLogoutConfirm]);

  // Determine avatar URL with fallbacks
  const getAvatarUrl = () => {
    if (isAuthenticated && user?.profile) {
      return user.profile; // Use Google profile photo if available
    }
    // Fallback to default avatar based on user info
    if (isAuthenticated && user?.name) {
      // Generate initials-based avatar or use a default image
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=random&color=fff&size=200`;
    }
    // Ultimate fallback
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
    console.log("Logout button clicked");
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };

  const handleLogoutConfirm = async () => {
    console.log("Logout confirmed, starting logout process...");
    console.log("Current auth state:", { isAuthenticated, user });
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);

    try {
      if (isAuthenticated) {
        console.log("Making logout API call...");
        console.log("API Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
        console.log("Current token:", token || "No token found");
        const result = await logoutApi().unwrap();
        console.log("Logout API call successful:", result);
      } else {
        console.log("User not authenticated, skipping API call");
      }

      // Always clear local state
      dispatch(logout());
      setShowLogoutConfirm(false);
      console.log("Local state cleared, redirecting to home page...");
      // Redirect to home page after logout
      router.push("/");
      console.log("Router.push called");

      // Fallback redirect using window.location
      setTimeout(() => {
        console.log("Fallback redirect using window.location");
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API call fails, clear local state
      dispatch(logout());
      setShowLogoutConfirm(false);
      console.log(
        "Local state cleared after error, redirecting to home page..."
      );
      // Redirect to home page after logout
      router.push("/");
      console.log("Router.push called (error case)");

      // Fallback redirect using window.location
      setTimeout(() => {
        console.log("Fallback redirect using window.location (error case)");
        window.location.href = "/";
      }, 100);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const toggleDropdown = () => {
    console.log("Toggle dropdown clicked, auth state:", {
      isAuthenticated,
      user,
      token: token ? "Token exists" : "No token",
    });
    console.log("Environment variables:", {
      API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
    // Allow dropdown to open even when not authenticated for testing
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block " ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className={`cursor-pointer transition-transform hover:scale-105 block leading-none ${className}`}
      >
        <Avatar
          url={getAvatarUrl()}
          alt={getUserDisplayName()}
          size={size}
          isDefault={!isAuthenticated || !user?.profile}
        />

        {/* Google OAuth indicator */}
        {isAuthenticated && user?.profile && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <FcGoogle size={12} />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar
                url={getAvatarUrl()}
                alt={getUserDisplayName()}
                size={48}
                isDefault={!user?.profile}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">
                  {getUserDisplayName()}
                </h3>
                {user?.email && (
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                )}
                {!isAuthenticated && (
                  <p className="text-gray-400 text-sm">Not authenticated</p>
                )}
                {user?.profile && (
                  <div className="flex items-center gap-1 mt-1">
                    <FcGoogle size={12} />
                    <span className="text-green-400 text-xs">
                      Google Account
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
            >
              <IoLogOutOutline size={18} />
              <span>Logout</span>
            </button>

            {/* Test logout button that works without authentication */}
            {!isAuthenticated && (
              <button
                onClick={() => {
                  console.log("Test logout clicked");
                  dispatch(logout());
                  setIsOpen(false);
                  console.log("Redirecting to home page from test logout...");
                  router.push("/");
                  console.log("Router.push called (test logout)");

                  // Fallback redirect using window.location
                  setTimeout(() => {
                    console.log(
                      "Fallback redirect using window.location (test logout)"
                    );
                    window.location.href = "/";
                  }, 100);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-300 hover:bg-red-700 hover:text-white rounded-md transition-colors mt-2"
              >
                <IoLogOutOutline size={18} />
                <span>Test Logout (No Auth)</span>
              </button>
            )}

            {/* Test API call button */}
            <button
              onClick={async () => {
                console.log("Test API call clicked");
                console.log("Current token:", token || "No token");
                try {
                  console.log(
                    "Testing API call to:",
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/logout`
                  );
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/logout`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: token
                          ? `Bearer ${token}`
                          : "Bearer test-token",
                      },
                    }
                  );
                  const result = await response.json();
                  console.log("API call result:", result);
                } catch (error) {
                  console.error("API call failed:", error);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-blue-300 hover:bg-blue-700 hover:text-white rounded-md transition-colors mt-2"
            >
              <span>Test API Call (with actual token)</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to logout? You will be redirected to the
              home page.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={logoutState.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {logoutState.isLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;
