import React from "react";
import { LuPlus } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import {
    Modal,
    ModalHeader,
    modalAccentIconWrapClass,
    modalAccentTitleClass,
    modalBrandActionButtonClass,
    modalConfirmSurfaceClass,
    modalDiscardActionButtonClass,
    modalErrorTextClass,
    modalFormActionsClass,
    modalFormBodyClass,
    modalFormHeaderClass,
    modalSubtleCloseButtonClass,
    modalTextFieldClass,
} from "../UI";

interface AddUrlModalProps {
    isOpen: boolean;
    urlInput: string;
    urlError: string;
    isAdding: boolean;
    onClose: () => void;
    onUrlInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onAddUrl: () => void;
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({
    isOpen,
    urlInput,
    urlError,
    isAdding,
    onClose,
    onUrlInputChange,
    onUrlInputKeyDown,
    onAddUrl,
}) => {
    const t = useTranslations("sync");
    const tCommon = useTranslations("common");
    const submitDisabled = isAdding || !urlInput.trim() || Boolean(urlError);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            overlayClassName="z-50"
            panelClassName={`${modalConfirmSurfaceClass} max-w-md`}
        >
            <div className="w-full">
                <ModalHeader
                    className={modalFormHeaderClass}
                    icon={
                        <div className={modalAccentIconWrapClass}>
                            <LuPlus size={18} />
                        </div>
                    }
                    title={t("addVideoUrl")}
                    titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
                    onClose={onClose}
                    closeButtonClassName={modalSubtleCloseButtonClass}
                />

                <div className={modalFormBodyClass}>
                    <div>
                        <input
                            type="text"
                            placeholder={t("enterUrl")}
                            value={urlInput}
                            onChange={onUrlInputChange}
                            onKeyDown={onUrlInputKeyDown}
                            className={modalTextFieldClass}
                            disabled={isAdding}
                            autoFocus
                        />
                        {urlError && (
                            <p className={modalErrorTextClass}>
                                <span>⚠️</span>
                                <span>{urlError}</span>
                            </p>
                        )}
                    </div>

                    <div className={modalFormActionsClass}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isAdding}
                            className={`${modalDiscardActionButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {tCommon("cancel")}
                        </button>
                        <button
                            type="button"
                            onClick={onAddUrl}
                            disabled={submitDisabled}
                            className={`${modalBrandActionButtonClass} flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {isAdding ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    <span>{t("adding")}</span>
                                </>
                            ) : (
                                <>
                                    <LuPlus size={16} />
                                    <span>{t("addUrl")}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
