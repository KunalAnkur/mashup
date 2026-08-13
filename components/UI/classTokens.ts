export const movmashGradientStopsClass =
  "from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500";

export const movmashThemeGradientClass =
  "bg-[linear-gradient(135deg,rgba(190,24,93,0.96)_0%,rgba(190,24,93,0.9)_38%,rgba(168,85,247,0.8)_100%)]";

export const movmashElevatedShadowClass =
  "shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40";

// Flat primary action button — the dashboard-wide default for any "prominent CTA" outside
// the Watch Together pages (which have their own scoped tokens). Deliberately no
// hover:scale bounce and no heavy shadow-xl glow (that combo read as "too shiny/AI-vibe"
// per owner feedback on both the Games "Start game" and Profile "Save changes" buttons) —
// same flat rounded-dashSm + gradient-fill recipe as appSyncPrimaryButtonClass/
// appStreamPrimaryButtonClass, just under a page-neutral name since this one isn't scoped
// to a single page family.
export const dashPrimaryButtonClass = `inline-flex h-10 items-center justify-center gap-2 rounded-dashSm bg-gradient-to-r ${movmashGradientStopsClass} px-5 text-sm font-semibold text-white transition-[filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50`;

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

// bg-white/[0.08] (not bg-dashSurfaceAlt) — its only caller (EmptyUrlState's placeholder
// rows) now sits on a bg-dashSurfaceAlt row, so a same-color chip would disappear into it.
export const purpleAccentIconSurfaceClass =
  "bg-white/[0.08] text-pink-500 flex items-center justify-center";

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

// Confirmed via grep this token's only consumer is SectionTitle.tsx below, whose only 2
// callers are UrlInputSection.tsx/SupportedPlatformsGrid.tsx — safe to shrink directly.
// Matches dashPageTitleWrapClass's tighter scale used everywhere else in the redesign.
export const appSectionTitleWrapClass = "mb-2 flex items-center sm:mb-2.5 md:mb-3";

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

// Shrunk for the single-row-of-6 layout (was a 3x2 grid of much bigger tiles) — a fixed,
// modest size instead of the old responsive escalation up to 140px, since this grid only
// ever renders at lg+ anyway (its wrapper is `hidden lg:block`).
export const appSyncPlatformCardClass =
  "relative isolate aspect-square flex min-h-[52px] flex-col items-center justify-center overflow-hidden rounded-dashSm p-1.5 text-center transition-[filter] duration-200 hover:brightness-110";

// Bottom scrim only (no glossy top highlight) so the white icon/label stay legible over
// each platform's flat brand-color fill — same idea as the sidebar's dashCozyScrimClass.
export const appSyncPlatformCardOverlayClass =
  "pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/35 to-transparent";

// Icon size now lives directly on each platform's own icon element (constants/urlPlatforms.tsx)
// since it needs one fixed small size, not the old per-breakpoint scale.
export const appSyncPlatformIconClass = "text-white/95 leading-none";

export const appSyncPlatformLabelClass =
  "mt-1 px-0.5 text-[9px] font-semibold leading-tight tracking-tight text-white/94";

// Background lives on this wrapper, not the <input> itself — Input's variant="raw" always
// prepends its own bg-transparent, which would fight a bg-* class placed directly on the
// input for the same CSS property with no reliable winner (see dashJoinTileInputWrapClass
// for the same pattern/reasoning).
export const appSyncFieldWrapClass =
  "flex h-11 grow min-w-0 items-center rounded-dashSm bg-dashSurfaceAlt px-4 transition-colors duration-200 focus-within:outline focus-within:outline-2 focus-within:outline-pink-600/55";

export const appSyncFieldInputClass =
  "w-full min-w-0 bg-transparent text-sm font-medium text-dashText placeholder:text-dashTextMute";

export const appSyncPrimaryButtonClass = `h-11 items-center justify-center gap-2 rounded-dashSm bg-gradient-to-r ${movmashGradientStopsClass} px-5 text-sm font-semibold tracking-tight text-white transition-[filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50`;

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
  "rounded-dashSm border border-dashBorder bg-dashSurface px-3 py-2 text-[11px] text-dashTextDim shadow-xl shadow-black/25";

// bg-dashSurfaceAlt (not bg-dashSurface) — the panel wrapping this is itself bg-dashSurface,
// same fix as the File Share file cards (appStreamFileCardClass) for the identical problem.
export const appSyncPlaceholderRowClass =
  "flex items-center gap-3 rounded-dashSm bg-dashSurfaceAlt px-3 py-2.5";

