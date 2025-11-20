import { Platform } from "@/types/urlPlatformTypes";
import {
  FaYoutube,
  FaVimeo,
  FaTwitch,
  FaFileVideo,
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
    id: "hls",
    name: "HLS",
    icon: <MdOndemandVideo className="text-3xl sm:text-4xl" />,
    smallIcon: <MdOndemandVideo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)",
    },
    iconBg: "bg-green-500",
    urlPatterns: [/\.m3u8/],
  },
  {
    id: "flv",
    name: "FLV",
    icon: <FaFileVideo className="text-3xl sm:text-4xl" />,
    smallIcon: <FaFileVideo className="text-lg text-white" />,
    bgStyle: {
      background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
    },
    iconBg: "bg-blue-500",
    urlPatterns: [/\.flv/],
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
