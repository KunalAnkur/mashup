"use client";
// hover: bg-zinc-700
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useDispatch } from "react-redux";
import { FaUpload, FaLink } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Button } from "../UI";
import { useRef, useState } from "react";
import { setFile } from "@/lib/store/slices/roomSlice";
import { useFileContext } from "@/context/FileContext";

const SourceSelection = () => {
    const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
    const [roomId, setRoomId] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();
    const { setFiles } = useFileContext();
    const router = useRouter();
    const handleOnVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log(files);
        if (files && files.length > 0) {
            // Do something with the files
            // const selectedFile = Array.from(files).map(file => URL.createObjectURL(file))
            setFiles(Array.from(files));
            dispatch(changeStep(OnboardStep.FILE_SELECTION));
        }
    };
    const handleOnUploadSelection = () => {
        // Add your upload logic here
        // dispatch(changeStep(OnboardStep.FILE_SELECTION));
        fileInputRef.current?.click();
    };

    const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoomId(e.target.value.trim());
        setIsJoinDisabled(e.target.value.trim().length !== 4);
    }
    const handleOnURLSelection = () => {
        // router.push(`#${OnboardStep.SOURCE_INFO}`);
        dispatch(changeStep(OnboardStep.URL_SELECTION));
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-12 bg-[#18181b]">
            {/* Create Party */}
            <div className="">
                <h2 className="text-3xl font-extrabold text-gray-100 text-center mb-2 font-parkinsans">Create Party</h2>
                <p className="text-gray-300 text-center mb-8 text-sm font-medium">Start a new session by uploading a file or using a URL.</p>
                <div className="flex gap-8 justify-center">
                    <input
                        ref={fileInputRef}
                        onChange={handleOnVideoChange}
                        type="file"
                        accept="video/*,audio/*,.mp4,.mp3,.mkv,.webm,.3gp,.avi,.mpeg,.mpg,.ogg,.wmv,.wav,.mov"
                        multiple
                        className="hidden"
                    />
                    <button
                        onClick={handleOnUploadSelection}
                        className="flex flex-col items-center justify-center w-40 h-40 bg-zinc-800  hover:bg-green-700 rounded-xl transition shadow-lg"
                    >
                        <FaUpload className="text-4xl mb-4 text-gray-200" />
                        <span className="text-lg font-semibold text-gray-200">Device</span>
                    </button>
                    <button
                        onClick={handleOnURLSelection}
                        className="flex flex-col items-center justify-center w-40 h-40 bg-zinc-800 hover:bg-purple-700 rounded-xl transition shadow-lg"
                    >
                        <FaLink className="text-4xl mb-4 text-gray-200" />
                        <span className="text-lg font-semibold text-gray-200">URL</span>
                    </button>
                </div>
            </div>

            {/* Divider */}
            {/* <div className="w-full flex items-center mb-16">
                <div className="flex-1 h-px bg-zinc-700" />
            </div> */}
            <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-400 text-xs">or</span>
                <div className="flex-1 h-px bg-gray-700" />
            </div>
            {/* Join Party */}
            <div className="w-full max-w-md flex flex-col items-center">
                <h2 className="text-2xl font-extrabold text-gray-100 text-center mb-2 font-parkinsans">Join Party</h2>
                <p className="text-gray-300 text-center mb-6 text-sm font-medium">Enter a Room ID to join an existing session.</p>
                <div className="flex w-full gap-4">
                    <input
                        type="text"
                        placeholder="Room ID"
                        value={roomId}
                        onChange={handleOnRoomIdChange}
                        className="flex-1 rounded-lg bg-zinc-800 text-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    />
                    <Button
                    name="Join"
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-lg transition
                    disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        disabled={isJoinDisabled}
                    >
                        
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SourceSelection;