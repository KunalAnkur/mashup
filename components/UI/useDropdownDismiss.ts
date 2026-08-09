"use client";

import { useEffect } from "react";

type UseDropdownDismissOptions = {
  isOpen: boolean;
  onClose: () => void;
  refs: Array<React.RefObject<HTMLElement | null>>;
  closeOnEscape?: boolean;
  pointerEvent?: "pointerdown" | "mousedown";
};

export const useDropdownDismiss = ({
  isOpen,
  onClose,
  refs,
  closeOnEscape = true,
  pointerEvent = "pointerdown",
}: UseDropdownDismissOptions) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDownOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      // A Modal (see components/UI/Modal.tsx) portals to document.body and marks its overlay
      // with data-global-modal="true", so it's never a DOM descendant of any dropdown ref even
      // when opened from inside one. Without this check, opening a Modal from a dropdown/popover
      // makes its own confirm button register as an "outside" click and dismiss the dropdown
      // before onConfirm runs.
      if (target instanceof Element && target.closest('[data-global-modal="true"]')) {
        return;
      }

      const clickedInside = refs.some(
        (ref) => ref.current && ref.current.contains(target)
      );

      if (!clickedInside) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(pointerEvent, handlePointerDownOutside);
    if (closeOnEscape) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener(pointerEvent, handlePointerDownOutside);
      if (closeOnEscape) {
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };
  }, [closeOnEscape, isOpen, onClose, pointerEvent, refs]);
};