// Fixed height (not min/max) reserved for exactly 3 cards, same value on both the empty
// and populated variants below — so the box never grows or shrinks as the 1st/2nd/3rd URL
// gets added (only scrolls internally once a 4th arrives), matching how File Share's file
// list (appStreamListViewportClass) reserves constant space regardless of file count.
export const appSyncListShellClass = "h-[192px] overflow-hidden";

export const appSyncListShellEmptyClass = "h-[192px] overflow-hidden rounded-dashSm";

// Sized to match File Share's file-card thumbnail exactly (appStreamFileThumbnailClass'
// video-file sizing) — owner asked for the same scale across both lists.
export const appSyncCardThumbnailClass =
  "relative h-8 w-12 shrink-0 overflow-hidden rounded-dashSm bg-dashSurfaceAlt sm:h-[34px] sm:w-[60px]";

export const appSyncCardIndexClass =
  "shrink-0 text-[10px] font-medium leading-none tabular-nums text-dashTextMute";

// bg-dashSurfaceAlt (not bg-dashSurface) for the same panel-contrast reason as the
// placeholder row above; hover bumped one step further since the resting state now
// occupies what hover used to be. min-h (not fixed h) now matches File Share's file-card
// scale (appStreamFileCardClass's sm:min-h-[58px]) instead of a flat 64px.
export const appSyncCardClass =
  "relative flex min-h-[52px] w-full items-center gap-2.5 rounded-dashSm bg-dashSurfaceAlt px-2.5 py-2 transition-colors duration-200 hover:bg-white/[0.06] sm:min-h-[58px] sm:px-3 sm:py-2.5";

export const appStreamTopBarClass =
  "mb-2 flex items-center justify-between gap-3 sm:mb-2.5 md:mb-3";

export const appStreamActionButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-dashSm bg-dashSurfaceAlt px-3.5 text-sm font-medium text-dashText transition-colors duration-150 hover:bg-white/[0.075] disabled:cursor-not-allowed disabled:opacity-50";

export const appStreamPanelClass = "flex w-full flex-col";

export const appStreamListClass =
  "space-y-2 overflow-y-auto px-px pt-1 sm:space-y-2.5";

export const appStreamListViewportClass =
  "w-full min-h-[220px] sm:h-[208px] sm:min-h-[208px] sm:max-h-[208px] md:h-[214px] md:min-h-[214px] md:max-h-[214px]";

// bg-dashSurfaceAlt (not bg-dashSurface) — the panel wrapping this list is itself
// bg-dashSurface, so a same-color card was invisible against it. This is the one shade
// lighter than the panel, giving each file its own visible box.
export const appStreamFileCardClass =
  "relative flex w-full max-w-full items-center justify-between overflow-hidden rounded-dashMd bg-dashSurfaceAlt px-2.5 py-2 transition-colors duration-200 sm:min-h-[58px] sm:px-3 sm:py-2.5 md:min-h-[62px] md:px-3.5";

// Reuses the same brand-gradient wash as the sidebar's active nav/submenu items
// (dashNavItemActiveClass) so "selected" reads consistently across the dashboard.
export const appStreamFileCardSelectedClass =
  "bg-[linear-gradient(100deg,rgba(225,29,72,0.28),rgba(219,39,119,0.24),rgba(192,38,211,0.22))]";

// One more step lighter than the card's own bg-dashSurfaceAlt resting state.
export const appStreamFileCardIdleClass = "hover:bg-white/[0.06]";

export const appStreamFileThumbnailClass =
  "flex shrink-0 items-center justify-center overflow-hidden rounded-dashSm bg-dashSurfaceAlt";

export const appStreamUploadDropzoneClass =
  "relative flex flex-col items-center justify-center overflow-hidden rounded-dashMd border border-dashed border-dashBorder bg-dashSurface transition-colors duration-200 hover:bg-dashSurfaceAlt disabled:cursor-not-allowed disabled:opacity-50";

// Border added so this reads as its own clickable element against the panel's identical
// bg-dashSurface background — previously flush/invisible, same fix as the file cards above,
// borrowing the dropzone's own dashed-border treatment for a consistent "add" affordance.
export const appStreamInlineAdderClass =
  "relative flex flex-col items-center justify-center overflow-hidden rounded-dashMd border border-dashed border-dashBorder bg-dashSurface transition-colors duration-200 hover:bg-dashSurfaceAlt";

export const appStreamBottomActionRowClass = "flex gap-2";

export const appStreamPrimaryButtonClass = `h-11 w-full justify-center rounded-dashMd bg-gradient-to-r ${movmashGradientStopsClass} px-4 text-sm font-semibold text-white transition-[filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50`;

