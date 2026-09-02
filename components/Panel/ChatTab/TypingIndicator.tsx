interface TypingIndicatorProps {
  typingDisplayNames: string[];
  t: (key: string) => string;
}

export const TypingIndicator = ({ typingDisplayNames, t }: TypingIndicatorProps) => {
  if (typingDisplayNames.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 md:px-3 py-1.5">
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
      </div>
      <span className="text-white/50 text-[10px] md:text-xs">
        <span className="font-medium text-white/65">{typingDisplayNames.join(", ")}</span>
        <span className="ml-1">
          {typingDisplayNames.length === 1 ? t("isTyping") : t("areTyping")}
        </span>
      </span>
    </div>
  );
};
