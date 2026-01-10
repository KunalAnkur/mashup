"use client";

import { useState, useEffect } from "react";

/**
 * Device detection result interface
 */
interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  deviceType: "mobile" | "tablet" | "desktop";
}

/**
 * Detects if the current device is a mobile device based on user agent
 * This checks the actual device type, not screen size
 * @returns DeviceInfo object with device detection results
 */
function detectDevice(): DeviceInfo {
  // Default to desktop for SSR
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      deviceType: "desktop",
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // iOS devices
  const isIPhone = /iphone/.test(userAgent);
  const isIPod = /ipod/.test(userAgent);
  const isIPad = /ipad/.test(userAgent) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPad Pro detection
  const isIOS = isIPhone || isIPod || isIPad;
  
  // Android devices
  const isAndroid = /android/.test(userAgent);
  const isAndroidTablet = isAndroid && !/mobile/.test(userAgent);
  const isAndroidPhone = isAndroid && /mobile/.test(userAgent);
  
  // Other mobile devices
  const isWindowsPhone = /windows phone/.test(userAgent);
  const isBlackBerry = /blackberry|bb10/.test(userAgent);
  const isOpera = /opera mini|opera mobi/.test(userAgent);
  const isWebOS = /webos/.test(userAgent);
  
  const isMobile = isIPhone || isIPod || isAndroidPhone || isWindowsPhone || isBlackBerry || isOpera || isWebOS;
  const isTablet = isIPad || isAndroidTablet;
  const isDesktop = !isMobile && !isTablet;

  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (isMobile) {
    deviceType = "mobile";
  } else if (isTablet) {
    deviceType = "tablet";
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    deviceType,
  };
}

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const deviceInfo = detectDevice();
    setIsMobile(deviceInfo.isMobile);
  }, []);

  return isMobile;
};

export const useDeviceInfo = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    deviceType: "desktop",
  });

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  return deviceInfo;
};

export const getDeviceInfo = detectDevice;

export default useIsMobile;
