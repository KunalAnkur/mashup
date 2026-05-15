"use client";

import { useDispatch } from "react-redux";
import { LuBell, LuCheck } from "react-icons/lu";
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
  modalConfirmMessageClass,
  modalConfirmSurfaceClass,
  modalDiscardActionButtonClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

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
              <LuBell size={18} />
            </div>
          }
          title={t("title")}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={() => handle(false)}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />
        <div className={modalConfirmContentBodyClass}>
          <p className={modalConfirmMessageClass}>
            {t("message")}
          </p>
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
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeMarketingModal;
