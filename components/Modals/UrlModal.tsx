import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { OnboardStep } from "@/types/storeTypes";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { UrlModalProps } from "@/types/ModalTypes/urlModalProps";
import {
  UrlModalHeader,
  SupportedPlatformsGrid,
  UrlInputSection,
  useUrlManagement,
  getPlatformById,
  getUrlDisplayName,
} from "./UrlModalComponents";

const UrlModal: React.FC<UrlModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  const {
    sourceUrlInput,
    setSourceUrlInput,
    addedUrls,
    isAddDisabled,
    tooltipMessage,
    loadingMetadata,
    handleAddUrl,
    handleRemoveUrl,
  } = useUrlManagement();

  // Event Handlers
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddDisabled) {
      handleAddUrl();
    }
  };

  const handleOnEnterRoom = async () => {
    if (addedUrls.length === 0) return;
    dispatch(
      setRefers({
        refer: true,
        sourceType: "url",
        urls: addedUrls.map((item) => item.url),
      })
    );
    onClose();
    if (!authState.isAuthenticated) dispatch(changeStep(OnboardStep.AUTH_STEP));
  };

  // Early return if modal is closed
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden">
        <UrlModalHeader onClose={onClose} />

        {/* Content */}
        <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-6 md:py-10">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-7xl mx-auto px-6 md:px-10">
            {/* Left Side - Supported Platforms */}
            <SupportedPlatformsGrid />

            {/* Right Side - URL Input */}
            <UrlInputSection
              sourceUrlInput={sourceUrlInput}
              onSourceUrlChange={handleOnSourceUrlChange}
              onKeyDown={handleKeyDown}
              onAddUrl={handleAddUrl}
              isAddDisabled={isAddDisabled}
              tooltipMessage={tooltipMessage}
              addedUrls={addedUrls}
              loadingMetadata={loadingMetadata}
              onRemoveUrl={handleRemoveUrl}
              onCancel={onClose}
              onEnterRoom={handleOnEnterRoom}
              getPlatformById={getPlatformById}
              getUrlDisplayName={getUrlDisplayName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlModal;
