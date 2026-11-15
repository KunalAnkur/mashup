"use client";

import { useDispatch } from "react-redux";
import { LuGift, LuCheck } from "react-icons/lu";
import { setMarketingOptIn } from "@/lib/store/slices/authSlice";
import { useUpdateMarketingPreferenceMutation } from "@/lib/store/api/userApi";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBrandActionButtonClass,
  modalConfirmActionsClass,
  modalConfirmContentBodyClass,
  modalConfirmHeaderClass,
  modalConfirmSurfaceClass,
  modalDiscardActionButtonClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

// Set by the login page when the opt-in box was left empty, so this popup waits for a later visit.
export const MARKETING_POPUP_SNOOZE_KEY = "movmash_marketing_popup_snoozed";

interface WelcomeMarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeMarketingModal = ({ isOpen, onClose }: WelcomeMarketingModalProps) => {
  const dispatch = useDispatch();
  const t = useTranslations("marketing");
  const [updateMarketing, { isLoading }] = useUpdateMarketingPreferenceMutation();

  const handle = async (optIn: boolean) => {
    try {
      await updateMarketing({ opt_in: optIn }).unwrap();
      dispatch(setMarketingOptIn(optIn));
    } catch {
      // Silently fail — preference can be missed without breaking the app
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => handle(false)}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      overlayClassName="z-[99999]"
      panelClassName={modalConfirmSurfaceClass}
    >
      <div className="w-full">
        <ModalHeader
          className={modalConfirmHeaderClass}
          icon={
            <div className={modalAccentIconWrapClass}>
              <LuGift size={18} />
            </div>
          }
          title={t("title")}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={() => handle(false)}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />
        <div className={modalConfirmContentBodyClass}>
          <ul className="mb-4 flex flex-col gap-2">
            {(["perkDiscounts", "perkGames", "perkIdeas"] as const).map((key) => (
              <li
                key={key}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm leading-snug text-white/90"
              >
                {t(key)}
              </li>
            ))}
          </ul>
          <div className={modalConfirmActionsClass}>
            <button
              type="button"
              onClick={() => handle(false)}
              disabled={isLoading}
              className={modalDiscardActionButtonClass}
            >
              {t("noThanks")}
            </button>
            <button
              type="button"
              onClick={() => handle(true)}
              disabled={isLoading}
              className={`${modalBrandActionButtonClass} flex items-center justify-center gap-1.5`}
            >
              <LuCheck size={14} />
              <span>{isLoading ? t("saving") : t("yesNotifyMe")}</span>
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-white/45">{t("footnote")}</p>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeMarketingModal;
