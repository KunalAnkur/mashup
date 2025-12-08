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
} from "react-icons/fa";
import { Button } from "../UI";
import { useEffect, useState, useRef } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useFileContext } from "@/context/FileContext";
import { setRefers, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ACCEPTED_FILE_TYPES } from "@/types/ModalTypes/acceptedFileTypes";

const FileSelection = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedFileIndex = useSelector(
    (state: RootState) => state.room.selectedFileIndex
  );
  const authState = useSelector((state: RootState) => state.auth);

  const { files, removeFile, getThumbnail, thumbnails, setFiles } = useFileContext();
  const selectedFile = files[selectedFileIndex] ?? null;
  const [isStarting, setIsStarting] = useState(false);
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
    router.push("/stream");
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
          urls: urlList,
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

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      // Append new files to existing files instead of replacing
      const filesArray = Array.from(newFiles);
      setFiles([...files, ...filesArray]);
      fileInputRef.current.value = "";
    }
  };
  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-purple-500 rounded-full"></span>
          <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
            Choose Files
          </h3>
        </div>
        <button
          onClick={handleAddFileClick}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 hover:border-pink-500/50 border border-white/10 transition-all duration-300 cursor-pointer group shadow-lg"
          title="Add more files"
        >
          <FaPlus className="text-gray-400 group-hover:text-white transition-colors duration-300 text-lg" />
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

      <div className="flex-1 flex flex-col space-y-4">
        <p className="text-gray-400 text-sm">
          {files.length > 0
            ? "Select a file to start watching"
            : "Your selected files will appear here"}
        </p>

        {/* Files List with Preview Placeholders */}
        <div
          className={`space-y-2 pr-2 ${
            files.length > 2 ? "overflow-y-auto max-h-[180px]" : ""
          }`}
        >
          {/* Show actual files */}
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileSelect(index)}
              className={`flex justify-between items-center p-4 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] cursor-pointer hover:bg-zinc-800 transition-all duration-200 border ${
                selectedFileIndex === index
                  ? "border-fuchsia-500/50 ring-1 ring-fuchsia-500/30"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {(() => {
                  const thumbnail = getThumbnail(file);
                  const isVideo = isVideoFile(file);
                  
                  return (
                    <div className={`
                      flex-shrink-0 rounded-xl overflow-hidden bg-white/5
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
                                parent.className = 'p-3 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center';
                                parent.appendChild(getFileIcon(file.type) as any);
                              }
                            }}
                          />
                        ) : (
                          // Show loading state or icon while thumbnail is being generated
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <FaFileVideo className="text-pink-600 text-sm" />
                          </div>
                        )
                      ) : (
                        getFileIcon(file.type)
                      )}
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <h4 className="text-white text-sm font-semibold truncate">
                    {file.name}
                  </h4>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {selectedFileIndex === index && (
                  <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                    <FaCheck className="text-fuchsia-500 text-xs" />
                  </div>
                )}
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

          {/* Show preview placeholders to fill up to 2 items - same size as actual file items */}
          {files.length < 2 &&
            Array.from({ length: 2 - files.length }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] border border-dashed border-white/10"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 rounded-xl overflow-hidden bg-white/5 w-16 h-10 flex items-center justify-center">
                    <FaFileVideo className="text-gray-700 text-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-4 bg-white/[0.03] rounded-full w-3/4 mb-2" />
                    <div className="h-3 bg-white/[0.02] rounded-full w-1/3" />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center">
                    <FaTrash className="text-gray-700 text-xs" />
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Info Section */}
        <div className="flex items-start gap-2 p-3 bg-white/[0.03]  rounded-xl">
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
          <div className="flex-1">
            <p className="text-gray-400 text-xs leading-relaxed">
              <span className="text-gray-300 font-medium">Pro tip:</span> You
              can select multiple files at once to create a playlist experience
            </p>
          </div>
        </div>

        <div className="flex gap-3 ">
          <Button
            onClick={handleBack}
            className="w-full rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10  hover:border-white/20 text-white text-sm px-4 py-3 transition-all duration-200"
            name="Back"
          >
            <FaArrowLeft className="text-xs" />
            Back
          </Button>
          <Button
            onClick={handleOnURLSelection}
            className="w-full rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10  hover:border-white/20 text-white text-sm px-4 py-3 transition-all duration-200"
            name="Use URL"
          >
            <FaLink className="text-xs" />
            Use URL
          </Button>
        </div>

        <Button
          disabled={!selectedFile || isStarting}
          onClick={handleOnStartWatching}
          icon={isStarting ? <ImSpinner2 className="animate-spin" /> : undefined}
          className={`w-full rounded-xl font-bold text-sm px-4 py-3.5 transition-all duration-200 shadow-lg ${
            selectedFile && !isStarting
              ? "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white"
              : "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white opacity-50 cursor-not-allowed"
          }`}
          name={isStarting ? "Starting..." : "Start Watching"}
        />
      </div>
    </div>
  );
};

export default FileSelection;
