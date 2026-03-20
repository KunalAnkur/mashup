"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LuX } from "react-icons/lu";
import {
  dangerModalIconWrapClass,
  movmashModalGradientStopsClass,
  movmashModalIconWrapClass,
  movmashModalSoftIconWrapClass,
  movmashModalTitleGradientClass,
} from "./modalTheme";
import {
  appInputRadiusClass,
  appInputVerticalPaddingClass,
  zincGlassBlurredSurfaceClass,
} from "./classTokens";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const overlayBaseClass =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm";
const panelBaseClass = "relative w-full";
const overlayTransition = { duration: 0.18 };
const panelTransition = { duration: 0.22, ease: "easeOut" as const };
const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const modalCloseButtonBaseClass =
  "appearance-none border-0 p-2 rounded-xl bg-transparent text-white/40 outline-none ring-0 transition-colors duration-200 hover:bg-transparent hover:text-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";
const modalSubtleCloseButtonClass = "text-white/45 hover:text-white/82";
const modalCornerCloseButtonClass =
  "absolute right-2.5 top-2.5 z-10 h-8 w-8 p-1.5 md:right-3 md:top-3";
const modalHeaderBaseClass = "relative flex items-center justify-between gap-3 px-6 pt-6 pb-2";
const modalHeaderTitleClass = "text-lg font-bold text-white font-parkinsans";
const modalHeaderSubtitleClass =
  "text-[10px] font-semibold uppercase tracking-widest text-white/40";
const modalActionButtonBaseClass =
  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none transition-all duration-200";
const modalIconActionButtonBaseClass =
  `flex items-center justify-center rounded-lg ${zincGlassBlurredSurfaceClass} p-2 transition-all duration-200 md:p-2.5`;
const modalDiscardActionButtonClass =
  `${modalActionButtonBaseClass} bg-white/[0.045] text-white/92 hover:bg-white/[0.085]`;
const modalBrandActionButtonClass =
  `${modalActionButtonBaseClass} bg-gradient-to-r ${movmashModalGradientStopsClass} text-white`;
const modalConfirmActionButtonClass =
  `${modalActionButtonBaseClass} bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white hover:from-red-500 hover:via-rose-500 hover:to-pink-500`;
const modalConfirmSurfaceClass =
  "max-w-sm overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 shadow-2xl backdrop-blur-2xl md:rounded-2xl";
const modalBalancedContentClass = "px-4 py-4 md:px-5 md:py-5";
const modalConfirmHeaderClass = "mb-2 px-0 pt-0 pb-0 md:mb-3";
const modalConfirmMessageClass = "mb-3 text-xs leading-relaxed text-white/70 md:mb-4 md:text-sm";
const modalFormHeaderClass = "mb-4 px-0 pt-0 pb-0";
const modalFormBodyClass = "space-y-4 px-4 pb-4 pt-0 md:px-5 md:pb-5";
const modalFormActionsClass = "flex gap-3 pt-2";
const modalTextFieldClass =
  `w-full ${appInputRadiusClass} border-0 bg-white/[0.045] px-4 ${appInputVerticalPaddingClass} text-sm text-white outline-none ring-0 transition-[background-color] duration-200 placeholder:text-gray-500 focus:bg-white/[0.06] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0`;
const modalTextAreaClass =
  `${modalTextFieldClass} min-h-[112px] resize-none`;
const modalSegmentedControlClass =
  "flex rounded-xl bg-white/[0.045] p-1";
const modalSegmentedControlButtonClass =
  "flex-1 rounded-[10px] px-3 py-2 text-[11px] font-semibold capitalize text-white/42 transition-colors duration-200 hover:text-white/68";
const modalSegmentedControlButtonActiveClass =
  "bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(236,72,153,0.16),rgba(217,70,239,0.18))] text-white";
const modalErrorTextClass = "mt-2 flex items-center gap-1.5 text-sm text-red-400";
const modalBrandTitleClass =
  `bg-gradient-to-r ${movmashModalTitleGradientClass} bg-clip-text text-transparent`;
const modalAccentTitleClass =
  `bg-gradient-to-r ${movmashModalTitleGradientClass} bg-clip-text text-transparent`;
const modalBrandIconWrapClass =
  `flex h-9 w-9 items-center justify-center rounded-[14px] ${movmashModalIconWrapClass}`;
const modalDangerIconWrapClass =
  `flex h-9 w-9 items-center justify-center rounded-[14px] ${dangerModalIconWrapClass}`;
const modalAccentIconWrapClass =
  `flex h-9 w-9 items-center justify-center rounded-[14px] ${movmashModalSoftIconWrapClass}`;
const modalBrandIconClass = "text-current";

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
};

interface ModalCloseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  icon?: ReactNode;
  label?: string;
}

