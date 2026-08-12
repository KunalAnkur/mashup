"use client";
import { useDispatch, useSelector } from "react-redux";
import {
  FaFileAlt,
  FaFileVideo,
  FaFileAudio,
  FaFileImage,
  FaTrash,
  FaCheck,
  FaPlus,
  FaUpload,
} from "react-icons/fa";
import { Button, Input } from "../UI";
import { useEffect, useState, useRef } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useFileContext } from "@/context/FileContext";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ACCEPTED_FILE_TYPES } from "@/types/ModalTypes/acceptedFileTypes";
import { showError } from "@/utils/toast";
import { ExtendedFile } from "@/utils/filePersistence";
import { Playlist } from "@/types/storeTypes";
import { isMobile } from "react-device-detect";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSectionTitleTextClass,
  appStreamActionButtonClass,
  appStreamBottomActionRowClass,
  appStreamFileCardClass,
  appStreamFileCardIdleClass,
  appStreamFileCardSelectedClass,
  appStreamFileThumbnailClass,
  appStreamInlineAdderClass,
  appStreamListClass,
  appStreamListViewportClass,
  appStreamPanelClass,
  appStreamPrimaryButtonClass,
  appStreamTopBarClass,
  appStreamUploadDropzoneClass,
  appStreamScreenHeroSurfaceClass,
} from "@/components/UI/classTokens";