export const appStreamScreenShareButtonClass =
  "flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_46%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.036),rgba(255,255,255,0.026))] p-4 transition-[filter,background] duration-200 hover:brightness-105 sm:p-6";

export const appStreamScreenShareIconClass =
  "mb-3 flex h-16 w-16 items-center justify-center text-violet-200 sm:mb-4 sm:h-20 sm:w-20";

export const appStreamScreenHeroSurfaceClass = "rounded-dashMd bg-dashSurface";

// Centered — owner explicitly reversed the earlier flush-left decision for this page
// (a left-aligned narrow card on a wide viewport left a large empty void to its right,
// reading as content "stuck"/bunched on the left rather than intentionally placed).
// Boxed in the same bg-dashSurface card as every other section on this page (steps,
// Quick Tips, and this block's own post-preview counterpart via appStreamScreenHeroSurfaceClass).
export const appStreamScreenOpenSectionClass =
  "flex w-full max-w-2xl flex-col items-center gap-4 rounded-dashMd bg-dashSurface p-4 text-center sm:gap-5 sm:p-5 md:gap-6 md:p-6";

export const appStreamScreenIntroWidthClass = "w-full max-w-md";

export const appStreamScreenIntroClusterClass = "flex w-full items-center text-center";

export const appStreamScreenIntroCopyClass =
  "flex min-w-0 w-full flex-col items-center text-center";

export const appStreamScreenStepCardClass =
  "rounded-dashMd bg-dashSurface transition-colors duration-200 hover:bg-dashSurfaceAlt";

// Mini illustration frame for each "How it works" step — a compact fixed-size square
// (not a stretched full-width banner) so the small icon inside it doesn't drown in a
// mostly-empty dark rectangle. Sits left of the text in the mobile row layout, centers
// above the text once cards switch to a column at sm+. Replaces the old plain numbered
// circle with a small visual that actually depicts the action (mini button+cursor / tab
// picker / live indicator), per owner request for something more concrete than an
// abstract "1/2/3".
export const appStreamScreenStepVisualClass =
  "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-dashSm bg-dashSurfaceAlt sm:mb-3 sm:h-16 sm:w-16 md:h-[72px] md:w-[72px]";

export const appStreamScreenStepNumberClass =
  "absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white sm:h-5 sm:w-5 sm:text-[10px]";

export const appStreamScreenSupportCopyClass =
  "text-xs leading-6 text-dashTextDim sm:text-[13px] md:text-sm";

export const appStreamScreenPreviewStatusClass = "rounded-dashMd bg-dashSurface";

export const appStreamScreenPreviewFrameClass = "overflow-hidden rounded-dashMd bg-black";

export const appStreamScreenAudioOnlyStateClass = "bg-dashSurface";

export const appStreamScreenToggleSurfaceClass = "rounded-dashSm bg-dashSurfaceAlt";

export const appStreamScreenWarningSurfaceClass = "rounded-dashSm bg-amber-500/10";

// Fixed, content-sized pill — deliberately does NOT scale padding/text up across
// breakpoints like the old version did (px-4→8, py-3.5→5, text-sm→lg). That escalation
// made this the one CTA in the whole app that ballooned into a huge landing-page-style
// slab on desktop, out of scale with every other primary button (Games' Start,
// dashUpgradeButtonClass, appStreamPrimaryButtonClass, appSyncPrimaryButtonClass — all a
// fixed h-11/text-sm regardless of viewport).
export const appStreamScreenPrimaryButtonClass = `inline-flex h-11 items-center justify-center gap-2 rounded-dashSm bg-gradient-to-r ${movmashGradientStopsClass} px-6 text-sm font-semibold text-white transition-[filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50`;

export const appTransactionRowClass =
  "flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 text-[13px] text-white/74";

// ---------------------------------------------------------------------------
// Subscription page — the current plan banner and the purchase history table.
// A wide two-column banner rather than the tall narrow card it replaces: the plan and
// what it costs belong side by side with what it gets you, and the page below is a
// table that needs the full width anyway.
// ---------------------------------------------------------------------------

export const subPageWrapClass = "mx-auto w-full max-w-5xl space-y-6 pb-10 pt-5 md:pt-8";

export const subPlanBannerClass =
  "relative overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

/**
 * A soft bloom behind the tier mark. Without it a paid card is the same flat panel as
 * everything else on the page, and the one thing this card should convey is that the
 * account is on something.
 */
export const subPlanGlowClass =
  "pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(225,29,72,0.16),transparent_68%)]";

