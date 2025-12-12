"use client";
import { useDispatch, useSelector } from "react-redux";
import {
  FaLink,
  FaFileAlt,
  FaFileVideo,
  FaFileAudio,
  FaFileImage,
  FaArrowLeft,
  FaTrash,
  FaCheck,
  FaPlus,
  FaUpload,
} from "react-icons/fa";
import { Button } from "../UI";
import { useEffect, useState, useRef } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useFileContext } from "@/context/FileContext";
import { setRefers, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ACCEPTED_FILE_TYPES } from "@/types/ModalTypes/acceptedFileTypes";
import { showError } from "@/utils/toast";

const FileSelection = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedFileIndex = useSelector(
    (state: RootState) => state.room.selectedFileIndex
  );
  const authState = useSelector((state: RootState) => state.auth);

  const { files, removeFile, getThumbnail, thumbnails, setFiles, isPersistenceSupported, requestFilePicker, showPermissionPrompt } = useFileContext();
  const selectedFile = files[selectedFileIndex] ?? null;
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (files.length > 0 && selectedFileIndex === -1) {
      dispatch(setSelectedFileIndex(0));
    }
  }, [files, selectedFileIndex, dispatch]);

  // Debug: Log when thumbnails change
  useEffect(() => {
    if (Object.keys(thumbnails).length > 0) {
      console.log('FileSelection: Thumbnails updated', Object.keys(thumbnails));
    }
  }, [thumbnails]);

  const handleBack = () => {
    router.back();
  };
  
  const handleOnURLSelection = () => router.push("/sync");

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/"))
      return <FaFileVideo className="text-pink-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("audio/"))
      return <FaFileAudio className="text-fuchsia-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("image/"))
      return <FaFileImage className="text-green-500 text-lg sm:text-xl" />;
    return <FaFileAlt className="text-gray-400 text-lg sm:text-xl" />;
  };

  // Helper to check if a file is a video (by MIME type or extension)
  const isVideoFile = (file: File): boolean => {
    // Check MIME type
    if (file.type.startsWith("video/")) {
      return true;
    }
    // Check file extension as fallback
    const videoExtensions = /\.(mp4|mkv|webm|avi|mov|mpeg|mpg|3gp|wmv|flv|m3u8|ogv|m4v)$/i;
    return videoExtensions.test(file.name);
  };

  const handleFileSelect = (index: number) => {
    dispatch(setSelectedFileIndex(index));
  };

  const handleFileRemove = (index: number) => {
    // Remove the file
    removeFile(index);

    // Update selected index if needed
    if (index === selectedFileIndex) {
      if (files.length > 1) {
        dispatch(setSelectedFileIndex(index === 0 ? 0 : index - 1));
      } else {
        dispatch(setSelectedFileIndex(-1));
      }
    } else if (index < selectedFileIndex) {
      dispatch(setSelectedFileIndex(selectedFileIndex - 1));
    }
  };

  const handleOnStartWatching = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      const urlList = files.map((file) => URL.createObjectURL(file));
      dispatch(
        setRefers({
          refer: true,
          type: "stream",
          source: "file",
          files: urlList,
        })
      );
      
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
    if (isPersistenceSupported) {
      // Use File System Access API for persistence
      try {
        setIsLoading(true);
        const selectedFiles = await requestFilePicker(true); // Append mode
        
        if (selectedFiles.length > 0) {
          // Append new files to existing files
          setFiles([...files, ...selectedFiles]);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled, do nothing
          return;
        }
        console.error('Error selecting files:', error);
        showError("Failed to select files", "Please check your browser permissions and try again.");
        // Fallback to traditional file input
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
      // For traditional file input, files won't persist (no handles)
      // Append new files to existing files instead of replacing
      const filesArray = Array.from(newFiles);
      setFiles([...files, ...filesArray]);
      fileInputRef.current.value = "";
    }
  };
  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-full"></span>
          <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
            Choose Files
          </h3>
        </div>
        <button
          onClick={handleAddFileClick}
          disabled={isLoading}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/40 border border-zinc-600/15 transition-all duration-300 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          title="Add more files"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          {isLoading ? (
            <ImSpinner2 className="relative z-10 text-zinc-300 group-hover:text-white transition-colors duration-300 text-sm animate-spin" />
          ) : (
            <FaUpload className="relative z-10 text-zinc-300 group-hover:text-white transition-colors duration-300 text-sm" />
          )}
          <span className="relative z-10 text-sm font-medium text-white/80 group-hover:text-white transition-colors duration-300">
            {isLoading ? "Loading..." : "Add Files"}
          </span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        onChange={handleFileChange}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
      />

      <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-sm border border-zinc-600/15 rounded-2xl p-5 w-full">
        <div className="flex-1 flex flex-col gap-4 w-full max-w-full overflow-hidden">
        {/* Files List with Preview Placeholders */}
        <div
          className="space-y-3 pr-2 overflow-y-auto max-h-[160px] w-full"
        >
          {/* Show actual files */}
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileSelect(index)}
              className={`relative flex justify-between items-center p-4 rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl cursor-pointer transition-all duration-200 border w-full max-w-full h-[70px] overflow-hidden ${
                selectedFileIndex === index
                  ? "border-purple-500/40 ring-2 ring-purple-500/25 bg-gradient-to-br from-zinc-700/25 via-zinc-600/25 to-zinc-700/25"
                  : "border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-full overflow-hidden">
                {(() => {
                  const thumbnail = getThumbnail(file);
                  const isVideo = isVideoFile(file);
                  
                  return (
                    <div className={`
                      flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800/15 to-zinc-700/15 backdrop-blur-sm border border-zinc-600/20
                      ${isVideo ? 'w-16 h-10' : 'p-3'}
                      flex items-center justify-center
                    `}>
                      {isVideo ? (
                        thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              // Show icon as fallback
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '';
                                parent.className = 'p-3 rounded-xl bg-gradient-to-br from-zinc-800/15 to-zinc-700/15 backdrop-blur-sm border border-zinc-600/20 flex-shrink-0 flex items-center justify-center';
                                parent.appendChild(getFileIcon(file.type) as any);
                              }
                            }}
                          />
                        ) : (
                          // Show loading state or icon while thumbnail is being generated
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800/15 to-zinc-700/15">
                            <FaFileVideo className="text-zinc-300 text-sm" />
                          </div>
                        )
                      ) : (
                        getFileIcon(file.type)
                      )}
                    </div>
                  );
                })()}
                <div className="w-[430px] ">
                  <h4 className=" text-white text-sm font-semibold truncate">
                    {file.name}
                  </h4>
                  <p className="text-white/60 text-xs mt-0.5 truncate">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedFileIndex === index 
                    ? "bg-purple-500/30 opacity-100" 
                    : "opacity-0"
                }`}>
                  <FaCheck className="text-purple-300 text-xs" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileRemove(index);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))}

          {/* Show preview placeholders or upload area */}
          {files.length === 0 ? (
            // Upload area when no files
            <button
              onClick={handleAddFileClick}
              disabled={isLoading}
              className="relative flex flex-col items-center justify-center p-6 rounded-xl  border-2 border-dashed border-zinc-600/15 hover:border-purple-500/40 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10 w-full h-[160px] transition-all duration-300 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <div className="relative z-10 flex p-4 items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700/10 to-zinc-600/10 backdrop-blur-md border border-zinc-500/20 group-hover:from-purple-500/25 group-hover:to-fuchsia-500/25 group-hover:border-purple-400/35 transition-all duration-300 mb-3">
                {isLoading ? (
                  <ImSpinner2 className="text-zinc-300 group-hover:text-white transition-colors duration-300 text-2xl animate-spin" />
                ) : (
                  <FaUpload className="text-zinc-300 group-hover:text-white transition-colors duration-300 text-2xl" />
                )}
              </div>
              <span className="relative z-10 text-base font-semibold text-white/90 group-hover:text-white transition-colors duration-300 mb-1">
                {isLoading ? "Loading..." : "Click to Upload Files"}
              </span>
              <span className="relative z-10 text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300">
                {isLoading ? "Please wait..." : "or drag and drop files here"}
              </span>
            </button>
          ) : files.length < 2 ? (
            // Placeholder when 1 file exists
            <div
              onClick={handleAddFileClick}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5 backdrop-blur-2xl border border-dashed border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/8 hover:via-pink-600/8 hover:to-fuchsia-600/8 w-full h-[70px] transition-all duration-200 cursor-pointer group overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 via-pink-600/8 to-fuchsia-600/8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <ImSpinner2 className="text-zinc-300 group-hover:text-white transition-colors duration-200 text-sm animate-spin" />
                ) : (
                  <FaPlus className="text-zinc-300 group-hover:text-white transition-colors duration-200 text-sm" />
                )}
                <span className="text-xs text-white/70 group-hover:text-white transition-colors duration-200">
                  {isLoading ? "Loading..." : "Click to add more files"}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Info Section */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5 backdrop-blur-2xl border border-zinc-600/10 rounded-xl hover:border-purple-500/20 hover:bg-gradient-to-br hover:from-purple-600/8 hover:via-pink-600/8 hover:to-fuchsia-600/8 transition-all duration-300">
          {/* tip 1 */}
        <div className="flex items-start gap-2 ">
          <div className="shrink-0 mt-0.5">
            <svg
              className="w-4 h-4 text-fuchsia-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="">
            <p className="text-white/70 text-xs leading-relaxed">
              <span className="text-white/90 font-medium">Tip 1:</span> You
              can select multiple files at once.
            </p>
          
          </div>
        </div>
        {/* tip 2 */}
        <div className="flex items-start gap-2 ">
          <div className="shrink-0 mt-0.5">
            <svg
              className="w-4 h-4 text-fuchsia-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="">
            <p className="text-white/70 text-xs leading-relaxed">
              <span className="text-white/90 font-medium">Tip 2:</span> You
              can drag and drop files to upload.
            </p>
          
          </div>
        </div>

        </div>

        <div className="flex gap-2 ">
          <Button
            onClick={handleBack}
            className="w-full rounded-xl flex items-center justify-center gap-2  bg-gray-900/10 hover:from-purple-600/15 hover:via-pink-600/15 hover:to-fuchsia-600/15 hover:border-purple-500/30 border border-zinc-600/10 text-white text-sm px-4 py-3 transition-all duration-200"
            name="Back"
          >
            <FaArrowLeft className="text-xs" />
            Back
          </Button>
          <Button
            onClick={handleOnURLSelection}
            className="w-full rounded-xl flex items-center justify-center gap-2  bg-gray-900/10 hover:from-purple-600/15 hover:via-pink-600/15 hover:to-fuchsia-600/15 hover:border-purple-500/30 border border-zinc-600/10 text-white text-sm px-4 py-3 transition-all duration-200"
            name="Use Sync"
          >
            <FaLink className="text-xs" />
            Use Sync
          </Button>
        </div>

        <Button
          disabled={!selectedFile || isStarting}
          onClick={handleOnStartWatching}
          icon={isStarting ? <ImSpinner2 className="animate-spin" /> : undefined}
          className={`w-full rounded-xl font-bold text-sm px-4 py-3.5 transition-all duration-200  ${
            selectedFile && !isStarting
              ? "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white"
              : "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white opacity-50 cursor-not-allowed"
          }`}
          name={isStarting ? "Starting..." : "Start Watching"}
        />
        </div>
      </div>
    </div>
  );
};

export default FileSelection;
