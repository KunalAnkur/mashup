export const movmashGradientStopsClass =
  "from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500";

export const movmashThemeGradientClass =
  "bg-[linear-gradient(135deg,rgba(190,24,93,0.96)_0%,rgba(190,24,93,0.9)_38%,rgba(168,85,247,0.8)_100%)]";

export const movmashElevatedShadowClass =
  "shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40";

export const movmashProminentCtaClass = `bg-gradient-to-r ${movmashGradientStopsClass} hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-500/30`;

export const zincGlassSurfaceClass =
  "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15";

export const zincGlassMutedSurfaceClass =
  "bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10";

export const zincGlassFaintSurfaceClass =
  "bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5";

export const zincGlassBlurredSurfaceClass = `${zincGlassSurfaceClass} backdrop-blur-xl`;

export const zincGlassMutedBlurredSurfaceClass = `${zincGlassMutedSurfaceClass} backdrop-blur-xl`;

export const zincGlassFaintBlurredSurfaceClass = `${zincGlassFaintSurfaceClass} backdrop-blur-xl`;

export const zincGlassBorderedSurfaceClass = `${zincGlassBlurredSurfaceClass} border border-zinc-600/15`;

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

export const appBorderedFrostedSurfaceClass = `${appWhiteBorderClass} ${appFrostedBackdropClass}`;

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

export const appScrollbarHideClass = "scrollbar-hide";

export const appDropdownMetaTextClass =
  "text-[9px] md:text-[10px] text-white/42";

export const appDropdownLabelClass = "min-w-0 text-[11px] md:text-xs";

export const appDropdownActionLabelClass = `${appDropdownLabelClass} font-medium`;

export const appDropdownQuietActionButtonClass = `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 ${appHoverRevealClass}`;

export const appDropdownDangerActionButtonClass = `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 hover:bg-rose-500/10 hover:text-white`;

export const appDropdownIconChipBaseClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg leading-none";

export const appDropdownGoogleIconChipClass = appWhiteEmphasisSurfaceClass;

export const appDropdownGuestIconChipClass =
  "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 text-pink-100";

export const appDropdownLogoutIconChipClass =
  "bg-gradient-to-br from-[#571b24] via-[#7a1f34] to-[#5d1b34] text-rose-200";

export const appDropdownDisabledRowClass =
  "disabled:cursor-not-allowed disabled:opacity-50";

export const appHomeEntryCardSurfaceClass = `${zincGlassMutedBlurredSurfaceClass} hover:from-zinc-700/15 hover:via-zinc-600/15 hover:to-zinc-700/15`;

export const appHomeInputSurfaceClass = `${zincGlassMutedBlurredSurfaceClass} transition-[background-color] duration-200 focus-within:from-zinc-700/15 focus-within:via-zinc-600/15 focus-within:to-zinc-700/15`;

export const appLayoutContentLayerClass = "relative z-10 min-h-screen";

export const appFixedViewportPageClass =
  "relative min-h-[100dvh] text-white md:h-screen md:overflow-hidden";

export const appFlexibleViewportPageClass =
  "relative min-h-[100dvh] text-white md:overflow-hidden";

export const appEntryPageShellClass =
  "relative z-20 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col md:h-screen md:overflow-hidden";

export const appEntryPageInsetClass = "w-full px-4 sm:px-6";

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
  "pointer-events-none absolute inset-0 flex h-full items-center justify-center px-12 text-center sm:px-20 md:px-24";

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

export const appNotFoundContentClass =
  "mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-5 text-center sm:gap-6 md:gap-7";

export const appNotFoundCodeClass =
  "bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-rose-300 bg-clip-text font-parkinsans text-[84px] font-semibold leading-none tracking-tight text-transparent sm:text-[112px] md:text-[132px]";

export const appNotFoundLeadClass =
  "max-w-xl text-[15px] font-medium leading-7 text-white/82 sm:text-lg sm:leading-8";

export const appNotFoundBodyClass =
  "max-w-lg text-sm leading-6 text-white/56 sm:text-[15px]";

export const appNotFoundActionRowClass =
  "mt-1 flex w-full max-w-md flex-col gap-2.5 sm:flex-row";

export const appNotFoundFootnoteClass =
  "max-w-xl text-xs leading-6 text-white/40 sm:text-sm";

export const appEntryPageLoginTriggerClass =
  "inline-flex h-10 items-center gap-2 px-1 text-sm font-medium leading-none text-white/76 transition-colors duration-200 hover:text-white";

export const appEntrySubtleSurfaceClass =
  "rounded-2xl bg-white/[0.04] transition-colors duration-200";

export const appEntryInteractiveSurfaceClass =
  "rounded-2xl bg-white/[0.04] transition-colors duration-200 hover:bg-white/[0.06]";

