"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { LuSend, LuMessageSquare } from "react-icons/lu";
import { useSubmitFeedbackMutation } from "@/lib/store/api/feedbackApi";
import { showSuccess, showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBrandActionButtonClass,
  modalConfirmSurfaceClass,
  modalErrorTextClass,
  modalFormBodyClass,
  modalFormHeaderClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string | null;
}

const initialFormData = {
  title: "",
  description: "",
  category: "bug" as "bug" | "feature" | "other",
};

const FeedbackModal = ({ isOpen, onClose, roomId }: FeedbackModalProps) => {
  const [loading, setLoading] = useState(false);
  const roomState = useSelector((state: RootState) => state.room);
  const authState = useSelector((state: RootState) => state.auth);
  const [submitFeedback] = useSubmitFeedbackMutation();
  const [formData, setFormData] = useState(initialFormData);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const tFeedback = useTranslations("feedback");

  const getTitleError = (value: string) => (
    value.trim().length < 3 ? tFeedback("topicMinLength") : ""
  );

  const getDescriptionError = (value: string) => (
    value.trim().length < 10 ? tFeedback("descriptionMinLength") : ""
  );

  const titleError = hasSubmitted ? getTitleError(formData.title) : "";
  const descriptionError = hasSubmitted ? getDescriptionError(formData.description) : "";

  const handleClose = () => {
    setLoading(false);
    setHasSubmitted(false);
    setFormData(initialFormData);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextTitleError = getTitleError(formData.title);
    const nextDescriptionError = getDescriptionError(formData.description);

    setHasSubmitted(true);

    if (nextTitleError || nextDescriptionError) {
      return;
    }

    setLoading(true);
    try {
      const roomDetailsSnapshot = roomState;
      if (authState.isAuthenticated) {
        await submitFeedback({
          ...formData,
          room_id: roomId || undefined,
          room_details: roomDetailsSnapshot
        });
      
        showSuccess(tToast("feedbackSent"));
        handleClose();
      } else {
        showError(tCommon("error"), tToast("pleaseLogin"));
      }
    } catch {
      showError(tCommon("error"), tToast("couldNotSendFeedback"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      overlayClassName="feedback-modal z-[99999]"
      panelClassName={`${modalConfirmSurfaceClass} max-w-md`}
    >
      <div className="w-full">
        <ModalHeader
          className={modalFormHeaderClass}
          icon={
            <div className={modalAccentIconWrapClass}>
              <LuMessageSquare size={18} />
            </div>
          }
          title={tFeedback("title")}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={handleClose}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <form onSubmit={handleSubmit} className={modalFormBodyClass}>
          {/* Category Chips - Matching Tab Style */}
          <div className="flex p-1 bg-zinc-900/50 rounded-2xl ">
            {(["bug", "feature", "other"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat })}
                className={`flex-1 py-2 text-[11px] font-bold capitalize transition-all duration-300 rounded-xl ${
                  formData.category === cat 
                    ? "bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 text-white " 
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {tFeedback(`category.${cat}`)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder={tFeedback("topic")}
                className="w-full rounded-xl bg-zinc-800/20 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 focus:outline-none"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? "feedback-title-error" : undefined}
              />
              {titleError ? (
                <p id="feedback-title-error" className={modalErrorTextClass}>
                  {titleError}
                </p>
              ) : null}
            </div>

            <div>
              <textarea
                placeholder={tFeedback("descriptionPlaceholder")}
                rows={4}
                className="w-full resize-none rounded-xl bg-zinc-800/20 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 focus:outline-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                aria-invalid={Boolean(descriptionError)}
                aria-describedby={descriptionError ? "feedback-description-error" : undefined}
              />
              {descriptionError ? (
                <p id="feedback-description-error" className={modalErrorTextClass}>
                  {descriptionError}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${modalBrandActionButtonClass} flex w-full items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? (
               <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LuSend size={18} />
                <span>{tFeedback("sendFeedback")}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default FeedbackModal;
