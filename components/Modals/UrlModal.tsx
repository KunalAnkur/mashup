import React from "react";
import { useDispatch } from "react-redux";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { UrlModalProps } from "@/types/ModalTypes/urlModalProps";
import { useRouter } from "next/navigation";
import {
  UrlModalHeader,
  SupportedPlatformsGrid,
  UrlInputSection,
  useUrlManagement,
  getPlatformById,
  getUrlDisplayName,
} from "./UrlModalComponents";
import { Modal } from "@/components/UI";

const UrlModal: React.FC<UrlModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const router = useRouter();

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
      })
    );
    onClose();
    router.push("/sync");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="z-50 p-0"
      panelClassName="h-full max-w-none"
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
    </Modal>
  );
};

export default UrlModal;
