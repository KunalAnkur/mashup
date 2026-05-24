"use client";

// Thin redirect so existing import paths keep working.
export {
  CallStreamProvider as CallProvider,
  useCallStream as useCallContext,
} from "@/context/CallStreamContext";
export type { CallStreamContextType as CallContextType } from "@/context/CallStreamContext";
