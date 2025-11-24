import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { FileSelection } from "../Onboard";
import { DeviceModalProps } from "@/types/ModalTypes/deviceModalTypes";
import {
  DragOverlay,
  ModalHeader,
  UploadSection,
  PlatformGrid,
  ContentDivider,
  useDragAndDrop,
} from "./DeviceModalComponents";

const DeviceModal: React.FC<DeviceModalProps> = ({
  open,
  onClose,
  onFileSelect,
  fileInputRef,
}) => {
  const step = useSelector((state: RootState) => state.onboard.step);
  const { isDragging, dragHandlers } = useDragAndDrop(
    fileInputRef,
    onFileSelect
  );

  // Event Handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      onFileSelect(e);
      fileInputRef.current.value = "";
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePlatformClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Early return if modal is closed
  if (!open) return null;

  const showFileSelection = step === OnboardStep.FILE_SELECTION;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden"
        {...dragHandlers}
      >
        <DragOverlay isVisible={isDragging} />
        <ModalHeader onClose={onClose} />

        {/* Content */}
        <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 md:py-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-5xl lg:max-w-6xl 3xl:max-w-7xl mx-auto px-6 md:px-10">
            {/* Left Side - Upload Section */}
            <UploadSection
              fileInputRef={fileInputRef}
              onUploadClick={handleUploadClick}
              onFileChange={handleFileInputChange}
            />

            <ContentDivider />

            {/* Right Side - Platform Grid or File Selection */}
            <div className="w-full lg:w-2/3 flex flex-col">
              {showFileSelection ? (
                <FileSelection />
              ) : (
                <PlatformGrid onPlatformClick={handlePlatformClick} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;
