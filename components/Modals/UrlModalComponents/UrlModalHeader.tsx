import React from "react";
import { FaLink } from "react-icons/fa";

interface UrlModalHeaderProps {
  onClose: () => void;
}

export const UrlModalHeader: React.FC<UrlModalHeaderProps> = ({ onClose }) => (
  <div className="w-full flex items-center justify-between px-6 md:px-10 py-5 md:py-6 shrink-0 border-b border-white/5">
    <div className="w-10" />
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
          <FaLink className="text-white text-lg" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white font-parkinsans">
          Add Video Source
        </h2>
      </div>
      <p className="text-gray-400 text-xs md:text-sm">
        Import videos from YouTube, Twitch, Vimeo, and more
      </p>
    </div>
    <button
      onClick={onClose}
      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
      aria-label="Close"
    >
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
);