// Everything on one column-free stack. The two-column version left the right-hand
// side almost empty above three short perks, and the full-height rule between them
// drew a line down the middle of that emptiness.
export const subPlanBodyClass = "p-6 sm:p-7";

export const subPlanHeaderClass = "flex items-start justify-between gap-4";

export const subPlanBadgeClass =
  "inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68";

export const subPlanNameClass =
  "mt-3.5 font-parkinsans text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[2.35rem]";

export const subPlanPriceRowClass = "mt-3 flex items-end gap-2";

export const subPlanPriceClass =
  "font-parkinsans text-[1.9rem] font-semibold leading-none text-white/92 md:text-[2.1rem]";

export const subPlanCadenceClass = "pb-0.5 text-[13px] lowercase text-white/42";

export const subPlanIconClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/[0.05] text-white/90";

// Perks read across rather than down: they are three or four words each, and a row of
// them fills the width the price leaves empty instead of stacking into a second column.
export const subPlanPerksRowClass = "mt-6 flex flex-wrap gap-x-7 gap-y-3";

export const subPlanPerkClass = "flex items-center gap-2.5 text-[13px] leading-5 text-white/74";

export const subPlanPerkIconClass =
  "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70";

// What happens next on the left, what you can do about it on the right — one baseline,
// so the card ends on a line of intent rather than a stray banner.
export const subPlanFooterClass =
  "flex flex-col gap-3.5 border-t border-white/[0.045] bg-white/[0.012] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7";

export const subPlanFooterTextClass = "text-[13px] leading-relaxed text-white/56";

export const subPlanFooterLinkClass =
  "shrink-0 font-semibold text-rose-300 transition-colors duration-200 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50";

export const subPlanActionsClass = "flex shrink-0 flex-wrap items-center gap-2.5";

// --- purchase history -------------------------------------------------------

export const subHistoryCardClass =
  "overflow-hidden rounded-[1.5rem] bg-white/[0.028] shadow-[0_18px_50px_rgba(0,0,0,0.22)]";

export const subHistoryToolbarClass =
  "flex flex-col gap-2.5 p-4 sm:flex-row sm:items-center";

export const subHistorySearchWrapClass =
  "flex h-10 flex-1 items-center gap-2 rounded-xl bg-white/[0.045] px-3.5 transition-colors duration-150 focus-within:bg-white/[0.07]";

export const subHistorySearchInputClass =
  "w-full bg-transparent text-[13px] text-white/88 placeholder:text-white/34 focus:outline-none";

export const subHistorySelectClass =
  "h-10 shrink-0 cursor-pointer rounded-xl bg-white/[0.045] px-3.5 text-[13px] text-white/72 transition-colors duration-150 hover:bg-white/[0.07] focus:bg-white/[0.07] focus:outline-none";

export const subHistoryHeadRowClass = "bg-white/[0.022]";

export const subHistoryHeadCellClass =
  "px-4 py-2.5 text-left text-[10.5px] font-medium uppercase tracking-[0.11em] text-white/38";

/** Header cells that sort. The arrow only appears on the column actually sorting. */
export const subHistorySortButtonClass =
  "inline-flex items-center gap-1 transition-colors duration-150 hover:text-white/70";

export const subHistoryRowClass =
  "border-t border-white/[0.035] text-[13px] text-white/74 transition-colors duration-150 hover:bg-white/[0.018]";

export const subHistoryCellClass = "px-4 py-4 align-middle";

export const subHistoryIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-rose-500/[0.11] text-rose-200/80";

export const subHistoryInvoiceLinkClass =
  "inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-300 transition-colors duration-150 hover:text-rose-200";

export const subHistoryPagerClass =
  "flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.035] px-4 py-3.5 text-[12.5px] text-white/48";

export const subHistoryPagerButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/78 transition-colors duration-150 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-35";

export const subHistoryEmptyClass = "px-4 py-14 text-center text-[13px] text-white/42";

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

export const dashJoinFieldWrapClass =
  "flex flex-1 items-center rounded-dashSm bg-dashSurfaceAlt transition-colors duration-200 focus-within:outline focus-within:outline-2 focus-within:outline-pink-600/55";

export const dashJoinInputFieldClass =
  "h-[50px] w-full appearance-none bg-transparent text-base text-dashText outline-none placeholder:text-dashTextMute";

// ---------------------------------------------------------------------------
// Sidebar dashboard shell (movmash_mockup_local.html left rail + account zone).
// ---------------------------------------------------------------------------