const FileSelection = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);

  const {
    files,
    removeFile,
    getThumbnail,
    thumbnails,
    setFiles,
    isPersistenceSupported,
    requestFilePicker,
    showPermissionPrompt,
  } = useFileContext();

  const selectedFile = files.find((f) => f.selected) ?? null;
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tToast = useTranslations("toast");
  const tStream = useTranslations("stream");
  const tCommon = useTranslations("common");

  // Ensure one file is selected by default when files are loaded
  useEffect(() => {
    if (files.length === 0) return;
    if (files.some((f) => f.selected)) return;

    const next = files.map((f, idx) => ({ ...f, selected: idx === 0 }));
    // We don't need to await here; best-effort update
    setFiles(next).catch((err) => {
      console.error("FileSelection: failed to set default selected file", err);
    });
  }, [files, setFiles]);

  // Debug: Log when thumbnails change
  useEffect(() => {
    if (Object.keys(thumbnails).length > 0) {
      console.log("FileSelection: Thumbnails updated", Object.keys(thumbnails));
    }
  }, [thumbnails]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/"))
      return <FaFileVideo className="text-pink-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("audio/"))
      return <FaFileAudio className="text-fuchsia-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("image/"))
      return <FaFileImage className="text-green-500 text-lg sm:text-xl" />;
    return <FaFileAlt className="text-dashTextMute text-lg sm:text-xl" />;
  };

  // Helper to check if a file is a video (by MIME type or extension)
  const isVideoFile = (file: File): boolean => {
    if (file.type.startsWith("video/")) {
      return true;
    }
    const videoExtensions = /\.(mp4|mkv|webm|avi|mov|mpeg|mpg|3gp|wmv|flv|m3u8|ogv|m4v)$/i;
    return videoExtensions.test(file.name);
  };

  const handleFileSelect = (id: string) => {
    const next = files.map((f) => ({ ...f, selected: f.id === id }));
    setFiles(next).catch((err) => {
      console.error("FileSelection: failed to update selected file", err);
    });
  };

  const handleFileRemove = (id: string) => {
    removeFile(id);
  };

  const handleOnStartWatching = async () => {
    if (isStarting) return;
    if (!selectedFile) return;

    setIsStarting(true);
    try {
      // Mark that user is coming from stream files flow
      dispatch(
        setRefers({
          refer: true,
        })
      ); 
      
      const playlist = [...files.map(file => ({
        id: file.id,
        type: "stream",
        source: "file",
        link: file.file.name,
        selected: file.selected,
        onlyAudio: file.onlyAudio,
        metadata: {
          title: file.file.name,
          description: file.file.name,
          thumbnail: getThumbnail(file.file) ?? null,
          author: file.file.name,
        },
      }  as Playlist))];
      playlist[0].selected = true;
      dispatch(setPlaylist(playlist));
      console.log("flow test - handleOnStartWatching called", { playlist });
      if (!authState.isAuthenticated) {
        router.push("/login");
      }
      // If authenticated, AuthGuard will handle room creation and navigation
    } finally {
      // Keep loading state for a bit to show feedback, then reset if navigation doesn't happen
      setTimeout(() => setIsStarting(false), 1000);
    }
  };

  const handleAddFileClick = async () => {
    console.log("flow test - handleAddFileClick called", { isPersistenceSupported });
    if (isPersistenceSupported) {
      try {
        setIsLoading(true);
        const selectedFiles = await requestFilePicker(true); // Append mode

        if (selectedFiles.length > 0) {
          // Append new files to existing files
          const next = [...files, ...selectedFiles];
          // Ensure only one is selected (keep previous selection if exists)
          if (!next.some((f) => f.selected)) {
            next[0].selected = true;
          }
          await setFiles(next);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error selecting files:", error);
        showError(
          tToast("failedToSelectFiles"),
          tToast("checkPermissions")
        );
        showPermissionPrompt();
        fileInputRef.current?.click();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback to traditional file input
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      const filesArray = Array.from(newFiles).map((f) => ({
        id: crypto.randomUUID(),
        selected: false,
        onlyAudio: f.type.startsWith('audio/'),
        file: f as File,
      } as ExtendedFile));

      const next = [...files, ...filesArray];
      if (!next.some((f) => f.selected)) {
        next[0].selected = true;
      }
      setFiles(next).catch((err) => {
        console.error("FileSelection: failed to set files from input", err);
      });
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5 md:gap-6">
    <div className={`w-full p-4 text-left sm:p-5 md:p-6 ${appStreamScreenHeroSurfaceClass}`}>
    <div className="flex h-full flex-col bg-transparent w-full max-w-full overflow-hidden">
      <div className={appStreamTopBarClass}>
        <h3 className={appSectionTitleTextClass}>{tStream("chooseFiles")}</h3>
        <button
          type="button"
          onClick={handleAddFileClick}
          disabled={isLoading}
          className={appStreamActionButtonClass}
          title={tStream("addFiles")}
        >
          {isLoading ? (
            <ImSpinner2 className="animate-spin text-xs sm:text-sm" />
          ) : (
            <FaUpload className="text-xs sm:text-sm" />
          )}
          <span className="text-xs sm:text-sm">
            {isLoading ? tCommon("loading") : tStream("addFiles")}
          </span>
        </button>
      </div>

      {/* Hidden file input */}
      <Input
        variant="raw"
        ref={fileInputRef}
        onChange={handleFileChange}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
      />

      <div className={appStreamPanelClass}>
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
          {/* Files List with Preview Placeholders */}
          <div 
            className={`${appStreamListClass} ${appStreamListViewportClass}`}
            style={isMobile ? {
              maxHeight: files.length === 0 ? '220px' : 
                         files.length <= 1 ? '140px' :  // Shows 1 file + add more placeholder
                         files.length <= 2 ? '150px' : 
                         files.length <= 3 ? '220px' : 
                         files.length <= 4 ? '290px' : '360px'
            } : undefined}
          >
            {/* Show actual files */}
            {files.map((extFile) => {
              const file = extFile.file;
              const isSelected = extFile.selected;

              return (
                <div
                  key={extFile.id}
                  onClick={() => handleFileSelect(extFile.id)}
                  className={`${appStreamFileCardClass} cursor-pointer ${
                    isSelected
                      ? appStreamFileCardSelectedClass
                      : appStreamFileCardIdleClass
                  }`}
                >
                  <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 sm:gap-2.5">
                    {(() => {
                      const thumbnail = getThumbnail(file);
                      const isVideo = isVideoFile(file);

                      return (
                        <div
                          className={`
                            ${appStreamFileThumbnailClass}
                            ${isVideo ? "relative h-8 w-12 sm:h-[34px] sm:w-[60px] md:h-9 md:w-16" : "p-2 sm:p-2.5"}
                          `}
                        >
                          {isVideo ? (
                            thumbnail ? (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center bg-dashSurfaceAlt">
                                  <FaFileVideo className="text-dashTextDim text-xs sm:text-sm" />
                                </div>
                                <img
                                  src={thumbnail}
                                  alt={file.name}
                                  className="relative z-10 h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-dashSurfaceAlt">
                                <FaFileVideo className="text-dashTextDim text-xs sm:text-sm" />
                              </div>
                            )
                          ) : (
                            getFileIcon(file.type)
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-xs font-semibold tracking-tight text-dashText sm:text-[13px]">
                        {file.name}
                      </h4>
                      <p className="mt-0.5 truncate text-[10px] text-dashTextMute sm:text-[11px]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 sm:h-[18px] sm:w-[18px] ${
                        isSelected ? "bg-white/[0.12] opacity-100" : "opacity-0"
                      }`}
                    >
                      <FaCheck className="text-[9px] text-white sm:text-[10px]" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileRemove(extFile.id);
                      }}
                      className="p-1.5 text-dashTextMute transition-colors duration-200 hover:text-rose-400"
                    >
                      <FaTrash className="text-[11px] sm:text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Show preview placeholders or upload area */}
            {files.length === 0 ? (
              <button
                type="button"
                onClick={handleAddFileClick}
                disabled={isLoading}
                className={`${appStreamUploadDropzoneClass} h-full w-full p-3 sm:p-6`}
              >
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-dashSurfaceAlt p-3 text-dashTextDim sm:mb-3 sm:h-14 sm:w-14 sm:p-4 md:h-16 md:w-16">
                    {isLoading ? (
                      <ImSpinner2 className="animate-spin text-lg sm:text-xl md:text-2xl" />
                    ) : (
                      <FaUpload className="text-lg sm:text-xl md:text-2xl" />
                    )}
                  </div>
                  <span className="mb-0.5 text-sm font-semibold text-dashText sm:mb-1 sm:text-base">
                    {isLoading ? tCommon("loading") : tStream("clickToUploadFiles")}
                  </span>
                  <span className="text-[10px] text-dashTextMute sm:text-xs">
                    {isLoading ? tStream("pleaseWait") : tStream("dragAndDropFiles")}
                  </span>
                </div>
              </button>
            ) : files.length < 2 ? (
              <button
                type="button"
                onClick={handleAddFileClick}
                className={`${appStreamInlineAdderClass} w-full min-h-[56px] cursor-pointer p-3 sm:min-h-[64px] sm:p-4 md:min-h-[70px] ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {isLoading ? (
                    <ImSpinner2 className="animate-spin text-xs text-dashTextDim sm:text-sm" />
                  ) : (
                    <FaPlus className="text-xs text-dashTextDim sm:text-sm" />
                  )}
                  <span className="text-[10px] text-dashTextDim sm:text-xs">
                    {isLoading ? tCommon("loading") : tStream("clickToAddMoreFiles")}
                  </span>
                </div>
              </button>
            ) : null}
          </div>

          <div className={appStreamBottomActionRowClass}>
            <Button
              disabled={!selectedFile || isStarting}
              onClick={handleOnStartWatching}
              icon={isStarting ? <ImSpinner2 className="animate-spin" /> : undefined}
              className={appStreamPrimaryButtonClass}
              name={isStarting ? tStream("starting") : tStream("startWatching")}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default FileSelection;
