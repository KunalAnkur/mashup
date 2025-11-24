import React from "react";
import { Button } from "../../UI";

interface UrlInputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
  isAddDisabled: boolean;
  tooltipMessage: string;
}

export const UrlInputField: React.FC<UrlInputFieldProps> = ({
  value,
  onChange,
  onKeyDown,
  onAddClick,
  isAddDisabled,
  tooltipMessage,
}) => (
  <div className="flex gap-3">
    <input
      type="text"
      placeholder="Paste your video URL here"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="flex-1 min-w-0 rounded-xl bg-white/5 text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500"
    />
    <div className="relative group shrink-0">
      <Button
        onClick={onAddClick}
        className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none"
        name="Add"
        disabled={isAddDisabled}
      />
      {isAddDisabled && tooltipMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2a2a2e] text-gray-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-xl">
          {tooltipMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2a2a2e]" />
        </div>
      )}
    </div>
  </div>
);