export const dashShellGridClass =
  "grid grid-cols-[clamp(226px,14vw,320px)_minmax(0,1fr)] gap-[clamp(24px,1.6vw,34px)] items-stretch p-4 max-[1080px]:grid-cols-[200px_minmax(0,1fr)] max-[760px]:grid-cols-1 max-[760px]:gap-5 max-[760px]:px-4 max-[760px]:pt-[72px] max-[760px]:pb-[78px]";

// One plain hairline on the right edge. It replaces a pair of absolutely positioned
// overlays — a fading gradient plus a glow — that had to be inset from the top and
// bottom to hide their own ends, and so never reached the full height of the rail.
export const dashRailLeftClass =
  "relative flex flex-col overflow-hidden border-r border-dashBorder pt-2 pr-4 pl-1 max-[760px]:hidden";

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

export const dashCozyCardClass =
  "mt-auto flex shrink-0 flex-col overflow-hidden rounded-2xl border border-dashBorder bg-dashSurface";

// Art on top, copy underneath, rather than copy laid over the art: the title runs to
// three lines in a narrow sidebar, and over an illustration with two faces in the
// middle of it there is no scrim dark enough to make that both legible and not a mess.
//
// The gradient stays as the backdrop the illustration loads over — a 1.7MB PNG on the
// far side of a CDN is not instant, and an empty box in the sidebar reads as broken.
export const dashCozyArtClass =
  "relative h-[132px] overflow-hidden bg-[radial-gradient(160px_120px_at_80%_8%,rgba(192,38,211,0.5),transparent_70%),radial-gradient(190px_130px_at_10%_55%,rgba(225,29,72,0.4),transparent_70%),linear-gradient(135deg,#2a1229_0%,#1a0d1e_45%,#120a14_100%)]";

// Anchored above centre. The artwork is portrait and its lower third is bare rooftop,
// so centring this band would push the two figures half out of frame.
export const dashCozyImgClass = "absolute inset-0 h-full w-full object-cover object-[center_38%]";

// A short fade at the foot of the art so it settles into the copy below instead of
// ending on a hard line.
export const dashCozyScrimClass =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,13,17,0.85)_100%)]";

export const dashCozyCopyClass = "px-3.5 pb-3.5 pt-3";

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


// ---------------------------------------------------------------------------
// Discover carousel — the home hero. The picture is the slide: art runs the full band
// and the words sit on it, rather than beside it in a column that costs the art a
// third of the space.
// ---------------------------------------------------------------------------

/** The literal colour behind the carousel. Gradient stops need a value, not a var. */
export const dashSurfaceHex = "#100e13";

export const dashDiscoverFrameClass =
  "group/hero relative overflow-hidden rounded-dashLg border border-dashBorder bg-dashSurface";

export const dashDiscoverSlideClass =
  "relative h-[clamp(340px,40vh,440px)] min-w-0 flex-[0_0_100%] overflow-hidden max-[760px]:h-[clamp(300px,72vw,380px)]";

/**
 * The same image, blown up and blurred behind itself.
 *
 * It is what lets one treatment hold a night-time film still and a product shot on a
 * white background: the band is always filled, always in the picture's own colours, and
 * never ends on a hard pale edge. `overflow-hidden` on the slide is load-bearing — the
 * scale spills past the frame otherwise, and the spill is outside every mask.
 */
export const dashDiscoverBackdropClass =
  "absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.32] saturate-[1.7]";

/** Pulls each picture towards the room it hangs in, so none arrives lit differently. */
export const dashDiscoverArtClass =
  "absolute inset-0 h-full w-full brightness-[0.92] contrast-[1.06] transition-transform duration-[7000ms] ease-out";

/** Framed art sits upper-right; centred, the title lands across the middle of it. */
export const dashDiscoverArtFramedClass =
  "object-contain object-[72%_34%] p-8 max-[760px]:object-[50%_26%] max-[760px]:p-6";

export const dashDiscoverCopyClass =
  "absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-7 pb-8 max-[760px]:p-5 max-[760px]:pb-7 min-[761px]:max-w-[62%]";

export const dashDiscoverEyebrowClass =
  "flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/75 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]";

export const dashDiscoverTitleClass =
  "m-0 text-[clamp(26px,3.4vw,42px)] font-extrabold leading-[1.06] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]";

// Clamped: a description that wraps to three lines starts competing with the picture
// for the band, which is the thing this layout exists to stop.
export const dashDiscoverDescClass =
  "-mt-0.5 line-clamp-2 max-w-[44ch] text-[13px] leading-[1.5] text-white/70 drop-shadow-[0_1px_12px_rgba(0,0,0,0.8)]";

