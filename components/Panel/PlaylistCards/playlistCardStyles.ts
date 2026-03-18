import { appMutedGroupHoverSurfaceClass } from "@/components/UI/classTokens";
import {
  panelCardHoverSurfaceClass,
  panelCardSurfaceClass,
} from "../panelCardStyles";

export const playlistCardBaseClass =
  "group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0";

export const playlistCardPlayingSurfaceClass =
  "bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30";

export const playlistCardIdleSurfaceClass =
  `${panelCardSurfaceClass} border border-transparent`;

export const playlistCardIdleSurfaceHoverClass =
  `${playlistCardIdleSurfaceClass} ${panelCardHoverSurfaceClass}`;

export const playlistCardThumbnailBaseClass =
  "relative w-20 h-13 rounded-lg overflow-hidden shrink-0";

export const playlistCardThumbnailRingClass = "ring-2 ring-pink-500/50";

export const playlistCardPlayingOverlayClass =
  "absolute inset-0 bg-black/40 flex items-center justify-center";

export const playlistCardPlayingIndicatorClass =
  "w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center";

export const playlistCardPlayingBadgeClass =
  "flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded";

export const playlistCardIndexBaseClass =
  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center";

export const playlistCardIndexIdleClass =
  `${appMutedGroupHoverSurfaceClass} text-gray-500`;

export const playlistCardIndexPlayingClass = "bg-pink-500/20 text-pink-400";
