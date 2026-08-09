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

// Compact row/chip/label variants — opt-in via DropdownActionRow's `compact` prop, used
// by the sidebar's LoginDropdown instances only. Kept as fully separate class strings
// (never appended alongside the default ones) so there's no same-property Tailwind
// cascade conflict — see feedback_portaled_modal_dismiss_bug for why that matters.
export const appDropdownRowCompactClass =
  "flex items-center gap-2 rounded-lg px-2 py-1.5";

export const appDropdownDividerClass = "h-px w-full bg-white/8";

export const appSeparatorLineClass = "h-px flex-1 bg-white/10";

export const appScrollbarHideClass = "scrollbar-hide";

export const appDropdownMetaTextClass =
  "text-[9px] md:text-[10px] text-white/42";

export const appDropdownLabelClass = "min-w-0 text-[11px] md:text-xs";

export const appDropdownActionLabelClass = `${appDropdownLabelClass} font-medium`;

export const appDropdownActionLabelCompactClass = "min-w-0 text-[12px] font-medium";

export const appDropdownQuietActionButtonClass = `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 ${appHoverRevealClass}`;

export const appDropdownQuietActionButtonCompactClass = `${appDropdownRowCompactClass} w-full text-left text-white/80 transition-all duration-200 ${appHoverRevealClass}`;

export const appDropdownDangerActionButtonClass = `${appDropdownRowClass} w-full text-left text-white/80 transition-all duration-200 hover:bg-rose-500/10 hover:text-white`;

export const appDropdownIconChipBaseClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg leading-none";

export const appDropdownIconChipCompactBaseClass =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md leading-none";

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

export const appStreamScreenHeroSurfaceClass = "rounded-dashMd bg-dashSurface";

// Left-aligned, matching the rest of the dashboard's top-left content start point —
// this used to be mx-auto + items-center + text-center, which centered the whole
// "before preview" block on the page while every other screen starts flush left.
export const appStreamScreenOpenSectionClass =
  "flex w-full max-w-2xl flex-col items-start gap-4 text-left sm:gap-5 md:gap-6";

export const appStreamScreenIntroWidthClass = "w-full max-w-md";

export const appStreamScreenIntroClusterClass = "flex w-full items-start text-left";

export const appStreamScreenIntroCopyClass =
  "flex min-w-0 w-full flex-col items-start text-left";

export const appStreamScreenStepCardClass =
  "rounded-dashMd bg-dashSurface transition-colors duration-200 hover:bg-dashSurfaceAlt";

export const appStreamScreenStepBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-white sm:mb-4 sm:h-12 sm:w-12 sm:text-lg";

export const appStreamScreenSupportCopyClass =
  "text-xs leading-6 text-dashTextDim sm:text-[13px] md:text-sm";

export const appStreamScreenInfoSurfaceClass = "rounded-dashMd bg-dashSurface";

export const appStreamScreenPreviewStatusClass = "rounded-dashMd bg-dashSurface";

export const appStreamScreenPreviewFrameClass = "overflow-hidden rounded-dashMd bg-black";

export const appStreamScreenAudioOnlyStateClass = "bg-dashSurface";

export const appStreamScreenToggleSurfaceClass = "rounded-dashSm bg-dashSurfaceAlt";

export const appStreamScreenWarningSurfaceClass = "rounded-dashSm bg-amber-500/10";

export const appStreamScreenPrimaryButtonClass = `inline-flex w-full items-center justify-center gap-2 rounded-dashMd bg-gradient-to-r ${movmashGradientStopsClass} px-4 py-3.5 text-sm font-semibold text-white transition-[filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-base md:px-8 md:py-5 md:text-lg`;

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

// Reconnect banner — shown over the player while the socket is recovering (deploy restart or
// network drop). Deliberately a non-blocking floating pill rather than a modal: the room is
// still the user's, playback state is preserved, and recovery is usually a few seconds.
export const appReconnectBannerWrapClass =
  "pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center px-3";

export const appReconnectBannerClass =
  "pointer-events-auto flex items-center gap-2.5 rounded-full bg-[linear-gradient(180deg,rgba(22,22,30,0.94),rgba(14,14,20,0.94))] px-4 py-2 text-[12px] font-medium text-white/80 shadow-lg shadow-black/30 backdrop-blur-xl ring-1 ring-white/[0.08] sm:text-[13px]";

