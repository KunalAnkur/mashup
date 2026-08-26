"use client";
import { useState } from "react";
import { Button, Logo } from "../UI";
import GoogleButton from "../GoogleAuth/GoogleButton";
import {
  useAuthProviderMutation,
  useContinueAsGuestMutation,
  useLoginMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useSearchParams } from "next/navigation";
import { ImSpinner2 } from "react-icons/im";
import { showError, showSuccess } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackLogin, trackSignup } from "@/lib/analytics";
import { zincGlassStrongBorderedSurfaceClass } from "@/components/UI/classTokens";


const guestContinueButtonClass =
  "w-full bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
const loginContainerSurfaceClass =
  `${zincGlassStrongBorderedSurfaceClass} w-full max-w-md rounded-3xl p-8 shadow-xl mx-auto md:p-10`;
const loginContainerSeparatorClass = "flex items-center gap-3 py-0.5";
const loginContainerSeparatorLineClass = "h-px flex-1 bg-zinc-600/20";

type GoogleAuthUserInfo = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

/**
 * Whether this sign-in exists to get someone into somebody else's room.
 *
 * The redirect is the only signal available here, and it is enough: a room is the one
 * destination reached by being invited to it. Everything else that sends a signed-out
 * visitor to this page — `/stream/screen`, `/sync`, `/pricing`, `/subscription` — is
 * something they are starting themselves.
 *
 * Anchored rather than a substring search, so a query string that merely mentions a room
 * (`/pricing?from=/room/x`) is not mistaken for one.
 */
const isRoomInviteRedirect = (redirect: string | null | undefined): boolean =>
  typeof redirect === "string" && redirect.startsWith("/room/");

const LoginContainer = () => {
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");

  /**
   * Guest accounts are for joining, never for hosting — guardian enforces exactly this with
   * `requireFullAccount` on room creation (MOVMASH.md §4.3: the room's daily allowance is
   * funded by its host, so a host who could be re-minted by clearing browser storage would
   * make the limit meaningless).
   *
   * Offering the button on a create flow therefore sold a door that does not open: the guest
   * account was created, the user was returned to `/stream/screen`, and the 403 arrived only
   * once they had picked a tab and pressed Start Sharing. Guardian's own comment says "the
   * client shows a sign-in prompt before reaching here" — this is that prompt, which until
   * now did not exist.
   */
  const offerGuestAccount = isRoomInviteRedirect(redirectParam);

  const buildAuthRoute = (path: string) =>
    redirectParam ? `${path}?redirect=${encodeURIComponent(redirectParam)}` : path;

  const [loginUser, loginState] = useLoginMutation();
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const tAuth = useTranslations("auth.login");
  const [authProvider] = useAuthProviderMutation();
  const [continueAsGuest, { isLoading: isGuestLoading }] = useContinueAsGuestMutation();
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);
  // GDPR requires opt-in, so this must default to false and never be pre-checked.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const dispatch = useDispatch();

  const handleGoogleAuthSuccess = async (userInfo: GoogleAuthUserInfo) => {
    try {
      const response = await authProvider({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
        // Guardian only records this when the account is created — signing in again with
        // the box unchecked will not opt an existing user out.
        marketing_emails_opt_in: marketingOptIn,
      }).unwrap();

      dispatch(setUser(response));
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );
      trackLogin("google");
    } catch (error) {
      console.error("Google authentication failed", error);
      showError(tToast("googleAuthFailed"), tToast("tryAgain"));
    }
  };

  const handleContinueAsGuest = async () => {
    if (isGuestProcessing || isGuestLoading) return;
    
    setIsGuestProcessing(true);
    try {
      const response = await continueAsGuest().unwrap();
      dispatch(setUser(response));
      // Same rule as the button's visibility, so the funnel cannot disagree with the UI.
      const signupSource = isRoomInviteRedirect(redirectParam) ? "room_join" : "direct";
      trackSignup("guest", signupSource);
      showSuccess(tToast("welcomeGuest"));
    } catch (error) {
      console.error("Guest signup failed:", error);
      const errorMessage =
        error?.data?.message || error?.message || tToast("unableToContinueAsGuest");
      showError(tToast("guestSignupFailed"), errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  return (
    <div className={loginContainerSurfaceClass}>
      <div className="flex flex-col items-center gap-7">
        {/* Logo and Welcome Section */}
        <header className="flex flex-col items-center gap-4 w-full">
          {/* Logo with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative z-10">
              <Logo height={64} width={64} custom={true} />
            </div>
          </div>
          
          {/* Brand Name */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center font-parkinsans tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
              Movmash
            </h1>
            <p className="text-base md:text-lg text-white/90 text-center font-medium">
              {tAuth("welcomeBack")}
            </p>
            <p className="text-xs md:text-sm text-white/60 text-center max-w-xs mt-0.5">
              {offerGuestAccount ? tAuth("chooseHowToContinue") : tAuth("signInToContinue")}
            </p>
          </div>
        </header>

        {/* Authentication Buttons */}
        <div className="flex flex-col gap-3.5 w-full">
          {/* Google Button */}
          <GoogleButton
            name={tCommon("continueWithGoogle")}
            onSuccess={handleGoogleAuthSuccess}
            onError={() => {
              console.log("Google authentication failed");
            }}
          />

          {/* Marketing opt-in — unchecked by default (GDPR). Only recorded for new accounts. */}
          <label className="flex cursor-pointer items-start gap-2.5 px-0.5">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-pink-500"
            />
            <span className="text-xs leading-relaxed text-white/60">
              {tAuth("marketingOptIn")}
            </span>
          </label>

          {/* Guest sign-in, and the separator that introduces it, only for an invite. */}
          {offerGuestAccount && (
            <>
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-zinc-600/20"></div>
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{tCommon("or")}</span>
                <div className="flex-1 h-px bg-zinc-600/20"></div>
              </div>

              <Button
                name={
                  isGuestProcessing || isGuestLoading
                    ? tCommon("creatingAccount")
                    : tCommon("continueAsGuest")
                }
                icon={isGuestProcessing || isGuestLoading ? <ImSpinner2 className="animate-spin" /> : undefined}
                className={guestContinueButtonClass}
                onClick={handleContinueAsGuest}
                disabled={isGuestProcessing || isGuestLoading}
              />
            </>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-white/60 text-center leading-relaxed max-w-sm mt-1">
          {tAuth("agreementPrefix")}{" "}
          <span className="text-white/80 hover:text-pink-400 transition-colors cursor-pointer">{tAuth("termsOfService")}</span>
          {" "}{tAuth("and")}{" "}
          <span className="text-white/80 hover:text-pink-400 transition-colors cursor-pointer">{tAuth("privacyPolicy")}</span>
          {tAuth("agreementSuffix")}
        </p>
      </div>
    </div>
  );
};

export default LoginContainer;
