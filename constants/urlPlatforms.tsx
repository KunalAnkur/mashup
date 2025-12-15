import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import {
  FaYoutube,
  FaVimeo,
  FaTwitch,
  FaLink,
  FaVideo,
} from "react-icons/fa";
import { MdOndemandVideo } from "react-icons/md";
export const platforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: <FaYoutube className="text-3xl sm:text-4xl" />,
    smallIcon: <FaYoutube className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
    },
    iconBg: "bg-red-600",
    urlPatterns: [/youtube\.com/, /youtu\.be/],
  },
  {
    id: "vimeo",
    name: "Vimeo",
    icon: <FaVimeo className="text-3xl sm:text-4xl" />,
    smallIcon: <FaVimeo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #1AB7EA 0%, #0D95BF 100%)",
    },
    iconBg: "bg-blue-500",
    urlPatterns: [/vimeo\.com/],
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: <FaTwitch className="text-3xl sm:text-4xl" />,
    smallIcon: <FaTwitch className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #9146FF 0%, #6441A5 100%)",
    },
    iconBg: "bg-purple-600",
    urlPatterns: [/twitch\.tv/],
  },
  
  {
    id: "wistia",
    name: "Wistia",
    icon: <FaVideo className="text-3xl sm:text-4xl" />,
    smallIcon: <FaVideo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",
    },
    iconBg: "bg-indigo-500",
    urlPatterns: [/wistia\.com/, /fast\.wistia\.net/],
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    icon: <FaVideo className="text-3xl sm:text-4xl" />,
    smallIcon: <FaVideo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #3B82F6 0%, #1F2937 100%)",
    },
    iconBg: "bg-blue-600",
    urlPatterns: [/dailymotion\.com/, /dai\.ly/],
  },
  {
    id: "custom",
    name: "Random URL",
    icon: <FaLink className="text-3xl sm:text-4xl" />,
    smallIcon: <FaVideo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
    },
    iconBg: "bg-pink-500",
    urlPatterns: [],
  },
];
