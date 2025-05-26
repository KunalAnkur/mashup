"use client";
// hover: bg-zinc-700
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useDispatch } from "react-redux";
import { FaUpload, FaLink } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "../UI";
import { useState } from "react";
import { useFileContext } from "@/context/FileContext";

const FileSelection = () => {
    const [isJoinDisabled, setIsJoinDisabled] = useState<boolean>(true);
    const [roomId, setRoomId] = useState<string>("");
    const { files } = useFileContext();
    const dispatch = useDispatch();
    const router = useRouter();
    const handleOnUploadSelection = () => {
        // Add your upload logic here
    };
    const handleBack = () => {
        dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    };
    const handleOnRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoomId(e.target.value.trim());
        setIsJoinDisabled(e.target.value.trim().length !== 4);
    }
    const handleOnURLSelection = () => {
        // router.push(`#${OnboardStep.SOURCE_INFO}`);
        dispatch(changeStep(OnboardStep.URL_SELECTION));
    };

    // TODO: Need to design the file selection UI 
    return (
        <div className="flex flex-col items-center justify-center h-full gap-12 bg-[#18181b]">
            
            <Button
                onClick={handleBack}
                className="self-start w-full rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-gray-100 px-4 py-3 hover:bg-red-800 transition-colors"
                name="Cancel"
            >
                {/* <FaArrowLeft className="text-sm" /> */}
                {/* <span className="text-sm font-medium">Cancel</span> */}
            </Button>
        </div>
    );
};

export default FileSelection;