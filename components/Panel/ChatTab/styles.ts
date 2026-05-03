// Shared CSS class strings for chat components
export const chatMessageReactionGroupsClass =
  "inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full bg-zinc-950/85 px-1.5 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md";

export const chatMessageActionsBubbleClass =
  "pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-950/88 p-1 shadow-lg backdrop-blur-xl transition-opacity duration-150 opacity-100 md:opacity-0 md:group-hover/message:opacity-100 md:group-focus-within/message:opacity-100";

export const chatStatusBannerBaseClass =
  "relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl rounded-lg md:rounded-xl overflow-hidden";

export const chatStatusBannerRowClass = "relative flex items-center gap-1.5 md:gap-2";

export const chatComposerIconButtonClass =
  "relative p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 group";

export const chatComposerAccentOverlayClass =
  "absolute inset-0 rounded-lg md:rounded-xl transition-opacity duration-200";

export const chatMessageAvatarBaseClass =
  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-xl border-2 border-white/20";

export const chatMessageAvatarImageClass =
  "relative w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-xl border-2 border-white/20 ring-2 ring-white/5";

export const chatMessageUserNameClass =
  "font-semibold text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-r tracking-tight truncate max-w-[120px] md:max-w-[180px]";

export const chatMessageBubbleBaseClass =
  "relative px-2.5 md:px-3 py-2 md:py-2.5 transition-all duration-200 backdrop-blur-xl";

export const chatMessageTextClass =
  "text-white/95 text-xs md:text-sm leading-relaxed break-words whitespace-pre-wrap font-medium";

export const chatMessageTimestampClass =
  "w-full text-right text-white/50 text-[9px] md:text-[10px] font-medium opacity-60 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none";

export const chatSystemMessageTimestampClass =
  "absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-gray-500/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100";

export const chatInputFieldBaseClass =
  "flex-1 bg-transparent outline-none text-white/95 text-base placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium";

// Made with Bob