export const appReconnectBannerFailedClass =
  "pointer-events-auto flex items-center gap-2.5 rounded-full bg-[linear-gradient(180deg,rgba(60,20,28,0.94),rgba(40,14,20,0.94))] px-4 py-2 text-[12px] font-medium text-rose-100 shadow-lg shadow-black/30 backdrop-blur-xl ring-1 ring-rose-400/20 sm:text-[13px]";

export const appReconnectBannerSpinnerClass =
  "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white/80";

// ---------------------------------------------------------------------------
// Dashboard redesign (movmash_mockup_local.html) — flat, opaque surfaces, no
// backdrop-blur. Kept separate from the zincGlass* family above: screens migrate
// to these one at a time, and the two systems intentionally look different until
// the old one is retired.
// ---------------------------------------------------------------------------

export const dashSurfaceCardClass = "bg-dashSurface rounded-dashMd";

export const dashSurfaceCardAltClass = "bg-dashSurfaceAlt rounded-dashMd";

export const dashSurfaceBorderedCardClass = `${dashSurfaceCardClass} border border-dashBorder`;

export const dashSurfacePanelClass = "bg-dashSurface rounded-dashLg";

export const dashTextDimClass = "text-dashTextDim";

export const dashTextMuteClass = "text-dashTextMute";

export const dashNavItemActiveClass =
  "text-dashText bg-[linear-gradient(100deg,rgba(225,29,72,0.28),rgba(219,39,119,0.24),rgba(192,38,211,0.22))]";

export const dashNavItemHoverClass = "text-dashTextDim hover:bg-white/[0.045] hover:text-dashText";

// Action tiles (home "Stream / Sync / Games" cards): flat surface, single pink icon
// accent, one soft glow revealed on hover — replaces the old per-card glass/multi-color
// gradient treatment.
export const dashActionTileClass =
  "bg-dashSurface hover:bg-[linear-gradient(135deg,rgba(219,39,119,0.07),rgba(192,38,211,0.05))] rounded-dashMd relative overflow-hidden transition-[background-image] duration-300";

export const dashActionTileGlowClass =
  "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.22),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100";

export const dashActionTileIconWrapClass = "flex items-center justify-center text-pink-600";

export const dashActionTileLabelClass = "text-[13.5px] font-semibold tracking-tight text-dashText";

export const dashJoinFieldWrapClass =
  "flex flex-1 items-center rounded-dashSm bg-dashSurfaceAlt transition-colors duration-200 focus-within:outline focus-within:outline-2 focus-within:outline-pink-600/55";

export const dashJoinInputFieldClass =
  "h-[50px] w-full appearance-none bg-transparent text-base text-dashText outline-none placeholder:text-dashTextMute";

// ---------------------------------------------------------------------------
// Sidebar dashboard shell (movmash_mockup_local.html left rail + account zone).
// ---------------------------------------------------------------------------

export const dashShellGridClass =
  "grid grid-cols-[clamp(226px,14vw,320px)_minmax(0,1fr)] gap-[clamp(24px,1.6vw,34px)] items-stretch p-4 max-[1080px]:grid-cols-[200px_minmax(0,1fr)] max-[760px]:grid-cols-1 max-[760px]:gap-5 max-[760px]:px-4 max-[760px]:pt-[72px] max-[760px]:pb-[78px]";

export const dashRailLeftClass =
  "relative flex flex-col overflow-hidden pt-2 pr-4 pl-1 max-[760px]:hidden";

export const dashRailSepAClass =
  "pointer-events-none absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent max-[760px]:hidden";

export const dashRailSepBClass =
  "pointer-events-none absolute right-0 top-12 bottom-12 w-px opacity-40 shadow-[0_0_14px_rgba(255,255,255,0.10)] bg-white/10 max-[760px]:hidden";

export const dashLogoRowClass = "flex items-center gap-2.5 px-1.5 pt-1 pb-4 shrink-0";

export const dashLogoWordClass = "text-[17px] font-bold tracking-[-0.01em] text-dashText";

export const dashNavClass = "flex flex-col gap-0.5 shrink-0";

export const dashNavItemBaseClass =
  "flex w-full items-center gap-2.5 rounded-dashSm px-2.5 py-2.5 text-[13.5px] font-medium transition-colors duration-150";

export const dashNavItemBadgeClass =
  "ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white";

export const dashNavChevClass = "ml-auto shrink-0 text-dashTextMute transition-transform duration-200";