export const dashDiscoverCtaClass =
  "inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-[13.5px] font-bold text-white transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";

export const dashDiscoverMetaClass = "text-[12px] font-medium text-white/55";

export const dashDiscoverDotsClass =
  "absolute bottom-8 right-7 flex items-center gap-1.5 max-[760px]:bottom-7 max-[760px]:right-5";

export const dashDiscoverArrowsClass =
  "absolute right-6 top-6 flex gap-2 opacity-0 transition-opacity duration-200 group-hover/hero:opacity-100 max-[760px]:hidden";

export const dashDiscoverArrowClass =
  "flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70";

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

// Actions — a row of horizontal cards: coloured icon, then a title and a line of copy
// saying what it is for, then an arrow.
//
// All four abreast once the viewport can carry it. Below that they fall to two and then
// one rather than being squeezed — at four across in a narrow column the description
// wraps to four lines and the row stops being a row.
export const dashActionsGridClass =
  "grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1180px]:grid-cols-5";

/**
 * Icon beside the text wherever the card is wide enough to hold both, stacked where it
 * is not — which is only the middle of the range.
 *
 *   below 1180   two or three across, so each card is roomy: side by side
 *   1180–1700    five across in a ~155px card, 80px of it text: stacked, or the titles
 *                truncate to "Scree…"
 *   above 1700   five across but the column is ~1180px, so a card is 220px: side by side
 *
 * The 1700 rule has to come after the 1180 one — Tailwind emits breakpoints in width
 * order, so the wider query is the one that wins where both match.
 */
export const dashActionTileClass =
  "group flex items-center gap-2.5 rounded-dashMd bg-dashSurface p-3.5 text-left transition-colors duration-200 hover:bg-white/[0.05] min-[1180px]:flex-col min-[1180px]:items-start min-[1180px]:gap-2.5 min-[1180px]:p-4 min-[1700px]:flex-row min-[1700px]:items-center min-[1700px]:gap-3";

/**
 * A solid colour, not a tint.
 *
 * Each action gets its own, so the row is scannable by colour before a word of it is
 * read — which is the whole reason this shape beats four identical grey tiles.
 */
export const dashActionIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]";

export const dashActionCopyClass =
  "min-w-0 flex-1 min-[1180px]:w-full min-[1180px]:flex-none min-[1700px]:w-auto min-[1700px]:flex-1";

// `truncate` rather than wrap: a title on two lines in a card this narrow costs the
// description its second line and makes the row ragged.
export const dashActionLabelClass =
  "truncate text-[13px] font-bold leading-tight text-dashText min-[1180px]:text-[13.5px]";

// Clamped: a fourth line pushes one card taller than its neighbours and the row goes
// ragged, which is the one thing a row of four must not do.
export const dashActionDescClass =
  "mt-0.5 line-clamp-2 text-[11px] leading-[1.35] text-dashTextMute min-[1180px]:text-[11.5px]";

/** Slides on hover — the only motion, and it points where the card goes. */
/**
 * Hidden until the row has the width for it.
 *
 * At four across in an 870px column each card is barely 200px, and an always-visible
 * arrow costs the copy the 22px that keeps "Screen Share" on one line. The card is the
 * click target either way — the arrow was only ever saying so.
 */
export const dashActionArrowClass =
  "hidden shrink-0 text-[15px] text-dashTextMute transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-dashText min-[1700px]:block";

// Join by code sits under the grid rather than in it: it is a form, not a link, and a
// cell with an input in it never matches the height of one with two lines of text.
/**
 * Join-by-code as a fifth cell rather than a bar of its own.
 *
 * It cannot hold a label, a field and a button side by side at a fifth of the row — so
 * it does not try. It sits idle looking like its neighbours and swaps to the field when
 * pressed, which is also the honest interaction: nobody types a room code by accident.
 */
export const dashJoinTileClass = `${dashActionTileClass} w-full`;

export const dashJoinOpenClass =
  "flex w-full items-center gap-2 rounded-dashMd bg-dashSurface p-3.5 ring-1 ring-pink-600/40 min-[1180px]:p-4";


export const dashJoinSubmitIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-white transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40";

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
  `flex min-w-0 flex-1 items-center ${dashJoinTileControlHeightClass} rounded-[9px] bg-dashSurfaceAlt px-2.5`;

export const dashJoinTileInputClass =
  "w-full text-[12px] tracking-[0.03em] text-dashText tabular-nums placeholder:text-dashTextMute placeholder:tracking-normal";

// Popular Games preview grid on the dashboard home — four across, two on a phone.
export const dashGamesGridClass =
  "grid grid-cols-2 gap-3.5 min-[901px]:grid-cols-4";

