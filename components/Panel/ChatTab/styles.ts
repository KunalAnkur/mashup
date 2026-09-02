// Shared CSS class strings for chat components.
// Minimal language: flat translucent surfaces, hairline borders, no gradient washes,
// no heavy drop shadows or glow layers — depth comes from surface contrast + spacing.
export const chatMessageReactionGroupsClass =
  "inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full border border-white/[0.06] bg-zinc-900/90 px-1.5 py-1 backdrop-blur-md";

// Visual only. Visibility (hover on desktop, tap-to-reveal on mobile) is composed in
// MessageBubbleActions so the bar isn't pinned on every message on touch devices.
export const chatMessageActionsBubbleClass =
  "flex items-center gap-1 rounded-full border border-white/[0.06] bg-zinc-900/90 p-1 backdrop-blur-md transition-opacity duration-150";

export const chatStatusBannerBaseClass =
  "relative px-3 md:px-4 py-2 md:py-2.5 bg-white/[0.04] rounded-lg md:rounded-xl overflow-hidden";

export const chatStatusBannerRowClass = "relative flex items-center gap-1.5 md:gap-2";

export const chatComposerIconButtonClass =
  "relative flex items-center justify-center p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors duration-200";

export const chatMessageAvatarBaseClass =
  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold border border-white/10";

export const chatMessageAvatarImageClass =
  "relative w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white/10";

export const chatMessageUserNameClass =
  "font-semibold text-xs md:text-sm tracking-tight truncate max-w-[120px] md:max-w-[180px]";

export const chatMessageBubbleBaseClass =
  "relative px-2.5 md:px-3 py-2 md:py-2.5 transition-colors duration-200";

export const chatMessageTextClass =
  "text-white/90 text-xs md:text-sm leading-normal break-words whitespace-pre-wrap";

// Faint timestamp sitting beside the username in a message header row.
export const chatMessageHeaderTimestampClass =
  "shrink-0 text-[10px] leading-none text-white/25 tabular-nums";

// Hover-only timestamp parked in the avatar gutter for grouped (headerless) messages.
export const chatMessageGutterTimestampClass =
  "pointer-events-none absolute right-1 top-2 text-[9px] leading-none text-white/30 tabular-nums whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100";

export const chatSystemMessageTimestampClass =
  "absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100";

export const chatInputFieldBaseClass =
  "flex-1 bg-transparent outline-none text-white/90 text-base placeholder:text-white/35 disabled:opacity-50 disabled:cursor-not-allowed";
