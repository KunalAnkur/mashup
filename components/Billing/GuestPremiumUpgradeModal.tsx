"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { ImSpinner2 } from "react-icons/im";
import { LuCrown, LuShieldCheck } from "react-icons/lu";
import GoogleButton, {
  type GoogleAuthUserInfo,
} from "@/components/GoogleAuth/GoogleButton";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBalancedContentClass,
  modalConfirmSurfaceClass,
  modalDiscardActionButtonClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";
import { useAuthProviderMutation } from "@/lib/store/api/authApi";
import { setGoogleUser, setUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";

type GuestPremiumUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: (token: string) => void | Promise<void>;
};

export default function GuestPremiumUpgradeModal({
  open,
  onClose,
  onAuthenticated,
}: GuestPremiumUpgradeModalProps) {
  const dispatch = useDispatch();
  const [authProvider] = useAuthProviderMutation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleSuccess = async (userInfo: GoogleAuthUserInfo) => {
    try {
      setIsAuthenticating(true);

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
        }),
      );

      showSuccess("Google account connected");
      onClose();
      await onAuthenticated?.(response.data.token);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Unable to continue with Google.";
      showError("Google sign-in failed", message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnBackdropClick={!isAuthenticating}
      closeOnEscape={!isAuthenticating}
      overlayClassName="z-[99999]"
      panelClassName={`${modalConfirmSurfaceClass} max-w-md`}
    >
      <div className="w-full">
        <ModalHeader
          className="mb-4 px-0 pt-0 pb-0"
          icon={
            <div className={modalAccentIconWrapClass}>
              <LuCrown size={18} />
            </div>
          }
          title="Continue with Google"
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={isAuthenticating ? undefined : onClose}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <div className={modalBalancedContentClass}>
          <p className="text-sm leading-7 text-white/72">
            Premium checkout is only available for full accounts. Your current
            guest session can browse pricing, but you&apos;ll need to continue
            with Google before payment.
          </p>

          <div className="mt-4 rounded-2xl bg-white/[0.045] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300">
                <LuShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  What happens next
                </p>
                <p className="mt-1 text-xs leading-6 text-white/60">
                  We&apos;ll sign you in with Google inside Movmash, then continue
                  directly into the Premium checkout flow.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <GoogleButton
              name={isAuthenticating ? "Connecting..." : "Continue with Google"}
              onSuccess={handleGoogleSuccess}
              onError={() => {
                showError("Google sign-in failed", "Please try again.");
              }}
              disabled={isAuthenticating}
              icon={
                isAuthenticating ? (
                  <ImSpinner2 className="animate-spin" size={18} />
                ) : undefined
              }
              className="disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={onClose}
              disabled={isAuthenticating}
              className={`${modalDiscardActionButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
