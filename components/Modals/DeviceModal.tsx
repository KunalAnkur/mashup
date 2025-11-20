import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { FileSelection } from "../Onboard";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { DeviceModalProps } from "@/types/deviceModalTypes";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-center py-6">
          <h2 className="w-[95%] text-xl text-center sm:text-2xl font-bold text-gray-100 font-parkinsans">
            Choose Your Source
          </h2>
          <div className="flex flex-1 items-end">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-[#27272a] transition-all duration-200"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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
        </div>

        <div className="flex flex-1 justify-center items-center w-full px-8">
          {/* Content */}
          <div
            className={`flex gap-12 w-full max-w-7xl ${
              step === OnboardStep.FILE_SELECTION ? "justify-center" : ""
            } `}
          >
            {/* Left Side - Upload from Device */}
            <div className="w-1/4 min-w-[250px] flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-4 sm:mb-6 font-parkinsans text-center">
                Choose from your files
              </h3>

              <input
                ref={fileInputRef}
                onChange={onFileSelect}
                type="file"
                accept="video/*,audio/*,.mp4,.mp3,.mkv,.webm,.3gp,.avi,.mpeg,.mpg,.ogg,.wmv,.wav,.mov"
                multiple
                className="hidden"
              />

              <div className="flex flex-1 flex-col justify-center">
                {/* Upload Area */}
                <button
                  onClick={handleUploadClick}
                  className="aspect-square flex flex-col items-center justify-center bg-[#27272a] hover:bg-gradient-to-r hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl"
                >
                  <div className="flex items-center justify-center p-6 rounded-full bg-[#18181b] group-hover:bg-transparent transition-all duration-300 mb-2 sm:mb-4">
                    <svg
                      className="w-10 h-10 md:w-12 md:h-12 text-gray-400 group-hover:text-gray-100 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <span className="text-md md:text-xl font-semibold text-gray-400 group-hover:text-gray-100 transition-all duration-300">
                    Click to Upload
                  </span>
                  <span className="text-sm text-gray-500 group-hover:text-gray-200 transition-all duration-300 mt-1">
                    or drag and drop
                  </span>
                </button>

                {/* Info Text */}
                <p className="text-gray-400 text-xs sm:text-sm font-medium mt-2 text-center">
                  Supported formats: MP4, MP3, MKV, WebM, AVI, and more
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-r border-white/50 h-[300px] self-center"></div>

            {/* Right Side - Choose Platform or FileSelection */}
            <div
              className={`${
                step === OnboardStep.FILE_SELECTION ? "w-2/4" : "w-3/4"
              } flex flex-col `}
            >
              {step === OnboardStep.FILE_SELECTION ? (
                <FileSelection />
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-4 sm:mb-6 font-parkinsans text-center">
                    Choose a platform to screenshare
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                    {STREAMING_PLATFORMS.map((platform, index) => (
                      <button
                        key={index}
                        onClick={() => handlePlatformClick(platform.url)}
                        style={platform.bgStyle}
                        className={`aspect-square flex flex-col items-center justify-center hover:scale-105 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer shadow-lg p-4 sm:p-6 group`}
                      >
                        <div className="text-white group-hover:scale-110 transition-transform duration-300">
                          {platform.logo}
                        </div>
                        <span className="text-xs sm:text-sm md:text-base font-bold text-white mt-2 sm:mt-3 text-center">
                          {platform.name}
                        </span>
                      </button>
                    ))}
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