export const appSyncPlatformCardClass =
  "relative isolate aspect-square flex min-h-[70px] flex-col items-center justify-center overflow-hidden rounded-lg p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_38px_rgba(0,0,0,0.16)] transition-[filter,transform] duration-200 hover:brightness-105 md:min-h-[90px] md:rounded-xl md:p-3 lg:min-h-[110px] lg:rounded-2xl lg:p-4 xl:min-h-[130px] xl:p-5 2xl:min-h-[140px] 2xl:p-6";

export const appSyncPlatformCardOverlayClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.08))]";

export const appSyncPlatformIconClass =
  "text-white/95 leading-none [&>svg]:text-[26px] md:[&>svg]:text-[30px] lg:[&>svg]:text-[34px] xl:[&>svg]:text-[38px]";

export const appSyncPlatformLabelClass =
  "mt-1 px-1 text-[10px] font-semibold leading-tight tracking-tight text-white/94 md:mt-2 md:text-xs lg:mt-2.5 lg:text-sm xl:text-[15px]";

export const appSyncFieldInputClass =
  "h-11 grow min-w-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl placeholder:text-white/36 transition-[filter,background] duration-200 focus:brightness-105";

export const appSyncSecondaryButtonClass =
  "h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.08),rgba(168,85,247,0.06),rgba(244,63,94,0.08))] px-3 text-sm font-medium text-white/88 transition-[filter,background] duration-200 hover:brightness-105 hover:text-white";

export const appSyncPrimaryButtonClass =
  "h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.94),rgba(168,85,247,0.88),rgba(244,63,94,0.9))] px-5 text-sm font-semibold tracking-tight text-white transition-[filter,opacity] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

export const appEntryFieldShellClass =
  "flex min-h-12 items-center rounded-2xl bg-white/[0.045] px-4 transition-colors duration-200 focus-within:bg-white/[0.07]";

export const appEntryFieldInputClass =
  "w-full min-w-0 bg-transparent py-3.5 text-[15px] text-white placeholder:text-white/38";

export const appEntryActionButtonBaseClass =
  "inline-flex items-center justify-center gap-2";

export const appEntrySecondaryButtonClass =
  "h-12 justify-center rounded-2xl bg-white/[0.05] px-5 text-sm font-medium text-white/82 transition-colors duration-200 hover:bg-white/[0.085] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

export const appEntryPrimaryButtonClass =
  "h-12 justify-center rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const pricingPaidCardSurfaceClass =
  "bg-[linear-gradient(180deg,rgba(244,63,94,0.07)_0%,rgba(255,255,255,0.03)_24%,rgba(255,255,255,0.022)_100%)] ring-1 ring-rose-400/20 shadow-[0_26px_64px_rgba(0,0,0,0.24)]";

export const pricingPaidIconSurfaceClass =
  "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_18px_36px_rgba(244,63,94,0.2)]";

export const pricingPaidBadgeSurfaceClass = "bg-rose-500/12 text-rose-100";

export const appSyncTooltipSurfaceClass =
  "rounded-xl bg-[linear-gradient(180deg,rgba(22,22,30,0.98),rgba(14,14,20,0.98))] px-3 py-2 text-[11px] text-white/76 shadow-xl shadow-black/25 backdrop-blur-xl";

export const appSyncPlaceholderRowClass =
  "flex items-center gap-3 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.024))] px-3 py-3";

export const appSyncListShellClass =
  "min-h-[220px] flex-1 overflow-hidden sm:min-h-[200px]";

export const appSyncListShellEmptyClass = "flex-1 overflow-hidden rounded-2xl";

export const appSyncCardThumbnailClass =
  "relative h-[44px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(24,24,31,0.88),rgba(10,10,14,0.92))]";

export const appSyncCardIndexClass =
  "shrink-0 text-[11px] font-medium leading-none tabular-nums text-white/38";

export const appSyncCardClass =
  "relative flex h-[74px] items-center gap-2.5 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.06),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] py-3 pr-3 pl-2.5 transition-[filter,background] duration-200 hover:brightness-105";

export const appStreamTopBarClass =
  "mb-3 flex items-center justify-between gap-3 sm:mb-4";

export const appStreamActionButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(168,85,247,0.08),rgba(244,63,94,0.14))] px-3.5 text-sm font-medium text-white/86 transition-[filter,background] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

export const appStreamPanelClass = "flex w-full flex-col";

export const appStreamListClass =
  "space-y-2 overflow-y-auto px-px pt-1 sm:space-y-2.5";

