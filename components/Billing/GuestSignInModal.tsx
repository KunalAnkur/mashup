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
import { useTranslations } from "@/i18n/I18nProvider";
import { useAuthProviderMutation } from "@/lib/store/api/authApi";
import { setGoogleUser, setUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";

/**
 * Prompts a guest to attach a real Google account, then resumes whatever they were doing via
 * `onAuthenticated`. Shared by every action a guest can't complete — hosting a room and
 * checkout — since both need an identifiable, billable account (MOVMASH.md §4.3).
 * Copy is supplied by the caller so the reason shown matches the action that was blocked.
 */
type GuestSignInModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: (token: string) => void | Promise<void>;
  title: string;
  description: string;
  nextStepText: string;
};

export default function GuestSignInModal({
  open,
  onClose,
  onAuthenticated,
  title,
  description,
  nextStepText,
}: GuestSignInModalProps) {
  const dispatch = useDispatch();
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth.guestSignIn");
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

      showSuccess(tAuth("connected"));
      onClose();
      await onAuthenticated?.(response.data.token);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || tAuth("failedBody");
      showError(tAuth("failedTitle"), message);
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
          title={title}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={isAuthenticating ? undefined : onClose}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <div className={modalBalancedContentClass}>
          <p className="text-sm leading-7 text-white/72">{description}</p>

          <div className="mt-4 rounded-2xl bg-white/[0.045] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300">
                <LuShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {tAuth("whatHappensNext")}
                </p>
                <p className="mt-1 text-xs leading-6 text-white/60">{nextStepText}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <GoogleButton
              name={isAuthenticating ? tAuth("connecting") : tCommon("continueWithGoogle")}
              onSuccess={handleGoogleSuccess}
              onError={() => {
                showError(tAuth("failedTitle"), tAuth("tryAgain"));
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
              {tAuth("notNow")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
