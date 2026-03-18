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