export const dashSubmenuOuterClass = "grid transition-[grid-template-rows] duration-200 ease-out";

export const dashSubmenuListClass = "flex flex-col gap-px overflow-hidden py-1 pr-1 pl-[30px]";

export const dashSubmenuItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-left text-[13px] transition-colors duration-150 hover:bg-white/[0.045] hover:text-dashText";

export const dashSubmenuItemDefaultClass = "text-dashTextMute";

export const dashSubmenuItemActiveClass =
  "text-dashText bg-[linear-gradient(100deg,rgba(225,29,72,0.28),rgba(219,39,119,0.24),rgba(192,38,211,0.22))]";

export const dashCozyCardClass = "mt-auto flex shrink-0 flex-col";

export const dashCozyArtClass =
  "relative h-[210px] overflow-hidden rounded-2xl bg-[radial-gradient(160px_120px_at_80%_8%,rgba(192,38,211,0.5),transparent_70%),radial-gradient(190px_130px_at_10%_55%,rgba(225,29,72,0.4),transparent_70%),linear-gradient(135deg,#2a1229_0%,#1a0d1e_45%,#120a14_100%)]";

export const dashCozyScrimClass =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-b from-transparent to-[rgba(9,7,11,0.9)]";

export const dashCozyCopyClass = "absolute inset-x-[14px] bottom-[14px]";

export const dashCozyTitleClass = "m-0 text-[14px] font-bold leading-[1.35] text-white";

export const dashCozyDescriptionClass = "mt-1.5 text-[11.5px] leading-[1.5] text-white/70";

export const dashAccountZoneClass = "flex shrink-0 flex-col gap-2.5";

export const dashUpgradeButtonClass =
  "flex items-center justify-center gap-1.5 rounded-dashSm bg-[linear-gradient(100deg,rgba(225,29,72,0.28),rgba(219,39,119,0.24),rgba(192,38,211,0.22))] px-3 py-2.5 text-[12.5px] font-semibold text-white transition-colors duration-150 hover:bg-[linear-gradient(100deg,rgba(225,29,72,0.4),rgba(219,39,119,0.34),rgba(192,38,211,0.32))]";

// py-1.5 (not the more common py-2) keeps this row's height close to
// dashLoginTriggerClass's, so the account-zone slot doesn't visibly jump in height when
// swapping between the logged-out Login button and this logged-in row.
export const dashProfileTriggerClass =
  "flex w-full items-center gap-2 rounded-dashSm bg-white/[0.045] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-white/[0.075]";

// Guest login trigger — deliberately sized to match dashUpgradeButtonClass (same
// px-3 py-2.5 / text-[12.5px] / gap-1.5 / justify-center) rather than reusing
// dashProfileTriggerClass, which is sized for the logged-in row (avatar chip + name +
// chevron) and looks oversized for a plain icon + "Login" label.
export const dashLoginTriggerClass =
  "flex w-full items-center justify-center gap-1.5 rounded-dashSm bg-white/[0.045] px-3 py-2.5 text-[12.5px] font-semibold text-dashText transition-colors duration-150 hover:bg-white/[0.075]";

export const dashAvatarChipClass =
  "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-secondary text-[12.5px] font-bold text-white";

// Smaller chip used only by the sidebar's account-zone trigger row (see
// dashProfileTriggerClass above) so that row's height stays close to the logged-out
// Login button's — SidebarProfileMenu's popover header keeps the full-size chip.
export const dashAvatarChipCompactClass =
  "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-secondary text-[10px] font-bold text-white";

export const dashProfileMetaClass = "flex min-w-0 flex-col leading-tight";

export const dashProfileNameClass = "truncate text-[13.5px] font-semibold text-dashText";

export const dashProfileHandleClass = "truncate text-[11.5px] text-dashTextMute";

export const dashPopoverPanelClass =
  "absolute inset-x-0 bottom-[calc(100%+10px)] z-[60] flex flex-col gap-px rounded-dashSm border border-dashBorder bg-dashSurface p-1.5";

export const dashPopoverRowClass =
  "flex w-full items-center gap-3 rounded-xl px-2 py-[7px] text-left text-[13px] font-medium text-dashText transition-colors duration-150 hover:bg-white/[0.045]";

export const dashPopoverRowIconClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-dashSurfaceAlt text-pink-600";

export const dashPopoverRowIconUpgradeClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-white";

