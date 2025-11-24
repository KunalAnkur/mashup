import React from "react";
import { FaUpload } from "react-icons/fa";
import { SectionTitle } from "./SectionTitle";
import { ACCEPTED_FILE_TYPES } from "../../../types/ModalTypes/acceptedFileTypes";

interface UploadButtonProps {
  onClick: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 hover:border-pink-500/50 rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl flex-1"
  >
    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-4">
      <FaUpload className="w-10 h-10 text-gray-400 group-hover:text-white transition-all duration-300" />
    </div>
    <span className="text-lg md:text-xl font-semibold text-gray-300 group-hover:text-white transition-all duration-300">
      Click to Upload
    </span>
    <span className="text-sm text-gray-500 group-hover:text-gray-200 transition-all duration-300 mt-2">
      or drag and drop
    </span>
  </button>
);

const SupportedFormatsInfo: React.FC = () => (
  <div className="p-4 bg-white/[0.03] rounded-xl">
    <p className="text-gray-400 text-xs text-center leading-relaxed">
      <span className="text-gray-300 font-medium">Supported formats:</span>
      <br />
      MP4, MP3, MKV, WebM, AVI, and more
    </p>
  </div>
);

interface UploadSectionProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  fileInputRef,
  onUploadClick,
  onFileChange,
}) => (
  <div className="w-full lg:w-1/3 flex flex-col">
    <SectionTitle
      gradientFrom="from-rose-500"
      gradientTo="to-pink-500"
      title="Choose from your files"
    />

    <input
      ref={fileInputRef}
      onChange={onFileChange}
      type="file"
      accept={ACCEPTED_FILE_TYPES}
      multiple
      className="hidden"
    />

    <div className="flex flex-1 flex-col gap-4">
      <UploadButton onClick={onUploadClick} />
      <SupportedFormatsInfo />
    </div>
  </div>
);
