// Chat message constraints
export const PIN_MESSAGE_CHAR_LIMIT = 180;
export const MAX_TEXTAREA_LINES = 10;
export const AUTO_SCROLL_THRESHOLD = 24;

// Message overlay dimensions and spacing
export const MESSAGE_REACTION_PICKER_APPROX_HEIGHT = 52;
export const MESSAGE_REACTION_DETAILS_APPROX_WIDTH = 208;
export const MESSAGE_REACTION_PICKER_VERTICAL_OFFSET = 8;
export const MESSAGE_ACTIONS_MIN_SIDE_SPACE = 72;
export const MESSAGE_ACTIONS_WIDE_BUBBLE_RATIO = 0.72;
export const MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING = 12;

// Default reactions
export const DEFAULT_REACTIONS = ["😍", "😡", "😭", "😂", "🤯", "🔥"] as const;

// User color palette
export const USER_COLOR_PALETTE = [
  {
    gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
    bg: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
  {
    gradient: "from-blue-400 via-cyan-400 to-teal-400",
    bg: "from-blue-500 via-cyan-500 to-teal-500",
  },
  {
    gradient: "from-purple-400 via-indigo-400 to-blue-400",
    bg: "from-purple-500 via-indigo-500 to-blue-500",
  },
  {
    gradient: "from-emerald-400 via-green-400 to-teal-400",
    bg: "from-emerald-500 via-green-500 to-teal-500",
  },
  {
    gradient: "from-orange-400 via-amber-400 to-yellow-400",
    bg: "from-orange-500 via-amber-500 to-yellow-500",
  },
  {
    gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
    bg: "from-violet-500 via-purple-500 to-fuchsia-500",
  },
  {
    gradient: "from-cyan-400 via-blue-400 to-indigo-400",
    bg: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  {
    gradient: "from-pink-400 via-rose-400 to-red-400",
    bg: "from-pink-500 via-rose-500 to-red-500",
  },
  {
    gradient: "from-lime-400 via-green-400 to-emerald-400",
    bg: "from-lime-500 via-green-500 to-emerald-500",
  },
  {
    gradient: "from-amber-400 via-orange-400 to-red-400",
    bg: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    gradient: "from-indigo-400 via-purple-400 to-pink-400",
    bg: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    gradient: "from-teal-400 via-cyan-400 to-blue-400",
    bg: "from-teal-500 via-cyan-500 to-blue-500",
  },
  {
    gradient: "from-yellow-400 via-amber-400 to-orange-400",
    bg: "from-yellow-500 via-amber-500 to-orange-500",
  },
  {
    gradient: "from-red-400 via-pink-400 to-rose-400",
    bg: "from-red-500 via-pink-500 to-rose-500",
  },
  {
    gradient: "from-green-400 via-emerald-400 to-teal-400",
    bg: "from-green-500 via-emerald-500 to-teal-500",
  },
] as const;

// Made with Bob