// The /games catalogue grid. auto-fit with a capped track centres a single card and
// grids a full catalogue evenly, without having to count items.
export const dashGamesCatalogGridClass =
  "grid justify-start gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(240px,320px))]";

export const dashGameCardClass =
  "group overflow-hidden rounded-dashMd border border-dashBorder bg-dashSurface text-left transition-[opacity,border-color] duration-200 hover:border-white/15 disabled:cursor-not-allowed disabled:opacity-60";

export const dashGameCardCoverClass =
  "relative flex w-full items-center justify-center overflow-hidden bg-dashSurfaceAlt";

// A ratio rather than a fixed height, so covers keep their shape as the grid tracks
// resize. Rows still line up: every track in a row is the same width, so a shared
// ratio makes every cover the same height too.
export const dashGameCardCoverCompactClass = "aspect-[16/10]";

// Taller on the catalogue page, where there is room for it — game art is usually
// square or portrait, and a wide strip crops the middle out of it.
export const dashGameCardCoverDetailedClass = "aspect-[4/3]";

// Scaling on hover is the only motion here, and it is on the image rather than the
// card so a grid of them never shifts its neighbours.
export const dashGameCardCoverImgClass =
  "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]";

export const dashGameCardMetaClass = "px-3 pb-3 pt-2.5";

export const dashGameCardNameClass = "text-[13.5px] font-bold text-dashText";

export const dashGameCardSubClass = "mt-0.5 text-[11.5px] text-dashTextMute";

export const dashGameCardDescClass =
  "mt-2 line-clamp-2 text-[12px] leading-5 text-dashTextMute";

export const dashGameCardBadgeRowClass = "mt-2.5 flex flex-wrap items-center gap-1.5";

export const dashGameCardBadgeClass =
  "inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-dashTextMute";

// Sits over the cover, so it reads against artwork of any brightness.
export const dashGameCardPremiumBadgeClass =
  "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-amber-200 backdrop-blur-sm";

// A span, not a button: the whole card is the button, and nesting one inside another
// is invalid HTML that browsers resolve by dropping the outer click target.
export const dashGameCardCtaClass =
  "mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-[12px] font-bold text-white";

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

// ---------------------------------------------------------------------------
// Profile Settings page (movmash_mockup_local.html #pageProfile) — 2-column
// Profile / Language layout, restyled to the flat dash* system.
// ---------------------------------------------------------------------------

// Opt-in large variant for SidebarAvatarChip — the sidebar's own 34px/26px chips are too
// small for a page-level "Profile picture" row. Sized one notch down from the mockup's
// literal 56px per owner feedback ("bi tık küçült").
export const dashAvatarChipLargeClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-base font-bold text-white";

export const dashSettingsSectionLabelClass =
  "text-[11.5px] font-bold uppercase tracking-[0.05em] text-dashTextMute";

export const dashSettingsFieldLabelClass = "text-[12.5px] font-semibold text-dashTextDim";

// Background lives on this wrapper, not the <input> itself — same reasoning as
// dashJoinTileInputWrapClass/appSyncFieldWrapClass (Input's variant="raw" always adds its
// own bg-transparent, which would fight a bg-* class on the input for the same property).
export const dashSettingsFieldWrapClass =
  "flex h-10 w-full items-center rounded-[9px] bg-dashSurfaceAlt px-3 focus-within:outline focus-within:outline-2 focus-within:outline-pink-600/55";

export const dashSettingsFieldInputClass =
  "w-full min-w-0 bg-transparent text-[13.5px] text-dashText placeholder:text-dashTextMute";

export const dashSettingsFieldStaticClass =
  "flex h-10 w-full items-center rounded-[9px] bg-dashSurfaceAlt px-3 text-[13.5px] text-dashTextMute";

export const dashSettingsSaveButtonClass = dashPrimaryButtonClass;

// Language row reuses the sidebar popover's own row shape for visual consistency; active
// state reuses the same brand-gradient wash as active nav items (dashNavItemActiveClass).
export const dashLanguageRowActiveClass =
  "text-dashText bg-[linear-gradient(100deg,rgba(225,29,72,0.28),rgba(219,39,119,0.24),rgba(192,38,211,0.22))]";

// ---------------------------------------------------------------------------
// YouTube browse page. The card follows YouTube's own arrangement — 16:9 thumbnail,
// duration in the corner, avatar beside a two-line title — because that is the layout
// people read without being taught.
// ---------------------------------------------------------------------------

export const ytPageWrapClass = "flex h-full min-h-0 flex-col";

