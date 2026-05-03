interface TypingIndicatorProps {
  typingDisplayNames: string[];
  t: (key: string) => string;
}

export const TypingIndicator = ({ typingDisplayNames, t }: TypingIndicatorProps) => {
  if (typingDisplayNames.length === 0) return null;

  return (
    <div className="flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2">
      <div className="relative flex items-center gap-0.5 md:gap-1">
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
      </div>
      <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-cyan-500/20 rounded-lg">
        <span className="text-cyan-300 text-[10px] md:text-xs font-medium">
          <span className="font-semibold">
            {typingDisplayNames.join(", ")}
          </span>
          <span className="text-cyan-400/70 ml-1 md:ml-1.5">
            {typingDisplayNames.length === 1 ? t("isTyping") : t("areTyping")}
          </span>
        </span>
      </div>
    </div>
  );
};

// Made with Bob
