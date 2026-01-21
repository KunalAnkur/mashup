"use client";

import { useEffect } from "react";
import { isMobile } from "react-device-detect";

/**
 * Hook to prevent body scrolling on mobile devices
 * Useful for pages that should not scroll on mobile (home, stream, sync pages)
 */
export const usePreventMobileScroll = () => {
  useEffect(() => {
    if (isMobile) {
      // Store original styles
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyWidth = document.body.style.width;
      const originalBodyHeight = document.body.style.height;
      const originalBodyTop = document.body.style.top;
      const originalBodyLeft = document.body.style.left;
      
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlTouchAction = document.documentElement.style.touchAction;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // Prevent touch scrolling
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.touchAction = 'none';
      
      return () => {
        // Restore original styles when component unmounts
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.width = originalBodyWidth;
        document.body.style.height = originalBodyHeight;
        document.body.style.top = originalBodyTop;
        document.body.style.left = originalBodyLeft;
        
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.touchAction = originalHtmlTouchAction;
      };
    }
  }, []);
};
