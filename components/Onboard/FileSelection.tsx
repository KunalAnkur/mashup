"use client";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useDispatch, useSelector } from "react-redux";
import {
  FaUpload,
  FaLink,
  FaFileAlt,
  FaFileVideo,
  FaFileAudio,
  FaFileImage,
  FaArrowLeft,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import { Button } from "../UI";
import { useEffect } from "react";
import { useFileContext } from "@/context/FileContext";
import { setRefers, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";

const FileSelection = () => {
  const dispatch = useDispatch();
  const selectedFileIndex = useSelector(
    (state: RootState) => state.room.selectedFileIndex
  );
  const authState = useSelector((state: RootState) => state.auth);

  const { files, removeFile } = useFileContext();
  const selectedFile = files[selectedFileIndex] ?? null;

  useEffect(() => {
    if (files.length > 0 && selectedFileIndex === -1) {
      dispatch(setSelectedFileIndex(0));
    }
  }, [files, selectedFileIndex, dispatch]);

  const handleBack = () => dispatch(changeStep(OnboardStep.SELECT_SOURCE));
  const handleOnURLSelection = () =>
    dispatch(changeStep(OnboardStep.URL_SELECTION));
  const handleOnUploadSelection = () => {
    // Upload logic
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/"))
      return <FaFileVideo className="text-pink-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("audio/"))
      return <FaFileAudio className="text-fuchsia-600 text-lg sm:text-xl" />;
    if (fileType.startsWith("image/"))
      return <FaFileImage className="text-green-500 text-lg sm:text-xl" />;
    return <FaFileAlt className="text-gray-400 text-lg sm:text-xl" />;
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
    const urlList = files.map((file) => URL.createObjectURL(file));
    dispatch(
      setRefers({
        refer: true,
        sourceType: "file",
        urls: urlList,
      })
    );
    if (authState.isAuthenticated) {
      // const response = await createRoomApi({ sourceType: "file" }).unwrap();
      // if (response.success) {
      //     const result = {...response, authId: authState.user!.id}
      //     dispatch(setRoom(result));
      // }
    } else {
      // TODO: Here we need to handle the case when user authenticate then it should redirect to room.
      // I think we need to send the redirect Information to the global state.

      dispatch(changeStep(OnboardStep.AUTH_STEP));
    }
  };
  return (
    <div className="flex items-center justify-center h-full bg-[#18181b] p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-parkinsans">
            Your Files
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            {files.length
              ? "Select a file to start watching"
              : "No files selected yet"}
          </p>
        </div>

        {files.length ? (
          <div className="overflow-y-auto max-h-72 sm:max-h-96 space-y-2 sm:space-y-3 p-1 pr-2 sm:pr-4">
            {files.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileSelect(index)}
                className={`flex justify-between items-center p-3 sm:p-4 rounded-xl bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition
                                    ${
                                      selectedFileIndex === index
                                        ? "ring-2 ring-rose-500 to-fuchsia-600"
                                        : ""
                                    }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-full bg-zinc-700 flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white text-xs sm:text-sm font-semibold truncate">
                      {file.name}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedFileIndex === index && (
                    <FaCheck className="text-pink-600 text-sm sm:text-base" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileRemove(index);
                    }}
                    className="text-gray-400 hover:text-red-500 transition text-sm sm:text-base"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 p-6 sm:p-8 bg-zinc-800 rounded-xl text-center">
            <div className="p-3 sm:p-4 rounded-full bg-zinc-700">
              <FaUpload className="text-xl sm:text-2xl text-gray-400" />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              Drag and drop files or browse manually
            </p>
            <Button
              onClick={handleOnUploadSelection}
              className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:bg-gradient-to-r hover:from-rose-900 hover:via-pink-700 hover:to-fuchsia-600 text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-2 rounded-lg"
              name="Select Files"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
          <Button
            onClick={handleBack}
            className="w-full rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-white text-sm sm:text-base px-4 py-2.5 sm:py-3 hover:bg-zinc-700"
            name="Back"
          >
            <FaArrowLeft className="text-xs sm:text-sm" />
            Back
          </Button>
          <Button
            onClick={handleOnURLSelection}
            className="w-full  rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-white text-sm sm:text-base px-4 py-2.5 sm:py-3 hover:bg-zinc-700"
            name="Use URL"
          >
            <FaLink className="text-xs sm:text-sm" />
            Use URL
          </Button>
        </div>

        <Button
          disabled={!selectedFile}
          onClick={handleOnStartWatching}
          className={`w-full rounded-lg font-bold text-sm sm:text-base px-4 py-2.5 sm:py-3 transition ${
            selectedFile
              ? "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:bg-gradient-to-r hover:from-rose-900 hover:via-pink-700 hover:to-fuchsia-600 text-white"
              : "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white opacity-50 cursor-not-allowed"
          }`}
          name="Start Watching"
        />
      </div>
    </div>
  );
};

export default FileSelection;
