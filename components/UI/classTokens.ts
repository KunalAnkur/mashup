export const movmashGradientStopsClass =
  "from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500";

export const movmashElevatedShadowClass =
  "shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40";

export const movmashProminentCtaClass =
  `bg-gradient-to-r ${movmashGradientStopsClass} hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-500/30`;

export const zincGlassSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15";

export const zincGlassMutedSurfaceClass =
  "bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10";

export const zincGlassFaintSurfaceClass =
  "bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5";

export const zincGlassBlurredSurfaceClass =
  `${zincGlassSurfaceClass} backdrop-blur-xl`;

export const zincGlassMutedBlurredSurfaceClass =
  `${zincGlassMutedSurfaceClass} backdrop-blur-xl`;

export const zincGlassFaintBlurredSurfaceClass =
  `${zincGlassFaintSurfaceClass} backdrop-blur-xl`;

export const zincGlassBorderedSurfaceClass =
  `${zincGlassBlurredSurfaceClass} border border-zinc-600/15`;

export const zincGlassLgPanelSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-lg border border-zinc-600/15 rounded-lg md:rounded-xl lg:rounded-2xl";

export const zincGlassInteractiveHoverSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10";

export const zincGlassStrongBorderedSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15";

export const zincGlassSoftInsetSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 to-zinc-700/15 backdrop-blur-sm border border-zinc-600/20";

export const purpleAccentIconSurfaceClass =
  "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center";

export const purplePinkAccentIconSurfaceClass =
  "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center";

export const appWhiteBorderClass = "border border-white/10";

export const appFrostedBackdropClass = "backdrop-blur-xl";

export const appBorderedFrostedSurfaceClass =
  `${appWhiteBorderClass} ${appFrostedBackdropClass}`;

export const appHoverRevealClass = "hover:bg-white/5 hover:text-white";

export const appWhiteEmphasisSurfaceClass = "bg-white/8 text-white";

export const appMutedHoverSurfaceClass =
  "bg-white/5 hover:bg-white/10 hover:text-white";

export const appMutedGroupHoverSurfaceClass =
  "bg-white/5 group-hover:bg-white/10";

export const appIconTextHoverClass =
  "text-gray-400 hover:text-white transition-colors";

export const appPulseSurfaceClass = "bg-white/10 rounded animate-pulse";

export const appInputRadiusClass = "rounded-xl";

export const appInputVerticalPaddingClass = "py-3";

export const appDropdownSurfaceClass =
  "absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(26,26,32,0.98),rgba(18,18,24,0.98))] backdrop-blur-2xl md:w-60";

export const appDropdownContentClass = "flex flex-col gap-0.5 p-2";

export const appDropdownRowClass =
  "flex items-center gap-2.5 rounded-xl px-2.5 py-2";

export const appDropdownDividerClass = "h-px w-full bg-white/8";

export const appSeparatorLineClass = "h-px flex-1 bg-white/10";

export const appDropdownMetaTextClass =
  "text-[9px] md:text-[10px] text-white/42";

export const appDropdownLabelClass = "min-w-0 text-[11px] md:text-xs";

export const appDropdownActionLabelClass =
  `${appDropdownLabelClass} font-medium`;

export const appDropdownQuietActionButtonClass =
  `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 ${appHoverRevealClass}`;

export const appDropdownDangerActionButtonClass =
  `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 hover:bg-rose-500/10 hover:text-white`;

export const appDropdownIconChipBaseClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg leading-none";