/**
 * The page ground, as a literal.
 *
 * The dashboard shell has no background token of its own — it sits on the app body — but
 * a sticky toolbar and a ring offset both need an actual colour to sit on, or they show
 * whatever scrolls underneath.
 */
export const ytGroundClass = "bg-[#0b0a0d]";

// Sticky, because the search box and the category you are browsing are the two things
// you reach for *after* scrolling, and a toolbar that scrolls away makes you scroll back.
export const ytToolbarClass =
  "sticky top-0 z-20 -mx-1 flex flex-col gap-3 bg-[rgba(11,10,13,0.94)] px-1 pb-4 pt-1 backdrop-blur-xl";

export const ytSectionHeadClass =
  "mb-4 text-[15px] font-semibold tracking-tight text-white/88";

export const ytSearchWrapClass =
  "flex h-11 w-full max-w-xl items-center gap-2.5 rounded-full bg-white/[0.045] px-4 transition-colors duration-150 focus-within:bg-white/[0.075]";

export const ytSearchInputClass =
  "w-full bg-transparent text-[14px] text-white/88 placeholder:text-white/34 focus:outline-none";

// A single scrolling row, like YouTube's. Wrapping them would push the grid below the
// fold on a laptop the moment a region has twenty categories.
export const ytChipRowClass =
  "flex gap-2 overflow-x-auto pb-1 scrollbar-hide [scrollbar-width:none]";

export const ytChipClass =
  "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150";

export const ytChipActiveClass = "bg-white text-black";

export const ytChipIdleClass = "bg-white/[0.07] text-white/78 hover:bg-white/[0.12]";

export const ytGridClass =
  "grid gap-x-4 gap-y-7 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]";

export const ytCardClass =
  "group relative flex w-full flex-col text-left transition-opacity duration-150";

export const ytCardThumbClass =
  "relative aspect-video w-full overflow-hidden rounded-xl bg-white/[0.05]";

export const ytCardThumbImgClass =
  "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]";

export const ytCardDurationClass =
  "absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11.5px] font-medium tabular-nums text-white";

export const ytCardLiveClass =
  "absolute bottom-1.5 right-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10.5px] font-bold tracking-wide text-white";

export const ytCardAvatarClass = "h-9 w-9 shrink-0 overflow-hidden rounded-full object-cover";

// Two lines, then ellipsis — the same clamp YouTube uses, and the reason a grid of
// cards keeps its rows aligned however long the titles are.
export const ytCardTitleClass =
  "line-clamp-2 text-[14px] font-semibold leading-[1.35] text-white/92";

export const ytCardChannelClass = "mt-1 truncate text-[12.5px] text-white/48";

export const ytCardMetaClass = "text-[12.5px] text-white/48";

export const ytSkeletonThumbClass = "aspect-video w-full rounded-xl bg-white/[0.05]";

export const ytEmptyClass = "py-20 text-center text-[13.5px] text-white/42";

// --- selection ---------------------------------------------------------------

/**
 * A ring around the whole card rather than a tick in a corner. Picking videos is the
 * point of this page, so what is in the queue has to be readable across a grid of
 * twenty-four at a glance, not found by inspecting each one.
 */
export const ytCardSelectedClass = "ring-2 ring-pink-500 ring-offset-[3px] ring-offset-[#0b0a0d]";

/** The queue position, not a tick — order is what a playlist is. */
export const ytCardPositionClass =
  "absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-pink-600 px-2 text-[12.5px] font-bold tabular-nums text-white shadow-lg";

export const ytCardAddClass =
  "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100";

/**
 * The queue bar. Sticky to the foot of the scroll area rather than fixed to the window,
 * so it sits inside the page's own column and never covers the sidebar.
 */
export const ytQueueBarClass =
  "sticky bottom-0 z-30 -mx-1 mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] bg-[rgba(16,14,19,0.96)] px-4 py-3 backdrop-blur-xl";

export const ytQueueStripClass = "flex flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide";

export const ytQueueThumbClass =
  "group/thumb relative h-9 w-16 shrink-0 overflow-hidden rounded-md bg-white/[0.06]";

export const ytQueueThumbRemoveClass =
  "absolute inset-0 flex items-center justify-center bg-black/65 text-white opacity-0 transition-opacity duration-150 group-hover/thumb:opacity-100";

export const ytQueueCountClass = "shrink-0 text-[13px] font-medium text-white/70 tabular-nums";

export const ytQueueClearClass =
  "shrink-0 rounded-full px-3 py-2 text-[13px] font-medium text-white/55 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white/85";
