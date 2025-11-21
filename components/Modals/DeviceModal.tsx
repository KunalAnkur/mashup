import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { FileSelection } from "../Onboard";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { DeviceModalProps } from "@/types/deviceModalTypes";
import { FaUpload, FaCloud } from "react-icons/fa";

const DeviceModal: React.FC<DeviceModalProps> = ({
  open,
  onClose,
  onFileSelect,
  fileInputRef,
}) => {
  const step = useSelector((state: RootState) => state.onboard.step);
  if (!open) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePlatformClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden">
        {/* Header - Improved */}
        <div className="w-full flex items-center justify-between px-6 md:px-10 py-5 md:py-6 shrink-0 border-b border-white/5">
          <div className="w-10" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
                <FaCloud className="text-white text-lg" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-parkinsans">
                Choose Your Source
              </h2>
            </div>
            <p className="text-gray-400 text-xs md:text-sm">
              Upload from device or select a streaming platform
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

        {/* Content */}
        <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 md:py-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full  max-w-5xl lg:max-w-6xl 3xl:max-w-7xl mx-auto px-6 md:px-10  ">
            {/* Left Side - Upload from Device */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1 h-6 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></span>
                <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
                  Choose from your files
                </h3>
              </div>

              <input
                ref={fileInputRef}
                onChange={onFileSelect}
                type="file"
                accept="video/*,audio/*,.mp4,.mp3,.mkv,.webm,.3gp,.avi,.mpeg,.mpg,.ogg,.wmv,.wav,.mov"
                multiple
                className="hidden"
              />

              <div className="flex flex-1 flex-col gap-4">
                {/* Upload Area */}
                <button
                  onClick={handleUploadClick}
                  className=" flex flex-col items-center justify-center bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 border border-white/10 hover:border-pink-500/50 rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl flex-1"
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

                {/* Info Text */}
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                  <p className="text-gray-400 text-xs text-center leading-relaxed">
                    <span className="text-gray-300 font-medium">
                      Supported formats:
                    </span>
                    <br />
                    MP4, MP3, MKV, WebM, AVI, and more
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent self-stretch my-8"></div>

            {/* Right Side - Choose Platform or FileSelection */}
            <div className="w-full lg:w-2/3 flex flex-col">
              {step === OnboardStep.FILE_SELECTION ? (
                <FileSelection />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-purple-500 rounded-full"></span>
                    <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
                      Choose a platform to screenshare
                    </h3>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 content-start">
                      {STREAMING_PLATFORMS.map((platform, index) => (
                        <button
                          key={index}
                          onClick={() => handlePlatformClick(platform.url)}
                          style={platform.bgStyle}
                          className="aspect-square flex flex-col items-center justify-center hover:scale-105 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg p-6 md:p-7 group min-h-[140px] md:min-h-[160px]"
                        >
                          <div className="text-white group-hover:scale-110 transition-transform duration-300 text-4xl md:text-5xl">
                            {platform.logo}
                          </div>
                          <span className="text-sm md:text-base font-bold text-white mt-3 text-center">
                            {platform.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;