const ModalCloseButton = ({
  className = "",
  icon = <LuX size={20} />,
  label = "Close modal",
  ...props
}: ModalCloseButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={[modalCloseButtonBaseClass, className].filter(Boolean).join(" ")}
    {...props}
  >
    {icon}
  </button>
);

interface ModalIconActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "aria-label"> {
  label: string;
  children: ReactNode;
}

const ModalIconActionButton = ({
  className = "",
  label,
  children,
  ...props
}: ModalIconActionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={[modalIconActionButtonBaseClass, className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </button>
);

interface ModalHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  closeButtonClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

const ModalHeader = ({
  className = "",
  icon,
  title,
  subtitle,
  onClose,
  closeLabel,
  closeButtonClassName = "",
  titleClassName = "",
  subtitleClassName = "",
  ...props
}: ModalHeaderProps) => (
  <div className={[modalHeaderBaseClass, className].filter(Boolean).join(" ")} {...props}>
    <div className="flex min-w-0 items-center gap-3">
      {icon ? <div className="shrink-0">{icon}</div> : null}
      <div className="min-w-0">
        <div className={[modalHeaderTitleClass, titleClassName].filter(Boolean).join(" ")}>{title}</div>
        {subtitle ? (
          <div className={[modalHeaderSubtitleClass, subtitleClassName].filter(Boolean).join(" ")}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
    {onClose ? (
      <ModalCloseButton className={closeButtonClassName} label={closeLabel} onClick={onClose} />
    ) : null}
  </div>
);

interface ModalConfirmContentProps {
  icon: ReactNode;
  title: ReactNode;
  message: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  messageClassName?: string;
  actionsClassName?: string;
}

const modalConfirmContentBodyClass = "px-4 pb-4 pt-0 md:px-5 md:pb-5";
const modalConfirmActionsClass = "flex gap-2 md:gap-3";

const ModalConfirmContent = ({
  icon,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled = false,
  confirmButtonClassName = "",
  cancelButtonClassName = "",
  contentClassName = "",
  headerClassName = "",
  titleClassName = "",
  messageClassName = "",
  actionsClassName = "",
}: ModalConfirmContentProps) => (
  <div className="w-full">
    <ModalHeader
      className={[modalConfirmHeaderClass, headerClassName].filter(Boolean).join(" ")}
      icon={<div className={modalDangerIconWrapClass}>{icon}</div>}
      title={title}
      titleClassName={[modalBrandTitleClass, "text-base md:text-lg", titleClassName].filter(Boolean).join(" ")}
    />
    <div className={[modalConfirmContentBodyClass, contentClassName].filter(Boolean).join(" ")}>
      <p className={[modalConfirmMessageClass, messageClassName].filter(Boolean).join(" ")}>{message}</p>
      <div className={[modalConfirmActionsClass, actionsClassName].filter(Boolean).join(" ")}>
        <button type="button" onClick={onCancel} className={[modalDiscardActionButtonClass, cancelButtonClassName].filter(Boolean).join(" ")}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={[
            modalConfirmActionButtonClass,
            confirmDisabled ? "disabled:cursor-not-allowed disabled:opacity-50" : "",
            confirmButtonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const Modal = ({
  open,
  onClose,
  children,
  overlayClassName = "",
  panelClassName = "",
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted, open]);

  useEffect(() => {
    if (!isMounted || !open) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements(panelRef.current);
      const focusTarget = focusableElements[0] ?? panelRef.current;
      focusTarget?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      previousActiveElementRef.current?.focus();
    };
  }, [isMounted, open]);

  useEffect(() => {
    if (!isMounted || !open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, isMounted, onClose, open]);

  if (!isMounted) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          data-global-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          className={[overlayBaseClass, overlayClassName].filter(Boolean).join(" ")}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={panelTransition}
            className={[panelBaseClass, panelClassName, "!border-0"].filter(Boolean).join(" ")}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

export default Modal;
export {
  ModalCloseButton,
  modalSubtleCloseButtonClass,
  modalCornerCloseButtonClass,
  ModalIconActionButton,
  ModalHeader,
  ModalConfirmContent,
  modalActionButtonBaseClass,
  modalIconActionButtonBaseClass,
  modalDiscardActionButtonClass,
  modalBrandActionButtonClass,
  modalConfirmActionButtonClass,
  modalConfirmSurfaceClass,
  modalBalancedContentClass,
  modalConfirmHeaderClass,
  modalConfirmMessageClass,
  modalFormHeaderClass,
  modalFormBodyClass,
  modalFormActionsClass,
  modalTextFieldClass,
  modalTextAreaClass,
  modalSegmentedControlClass,
  modalSegmentedControlButtonClass,
  modalSegmentedControlButtonActiveClass,
  modalErrorTextClass,
  modalBrandTitleClass,
  modalAccentTitleClass,
  modalBrandIconWrapClass,
  modalAccentIconWrapClass,
  modalBrandIconClass,
};
