"use client";
import { useEffect, useState } from "react";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useAuthProviderMutation } from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";

const GoogleOneTap = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [authProvider] = useAuthProviderMutation();
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      
      // Collect debug info
      const info = {
        origin: window.location.origin,
        href: window.location.href,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
      };
      setDebugInfo(info);
      
      console.log("🔍 Google One Tap Debug Info:", info);
      console.log("✅ Make sure these origins are in Google Cloud Console:");
      console.log("   • http://localhost");
      console.log("   • http://localhost:3000");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleOneTapSuccess = async (credentialResponse: any) => {
    try {
      console.log("✅ Google One Tap success!");
      
      const credential = credentialResponse.credential;
      
      if (!credential) {
        throw new Error("No credential received");
      }
      
      // Decode JWT
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

      console.log("User info decoded:", { 
        email: userInfo.email, 
        name: userInfo.name 
      });

      const response = await authProvider({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
      }).unwrap();

      dispatch(setUser(response));
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );

      showSuccess("Login successful");
    } catch (error: any) {
      console.error("❌ Google One Tap authentication failed:", error);
      const errorMessage = error?.data?.message || error?.message || "Authentication failed";
      showError("Authentication failed", errorMessage);
    }
  };

  const handleOneTapError = () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️ Google One Tap Failed to Initialize");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("📋 TROUBLESHOOTING CHECKLIST:");
    console.log("");
    console.log("1️⃣  Google Cloud Console Configuration:");
    console.log("   → https://console.cloud.google.com/apis/credentials");
    console.log("   → Client ID: 150825594230-h8an9t7c5eu99etrhda4gtam7660g1tt.apps.googleusercontent.com");
    console.log("   → Click 'Edit' and check 'Authorized JavaScript origins'");
    console.log("");
    console.log("2️⃣  Required Origins (ADD BOTH):");
    console.log("   ✓ http://localhost");
    console.log("   ✓ http://localhost:3000");
    console.log("");
    console.log("3️⃣  Your Current Origin:");
    console.log(`   → ${debugInfo?.origin || 'Not detected yet'}`);
    console.log("");
    console.log("4️⃣  If using 127.0.0.1:");
    console.log("   → Change package.json: 'next dev -H localhost'");
    console.log("   → Access via: http://localhost:3000 (NOT 127.0.0.1)");
    console.log("");
    console.log("5️⃣  Clear Everything:");
    console.log("   → Browser cache (Ctrl+Shift+Delete)");
    console.log("   → Google cookies (chrome://settings/cookies)");
    console.log("   → Hard reload (Ctrl+Shift+R)");
    console.log("");
    console.log("6️⃣  Disable Extensions:");
    console.log("   → Password managers (1Password, LastPass, etc.)");
    console.log("   → Try incognito mode");
    console.log("");
    console.log("7️⃣  Verify Client ID Type:");
    console.log("   → Must be 'OAuth 2.0 Client ID' (Web application)");
    console.log("   → NOT API Key or Service Account");
    console.log("");
    console.log("8️⃣  Wait for Google:");
    console.log("   → Changes take 5-10 minutes to propagate");
    console.log("");
    console.log("✅ Users can still login with the Login button!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  };

  useGoogleOneTapLogin({
    onSuccess: handleOneTapSuccess,
    onError: handleOneTapError,
    disabled: isAuthenticated || !isReady,
    auto_select: false,
    cancel_on_tap_outside: false,
  });

  return null;
};

export default GoogleOneTap;