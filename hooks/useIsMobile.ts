"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the current device is mobile
 * Uses responsive breakpoint (768px) as threshold
 * @param breakpoint - The width threshold in pixels (default: 768)
 * @returns boolean indicating if device is mobile
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check on mount
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);

    // Cleanup listener
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;