export const dashPopoverDividerClass = "mx-1 my-1 h-px bg-dashBorder";

export const dashPopoverDangerRowClass = `${dashPopoverRowClass} text-rose-600`;

export const dashPopoverBackdropClass = "fixed inset-0 z-[55]";

// ---------------------------------------------------------------------------
// Mobile top bar / bottom tab bar / full-screen profile sheet.
// ---------------------------------------------------------------------------

export const dashMobileTopbarClass =
  "fixed inset-x-0 top-0 z-40 hidden h-[58px] items-center border-b border-dashBorder bg-primaryDark px-3.5 max-[760px]:flex";

export const dashMobileBottombarClass =
  "fixed inset-x-0 bottom-0 z-40 hidden h-[62px] items-stretch border-t border-dashBorder bg-primaryDark px-1 py-1.5 max-[760px]:flex";

export const dashMobileTabItemClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold text-dashTextMute";

export const dashMobileTabItemActiveClass = "text-pink-600";

export const dashMobileProfileSheetClass =
  "fixed inset-x-0 top-[58px] bottom-[62px] z-[42] overflow-y-auto bg-primaryDark px-4 py-6";

// Forces the shared LoginDropdown panel (normally a blurred dark-glass gradient, tuned for
// the top-bar header) onto the flat dash-surface language used everywhere else in the
// sidebar/mobile shell. `!` is required — the base panel sets its look via bg-[...]/rounded-2xl/
// backdrop-blur, which plain utility ordering can't reliably beat.
export const dashLoginPopoverOverrideClass =
  "!bg-none !bg-dashSurface !backdrop-blur-none !rounded-dashSm !border !border-dashBorder";

// ---------------------------------------------------------------------------
// Home hero banner (demo-video placeholder area, movmash_mockup_local.html .hero).
// No real demo video exists yet — this is deliberately the mockup's placeholder
// treatment, not a stand-in for a video player.
// ---------------------------------------------------------------------------

export const dashHeroClass =
  "relative flex-1 min-h-[260px] max-h-[640px] overflow-hidden rounded-dashLg bg-[radial-gradient(600px_260px_at_80%_0%,rgba(192,38,211,0.24),transparent_60%),radial-gradient(500px_260px_at_10%_100%,rgba(225,29,72,0.24),transparent_60%),linear-gradient(160deg,#1c1120_0%,#100b12_60%,var(--dash-surface)_100%)]";

export const dashHeroPlayButtonClass =
  "absolute left-1/2 top-1/2 flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-[4px]";

export const dashHeroCopyClass = "absolute bottom-5 left-[22px] max-w-[60%]";

export const dashHeroTitleClass =
  "m-0 text-[clamp(24px,3vw,34px)] font-extrabold leading-[1.08] text-dashText";

export const dashHeroAccentClass =
  "bg-secondary bg-clip-text text-transparent";

export const dashHeroDescriptionClass =
  "mt-2 flex items-center gap-1.5 text-[13px] text-dashTextDim";

// Mobile: hero shrinks to a fixed aspect band instead of flexing to fill space
// (movmash_mockup_local.html's @media (max-width:760px) .hero rule).
export const dashHeroMobileClass =
  "max-[760px]:h-[46vw] max-[760px]:max-h-[240px] max-[760px]:min-h-0 max-[760px]:flex-none";

// ---------------------------------------------------------------------------
// Home dashboard layout — the two-column split (main content + right rail)
// that sits inside DashboardShell's single main column. Kept local to the home
// page rather than built into DashboardShell, since only home needs a right
// rail — every other dashboard route stays single-column.
// ---------------------------------------------------------------------------

export const dashHomeGridClass =
  "grid flex-1 grid-cols-[minmax(0,1fr)_clamp(272px,16vw,380px)] items-stretch gap-[clamp(24px,1.6vw,34px)] max-[1080px]:grid-cols-1";

export const dashHomeMainColClass = "flex min-w-0 flex-col gap-[18px]";

export const dashHomeRailColClass = "flex flex-col gap-4";

// Shared top-left-aligned content wrapper for dashboard subpages (/sync, /stream,
// /stream/screen, /games) — deliberately does NOT center content vertically/horizontally,
// so every route reached from the sidebar starts at the same top-left position instead of
// some being vertically centered and others not.
export const dashPageContentWrapClass = "flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden";

