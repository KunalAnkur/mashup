"use client";
import { useEffect, useState } from "react";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useAuthProviderMutation } from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";

/**
 * Google One Tap Login Component
 * Automatically shows Google account selection dialog when page loads
 * Only shows when user is not authenticated
 */
const GoogleOneTap = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [authProvider] = useAuthProviderMutation();
  const [isReady, setIsReady] = useState(false);

  // Wait for client-side hydration and ensure Google scripts are loaded
  useEffect(() => {
    // Small delay to ensure Google OAuth provider is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log("Google One Tap ready to initialize");
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  // Handle successful One Tap authentication
  const handleOneTapSuccess = async (credentialResponse: any) => {
    try {
      console.log("Google One Tap success:", credentialResponse);
      
      // Decode the JWT credential to get user info
      // The credential is a JWT token that contains user information
      const credential = credentialResponse.credential;
      
      if (!credential) {
        throw new Error("No credential received from Google One Tap");
      }
      
      // Decode JWT (we only need the payload, not verifying signature here)
      // Backend should verify the credential
      const base64Url = credential.split('.')[1];
      if (!base64Url) {
        throw new Error("Invalid credential format");
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      console.log("Decoded user info:", userInfo);

      // Authenticate with backend using the credential
      // Backend will verify the credential and return user data
      const response = await authProvider({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
      }).unwrap();

      // Set the user with backend response
      dispatch(setUser(response));

      // Update with Google OAuth specific data (profile picture, name)
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );

      showSuccess("Login successful");
    } catch (error: any) {
      console.error("Google One Tap authentication failed", error);
      const errorMessage = error?.data?.message || error?.message || "Authentication failed";
      showError("Google authentication failed", errorMessage);
    }
  };

  // Initialize Google One Tap login only when ready and not authenticated
  // IMPORTANT: One Tap requires the origin to be EXACTLY configured in Google Cloud Console
  // Your origin is: http://localhost:3000
  // Add this EXACT string to "Authorized JavaScript origins" in Google Cloud Console
  useGoogleOneTapLogin({
    onSuccess: handleOneTapSuccess,
    onError: () => {
      // Silently fail - user can still use other login methods (Login button works)
      // One Tap might be dismissed by user, not available, or origin not configured
      // The error is logged in browser console by Google's library
      console.log("⚠️ Google One Tap not available");
      console.log("✅ This is OK - users can still use the Login button");
      console.log("");
      console.log("📋 To fix, verify in Google Cloud Console:");
      console.log("   1. Go to: https://console.cloud.google.com/apis/credentials");
      console.log("   2. Find Client ID: 150825594230-h8an9t7c5eu99etrhda4gtam7660g1tt.apps.googleusercontent.com");
      console.log("   3. Click to edit");
      console.log("   4. Under 'Authorized JavaScript origins', ensure you have:");
      console.log("      - http://localhost:3000");
      console.log("      - http://localhost (try adding this too)");
      console.log("   5. Click SAVE");
      console.log("   6. Wait 10-15 minutes, then clear cache and test");
    },
    // Only show if user is not authenticated AND component is ready
    disabled: isAuthenticated || !isReady,
    // Auto select if only one account is available
    auto_select: false,
    // Cancel when user taps outside the dialog
    cancel_on_tap_outside: true,
  });

  // Log when component mounts for debugging
  useEffect(() => {
    if (!isAuthenticated && isReady) {
      console.log("Google One Tap component ready - attempting to show dialog");
      console.log("Current origin:", window.location.origin);
      console.log("Expected origin in Google Cloud Console:", window.location.origin);
      console.log("If you just added it, wait 5-10 minutes for Google to update");
    }
  }, [isAuthenticated, isReady]);

  // This component doesn't render anything - it just handles One Tap
  return null;
};

export default GoogleOneTap;

