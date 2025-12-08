"use client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useContinueAsGuestMutation } from "@/lib/store/api/authApi";
import { setUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";
import { useState } from "react";

const ProfileHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [continueAsGuest, { isLoading: isGuestLoading }] = useContinueAsGuestMutation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if we're on a page that should have fixed positioning
  const isFixedPage = pathname === "/" || pathname === "/not-found";

  const handleContinueAsGuest = async () => {
    if (isProcessing || isGuestLoading) return;
    
    setIsProcessing(true);
    try {
      const response = await continueAsGuest().unwrap();
      dispatch(setUser(response));
      showSuccess("Welcome! You're now signed in as a guest");
    } catch (error: any) {
      console.error("Guest signup failed:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to continue as guest";
      showError("Guest signup failed", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // For stream/sync pages, it will be integrated into the header bar
  // For other pages, it should be fixed
  if (isFixedPage) {
    return (
      <div className="fixed top-4 right-4 md:top-6 md:right-4 lg:top-8 lg:right-4 z-50 flex items-center justify-end gap-3">
        {isAuthenticated ? (
          <AvatarDropdown size={40} />
        ) : (
          <>
            <button
              onClick={handleContinueAsGuest}
              disabled={isProcessing || isGuestLoading}
              className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing || isGuestLoading ? "Loading..." : "Continue as Guest"}
            </button>
            <button
              onClick={() => router.push("/login")}
              className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
            >
              Login
            </button>
          </>
        )}
      </div>
    );
  }

  // For stream/sync pages, return without fixed positioning (will be in header bar)
  return (
    <>
      {isAuthenticated ? (
        <AvatarDropdown size={40} />
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleContinueAsGuest}
            disabled={isProcessing || isGuestLoading}
            className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing || isGuestLoading ? "Loading..." : "Continue as Guest"}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
          >
            Login
          </button>
        </div>
      )}
    </>
  );
};

export default ProfileHeader;