export const appStreamListViewportClass =
  "w-full min-h-[220px] sm:h-[208px] sm:min-h-[208px] sm:max-h-[208px] md:h-[214px] md:min-h-[214px] md:max-h-[214px]";

export const appStreamFileCardClass =
  "relative flex w-full max-w-full items-center justify-between overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.032))] px-2.5 py-2 transition-[background,filter] duration-200 sm:min-h-[58px] sm:px-3 sm:py-2.5 md:min-h-[62px] md:px-3.5";

export const appStreamFileCardSelectedClass =
  "bg-[radial-gradient(circle_at_left,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_right,rgba(244,63,94,0.14),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.048))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]";

export const appStreamFileCardIdleClass =
  "hover:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.038))] hover:brightness-105";

export const appStreamFileThumbnailClass =
  "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(24,24,31,0.88),rgba(10,10,14,0.92))]";

export const appStreamUploadDropzoneClass =
  "relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.13),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.13),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.028))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[filter,background] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl";

export const appStreamInlineAdderClass =
  "relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.10),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.022))] transition-[filter,background] duration-200 hover:brightness-105";

export const appStreamBottomActionRowClass = "flex gap-2";

export const appStreamGhostButtonClass =
  "h-11 w-full justify-center rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.08),rgba(168,85,247,0.06),rgba(244,63,94,0.08))] px-4 text-sm font-medium text-white/86 transition-[filter,background] duration-200 hover:brightness-105 hover:text-white";

export const appStreamPrimaryButtonClass =
  "h-11 w-full justify-center rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.94),rgba(168,85,247,0.88),rgba(244,63,94,0.9))] px-4 text-sm font-semibold text-white transition-[filter,opacity] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

export const appStreamScreenShareButtonClass =
  "flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_46%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.036),rgba(255,255,255,0.026))] p-4 transition-[filter,background] duration-200 hover:brightness-105 sm:p-6";

export const appStreamScreenShareIconClass =
  "mb-3 flex h-16 w-16 items-center justify-center text-violet-200 sm:mb-4 sm:h-20 sm:w-20";

export const appStreamScreenHeroSurfaceClass =
  "rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.08),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-2xl";

export const appStreamScreenOpenSectionClass =
  "mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center sm:gap-5 md:gap-6";

export const appStreamScreenIntroWidthClass = "w-full max-w-md";

export const appStreamScreenIntroClusterClass =
  "mx-auto flex w-full max-w-md items-center justify-center text-center";

export const appStreamScreenIntroCopyClass =
  "flex min-w-0 w-full flex-col items-center text-center";

export const appStreamScreenStepCardClass =
  "rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.06),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[filter,background] duration-200 hover:brightness-105 sm:rounded-2xl";

export const appStreamScreenStepBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.18),rgba(244,63,94,0.20))] text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] sm:mb-4 sm:h-12 sm:w-12 sm:text-lg";

export const appStreamScreenSupportCopyClass =
  "text-xs leading-6 text-white/78 sm:text-[13px] md:text-sm";

export const appStreamScreenInfoSurfaceClass =
  "rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:rounded-2xl";

export const appStreamScreenPreviewStatusClass =
  "rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.07),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.028))] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-2xl";

export const appStreamScreenPreviewFrameClass =
  "overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(10,10,14,0.94),rgba(5,5,8,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-2xl";

export const appStreamScreenAudioOnlyStateClass =
  "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]";

export const appStreamScreenToggleSurfaceClass =
  "rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:rounded-2xl";

export const appStreamScreenWarningSurfaceClass =
  "rounded-xl bg-[linear-gradient(180deg,rgba(245,158,11,0.13),rgba(217,119,6,0.08))] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-2xl";

export const appStreamScreenPrimaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.94),rgba(168,85,247,0.88),rgba(244,63,94,0.90))] px-4 py-3.5 text-sm font-semibold text-white transition-[filter,opacity] duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-base md:px-8 md:py-5 md:text-lg";

export const appTransactionRowClass =
  "flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 text-[13px] text-white/74";

export const appTransactionStatusBadgeClass =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]";

export const appTransactionStatusProcessingClass = "bg-amber-500/12 text-amber-200";
export const appTransactionStatusCompletedClass = "bg-emerald-500/12 text-emerald-200";
export const appTransactionStatusFailedClass = "bg-rose-500/14 text-rose-200";
export const appTransactionStatusNeutralClass = "bg-white/[0.06] text-white/60";

export const appWatchLimitCardClass =
  "rounded-2xl bg-white/[0.035] p-2.5 ring-1 ring-white/[0.08]";
export const appWatchLimitCardUrgentClass =
  "rounded-2xl bg-gradient-to-r from-rose-500/[0.08] via-rose-400/[0.06] to-transparent ring-1 ring-rose-400/15";
