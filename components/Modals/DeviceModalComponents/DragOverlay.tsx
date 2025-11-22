import React from "react";
import { FaUpload } from "react-icons/fa";

interface DragOverlayProps {
  isVisible: boolean;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-rose-600/30 via-pink-600/30 to-fuchsia-600/30 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="bg-white/10 border-4 border-dashed border-pink-500 rounded-3xl p-12 flex flex-col items-center gap-4">
        <FaUpload className="w-20 h-20 text-white animate-bounce" />
        <p className="text-white text-2xl md:text-3xl font-bold font-parkinsans">
          Drop your files here
        </p>
        <p className="text-gray-200 text-sm md:text-base">Release to upload</p>
      </div>
    </div>
  );
};

