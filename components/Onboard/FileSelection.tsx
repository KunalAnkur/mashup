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
import { useState, useEffect } from "react";
import { useFileContext } from "@/context/FileContext";
import { setRefers, setRoom, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { RootState } from "@/lib/store";
import { useCreateRoomMutation } from "@/lib/store/api/roomApi";

const FileSelection = () => {
    const dispatch = useDispatch();
    const selectedFileIndex = useSelector((state: RootState) => state.room.selectedFileIndex);
    const authState = useSelector((state: RootState) => state.auth);
    const [roomId, setRoomId] = useState<string>("");
    const [createRoomApi] = useCreateRoomMutation();
    const { files, removeFile } = useFileContext();
    const selectedFile = files[selectedFileIndex] ?? null;

    useEffect(() => {
        if (files.length > 0 && selectedFileIndex === -1) {
            dispatch(setSelectedFileIndex(0));
        }
    }, [files, selectedFileIndex, dispatch]);

    const handleBack = () => dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    const handleOnURLSelection = () => dispatch(changeStep(OnboardStep.URL_SELECTION));
    const handleOnUploadSelection = () => {
        // Upload logic
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("video/")) return <FaFileVideo className="text-purple-500 text-xl" />;
        if (fileType.startsWith("audio/")) return <FaFileAudio className="text-blue-500 text-xl" />;
        if (fileType.startsWith("image/")) return <FaFileImage className="text-green-500 text-xl" />;
        return <FaFileAlt className="text-gray-400 text-xl" />;
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
        const urlList = files.map(file => URL.createObjectURL(file));
        dispatch(setRefers({
            refer: true,
            sourceType: "file",
            urls: urlList
        }));
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
        <div className="flex items-center justify-center h-full bg-[#18181b] p-6">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white font-parkinsans">Your Files</h2>
                    <p className="text-gray-400 mt-2">
                        {files.length ? "Select a file to start watching" : "No files selected yet"}
                    </p>
                </div>

                {files.length ? (
                    <div className="overflow-y-auto max-h-96 space-y-3 p-1 pr-4">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                onClick={() => handleFileSelect(index)}
                                className={`flex justify-between items-center p-4 rounded-xl bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition
                                    ${selectedFileIndex === index ? "ring-2 ring-purple-500" : ""}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-zinc-700">
                                        {getFileIcon(file.type)}
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-semibold truncate w-44">{file.name}</h4>
                                        <p className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedFileIndex === index && <FaCheck className="text-purple-500" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileRemove(index);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-800 rounded-xl text-center">
                        <div className="p-4 rounded-full bg-zinc-700">
                            <FaUpload className="text-2xl text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-sm">Drag and drop files or browse manually</p>
                        <Button
                            onClick={handleOnUploadSelection}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2 rounded-lg"
                            name="Select Files"
                        />
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={handleBack}
                        className="flex-1 rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 hover:bg-zinc-700"
                        name="Back"
                    >
                        <FaArrowLeft className="text-sm" />
                        Back
                    </Button>
                    <Button
                        onClick={handleOnURLSelection}
                        className="flex-1 rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 hover:bg-zinc-700"
                        name="Use URL"
                    >
                        <FaLink className="text-sm" />
                        Use URL
                    </Button>
                </div>

                <Button
                    disabled={!selectedFile}
                    onClick={handleOnStartWatching}
                    className={`w-full rounded-lg font-bold px-4 py-3 transition ${selectedFile
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-purple-600 text-white opacity-50 cursor-not-allowed"
                        }`}
                    name="Start Watching"
                />
            </div>
        </div>
    );
};

export default FileSelection;
