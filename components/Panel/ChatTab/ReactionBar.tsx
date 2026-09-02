import { ReactionType } from "@/types/chatTypes";
import AnimatedReaction from "../AnimatedReaction";
import ReactionPicker from "../ReactionPicker";

interface ReactionBarProps {
  showReactions: boolean;
  pinnedReactions: ReactionType[];
  animatingReaction: ReactionType | null;
  isJoined: boolean;
  onReactionClick: (emoji: ReactionType) => void;
  onReactionsChange: (newReactions: ReactionType[]) => void;
}

export const ReactionBar = ({
  showReactions,
  pinnedReactions,
  animatingReaction,
  isJoined,
  onReactionClick,
  onReactionsChange,
}: ReactionBarProps) => {
  return (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showReactions ? 'max-h-16 opacity-100 mb-0 md:mb-1' : 'max-h-0 opacity-0 mb-0'}`}>
      <div className="relative flex items-center justify-center gap-2 md:gap-3 pb-1 md:pb-2">
        {pinnedReactions.map((emoji) => (
          <AnimatedReaction
            key={emoji}
            emoji={emoji}
            isAnimating={animatingReaction === emoji}
            disabled={!isJoined}
            onClick={() => onReactionClick(emoji)}
          />
        ))}

        <div className="w-px h-5 md:h-6 bg-white/10" />

        <div className="relative">
          <ReactionPicker
            pinnedReactions={pinnedReactions}
            onReactionsChange={onReactionsChange}
          />
        </div>
      </div>
    </div>
  );
};

// Made with Bob
