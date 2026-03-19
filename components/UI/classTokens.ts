export const movmashGradientStopsClass =
  "from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500";

export const movmashThemeGradientClass =
  "bg-[linear-gradient(135deg,rgba(190,24,93,0.96)_0%,rgba(190,24,93,0.9)_38%,rgba(168,85,247,0.8)_100%)]";

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

export const appDropdownGoogleIconChipClass = appWhiteEmphasisSurfaceClass;

export const appDropdownGuestIconChipClass =
  "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 text-pink-100";

export const appDropdownLogoutIconChipClass =
  "bg-gradient-to-br from-[#571b24] via-[#7a1f34] to-[#5d1b34] text-rose-200";

export const appDropdownDisabledRowClass =
  "disabled:cursor-not-allowed disabled:opacity-50";

export const appHomeEntryCardSurfaceClass =
  `${zincGlassMutedBlurredSurfaceClass} hover:from-zinc-700/15 hover:via-zinc-600/15 hover:to-zinc-700/15`;

export const appHomeInputSurfaceClass =
  `${zincGlassMutedBlurredSurfaceClass} transition-[background-color] duration-200 focus-within:from-zinc-700/15 focus-within:via-zinc-600/15 focus-within:to-zinc-700/15`;

export const appEntryPageShellClass =
  "relative z-20 mx-auto flex h-screen w-full max-w-6xl flex-col overflow-hidden";

export const appEntryPageInsetClass =
  "w-full px-4 sm:px-6";

export const appEntryPageContentWrapClass =
  "w-full pt-3 pb-4 sm:pt-4 sm:pb-6 md:pt-5 md:pb-8";

export const appEntryPageFixedHeaderOffsetClass = "pt-14";

export const appEntryPageHeaderFixedShellClass =
  "absolute left-4 right-4 top-4 z-50 h-10 sm:left-5 sm:right-5";

export const appEntryPageHeaderFlowShellClass =
  "relative z-40 mx-4 mt-4 h-10 sm:mx-5";

export const appEntryPageHeaderRowClass =
  "relative flex h-full items-center justify-between";

export const appEntryPageHeaderLeftSectionClass =
  "flex h-full min-w-0 items-center";

export const appEntryPageHeaderTitleOverlayClass =
  "pointer-events-none absolute inset-0 flex h-full items-center justify-center px-16 text-center sm:px-20 md:px-24";

export const appEntryPageHeaderRightSectionClass =
  "flex h-full min-w-0 items-center justify-end";

export const appEntryPageHeaderNavClusterClass =
  "flex h-full min-w-0 items-center gap-2.5 sm:gap-3.5 md:gap-4";

export const appEntryPageHeaderControlsClass =
  "flex h-full flex-row items-center gap-2.5 sm:gap-3";

export const appEntryPageBrandClass =
  "flex h-full items-center gap-2.5 text-white/90";

export const appEntryPageBrandTextClass =
  "font-parkinsans text-xl font-semibold leading-none tracking-tight text-white/90";

export const appPageHeaderBackButtonClass =
  "-ml-2 flex h-10 w-10 shrink-0 items-center justify-start rounded-full pl-2 text-white/68 leading-none transition-colors duration-200 hover:text-white sm:-ml-2.5 sm:pl-2.5";

export const appPageHeaderBackIconClass = "block shrink-0 text-lg";

export const appPageHeaderTitleClass =
  "truncate font-parkinsans text-sm font-semibold leading-none tracking-tight text-white/90 sm:text-base md:text-lg";

export const appSectionTitleWrapClass =
  "mb-3 flex items-center sm:mb-4 md:mb-5 lg:mb-6";

export const appSectionTitleTextClass =
  "font-parkinsans text-sm font-semibold leading-none tracking-tight text-white/88 sm:text-base md:text-lg";

export const appEntryPageLoginTriggerClass =
  "inline-flex h-10 items-center gap-2 px-1 text-sm font-medium leading-none text-white/76 transition-colors duration-200 hover:text-white";

export const appEntrySubtleSurfaceClass =
  "rounded-2xl bg-white/[0.04] transition-colors duration-200";

export const appEntryInteractiveSurfaceClass =
  "rounded-2xl bg-white/[0.04] transition-colors duration-200 hover:bg-white/[0.06]";

export const appSyncPlatformCardClass =
  "aspect-square flex min-h-[70px] flex-col items-center justify-center overflow-hidden rounded-lg p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-opacity duration-200 hover:opacity-[0.96] md:min-h-[90px] md:rounded-xl md:p-3 lg:min-h-[110px] lg:rounded-2xl lg:p-4 xl:min-h-[130px] xl:p-5 2xl:min-h-[140px] 2xl:p-6";

export const appSyncPlatformIconClass =
  "text-white/95 leading-none [&>svg]:text-[26px] md:[&>svg]:text-[30px] lg:[&>svg]:text-[34px] xl:[&>svg]:text-[38px]";

export const appSyncPlatformLabelClass =
  "mt-1 px-1 text-[10px] font-semibold leading-tight tracking-tight text-white/94 md:mt-2 md:text-xs lg:mt-2.5 lg:text-sm xl:text-[15px]";

export const appSyncFieldInputClass =
  "h-11 flex-1 min-w-0 rounded-xl bg-white/[0.045] px-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-xl placeholder:text-white/36 transition-colors duration-200 focus:bg-white/[0.065] sm:h-[46px] sm:px-4";

export const appSyncSecondaryButtonClass =
  "h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.045] px-3 text-sm font-medium text-white/88 transition-colors duration-200 hover:bg-white/[0.065] hover:text-white sm:h-[46px] sm:px-4";

export const appSyncPrimaryButtonClass =
  `h-11 flex-1 items-center justify-center gap-2 rounded-xl ${movmashThemeGradientClass} px-3 text-sm font-semibold tracking-tight text-white transition-[filter,opacity] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[46px] sm:px-4 md:px-6`;

export const appEntryFieldShellClass =
  "flex min-h-12 items-center rounded-2xl bg-white/[0.045] px-4 transition-colors duration-200 focus-within:bg-white/[0.07]";

export const appEntryFieldInputClass =
  "w-full min-w-0 bg-transparent py-3.5 text-[15px] text-white placeholder:text-white/38";

export const appEntrySecondaryButtonClass =
  "h-12 justify-center rounded-2xl bg-white/[0.05] px-5 text-sm font-medium text-white/82 transition-colors duration-200 hover:bg-white/[0.085] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

export const appEntryPrimaryButtonClass =
  "h-12 justify-center rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const appSyncTooltipSurfaceClass =
  "rounded-xl bg-[#18181f]/96 px-3 py-2 text-[11px] text-white/76 shadow-xl shadow-black/25 backdrop-blur-xl";

export const appSyncPlaceholderRowClass =
  "flex items-center gap-3 rounded-2xl bg-white/[0.028] px-3 py-3";

export const appSyncListShellClass =
  "min-h-[220px] flex-1 overflow-hidden sm:min-h-[200px]";

export const appSyncListShellEmptyClass =
  "flex-1 overflow-hidden rounded-2xl";

export const appSyncCardThumbnailClass =
  "relative h-[44px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-black/[0.12]";

export const appSyncCardIndexClass =
  "shrink-0 text-[11px] font-medium leading-none tabular-nums text-white/38";

export const appSyncCardClass =
  "relative flex h-[74px] items-center gap-2.5 rounded-2xl bg-white/[0.038] py-3 pr-3 pl-2.5";