// Tighter title-to-subtitle gap for the same 4 dashboard subpages — a scoped copy of
// appSectionTitleWrapClass (not a shared-token edit) so the unrelated device-modal
// SectionTitle.tsx keeps its own larger spacing untouched.
export const dashPageTitleWrapClass = "mb-2 flex items-center sm:mb-2.5 md:mb-3";

// Shared section head ("Actions", "Popular Games", "Virtual Gifts", "For You Two").
export const dashSectionHeadClass = "mb-3 flex items-baseline justify-between";

export const dashSectionHeadTitleClass = "m-0 text-base font-bold text-dashText";

export const dashSectionHeadLinkClass =
  "bg-secondary bg-clip-text text-[12.5px] font-semibold text-transparent transition-[filter] duration-150 hover:brightness-125";

// Actions grid — 3 icon tiles + 1 join-by-code tile, all 4 cells the same size.
// (Games isn't a tile here — it already has its own preview section below.)
export const dashActionsGridClass = "grid grid-cols-2 gap-3 min-[561px]:grid-cols-4";

export const dashActionTileSizeClass = "min-h-[clamp(150px,9vw,200px)]";

export const dashJoinTileClass =
  "relative flex min-h-[clamp(150px,9vw,200px)] flex-col items-stretch justify-center gap-2.5 rounded-dashMd bg-dashSurface p-3.5";

export const dashJoinTileHeaderClass = "text-center text-[11.5px] font-semibold leading-[1.3] text-dashText";

// Fixed height shared by the input wrap and the submit button below, so the two are
// guaranteed the same height regardless of each element's own line-height/font
// (padding alone doesn't guarantee that — an <input>'s intrinsic line box and a
// <button>'s text don't necessarily render the same height at equal padding).
const dashJoinTileControlHeightClass = "h-9";

// The visible input surface: a wrapper div carries the background, because Input's
// variant="raw" always adds its own bg-transparent — putting a background straight on
// the <input> would fight that class for the same CSS property with no reliable winner
// (see feedback_portaled_modal_dismiss_bug for the same class of bug elsewhere).
export const dashJoinTileInputWrapClass =
  `flex w-full items-center ${dashJoinTileControlHeightClass} rounded-[9px] bg-dashSurfaceAlt px-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-pink-600/55`;

export const dashJoinTileInputClass =
  "w-full text-[12px] tracking-[0.03em] text-dashText tabular-nums placeholder:text-dashTextMute placeholder:tracking-normal";

export const dashJoinTileSubmitClass =
  `flex w-full items-center justify-center ${dashJoinTileControlHeightClass} rounded-[9px] bg-secondary px-2.5 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50`;

// Popular Games preview grid (compact cards, distinct from the full /games catalog page).
export const dashGamesGridClass =
  "grid grid-cols-2 gap-3.5 min-[901px]:grid-cols-4";

export const dashGameCardClass =
  "overflow-hidden rounded-dashMd border border-dashBorder bg-dashSurface";

export const dashGameCardThumbClass =
  "flex h-[clamp(92px,7vw,130px)] items-center justify-center text-white/90";

export const dashGameCardMetaClass = "px-3 pb-3 pt-2.5";

export const dashGameCardNameClass = "text-[13.5px] font-bold text-dashText";

export const dashGameCardSubClass = "mt-0.5 text-[11.5px] text-dashTextMute";

// Right rail panel (For You Two — the only rail panel; Virtual Gifts was removed, no
// real feature backs it).
export const dashPanelClass = "rounded-dashLg bg-dashSurface p-3.5";

export const dashProductRowClass = "flex items-center gap-2.5 px-0.5 py-2";

export const dashProductThumbClass =
  "h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-dashSurfaceAlt";

export const dashProductThumbImgClass = "h-full w-full object-cover";

// min-w-0 is required here: a flex item's default min-width is auto (content size), so
// without it a long product name pushes the row wider instead of truncating, and the
// link icon gets shoved out of its fixed position on the right.
export const dashProductTextColClass = "min-w-0 flex-1";

export const dashProductNameClass = "line-clamp-1 text-[12.5px] font-semibold leading-[1.3] text-dashText";

export const dashProductPriceClass = "text-[11px] tabular-nums text-dashTextMute";

export const dashProductLinkClass =
  "ml-auto flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[11px] font-semibold text-pink-600 transition-colors duration-150 hover:text-fuchsia-500";
