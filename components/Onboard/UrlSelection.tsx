"use client";
import { AuthState, OnboardStep, RoomState } from "@/types/storeTypes";
import { Button, Input } from "../UI";
import { useDispatch, useSelector } from "react-redux";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { setRoom } from "@/lib/store/slices/roomSlice";
import type { RootState } from "@/lib/store";
import { useCreateRoomMutation } from "@/lib/store/api/roomApi";
import { FaYoutube, FaVimeo, FaTwitch, FaFileVideo, FaArrowLeft } from "react-icons/fa";
import { MdOndemandVideo } from "react-icons/md";
import { useState } from "react";
import ReactPlayer from "react-player";
const UrlSelection = () => {
    const state = useSelector((state: RootState) => state);
    const [sourceUrl, setSourceUrl] = useState<string>(state.room.url || "");
    const [isEnterDisabled, setEnterDisabled] = useState<boolean>(!ReactPlayer.canPlay(state.room.url || ""));
    const [createRoomApi] = useCreateRoomMutation();
    const dispatch = useDispatch();

    const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSourceUrl(e.target.value);
        setEnterDisabled(!ReactPlayer.canPlay(e.target.value));
    };

    const handleOnEnterRoom = async () => {
        if (state.auth.isAuthenticated) {
            const response = await createRoomApi({ url: sourceUrl, sourceType: "url" }).unwrap();
            if (response.success) {
                dispatch(setRoom(response));
            }
        } else {
            dispatch(changeStep(OnboardStep.AUTH_STEP));
        }
    };

    const handleBack = () => {
        dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#18181b]">
            <div className="w-full max-w-md flex flex-col items-center gap-8 px-4">
                {/* Back button */}
                
                <div className="gap-4 flex flex-col items-center">
                    <h2 className="text-3xl font-extrabold text-gray-100 text-center  font-parkinsans">Enter Source URL</h2>
                    <p className="text-gray-300 text-center mb-4 text-sm font-medium">
                        Paste a video URL to start your party.
                    </p>
                </div>
                <div className="flex w-full gap-4">
                    <input
                        type="text"
                        placeholder="Paste your source link here"
                        value={sourceUrl}
                        onChange={handleOnSourceUrlChange}
                        className="flex-1 rounded-lg w-full bg-zinc-800 text-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    <Button
                        onClick={handleOnEnterRoom}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-lg transition
                        disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        name="Enter"
                        disabled={isEnterDisabled}
                    >
                        {/* Enter */}
                    </Button>
                </div>

                {/* Supported sources */}
                <div className="flex flex-col items-center gap-2 mt-4">
                    <span className="text-xs text-gray-400 mb-1">Supported sources:</span>
                    <div className="flex gap-6 justify-center">
                        {[
                            { icon: <FaYoutube className="text-2xl text-red-500" />, name: "YouTube" },
                            { icon: <MdOndemandVideo className="text-2xl text-green-400" />, name: "HLS" },
                            { icon: <FaFileVideo className="text-2xl text-blue-400" />, name: "FLV" },
                            { icon: <FaVimeo className="text-2xl text-blue-500" />, name: "Vimeo" },
                            { icon: <FaTwitch className="text-2xl text-purple-500" />, name: "Twitch" }
                        ].map((source, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="p-2 rounded-full bg-zinc-800">
                                    {source.icon}
                                </div>
                                <span className="text-xs text-gray-400 mt-1">{source.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleBack}
                    className="self-start w-full rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-gray-100 px-4 py-3 hover:bg-red-800 transition-colors"
                    name="Cancel"
                >
                    {/* <FaArrowLeft className="text-sm" /> */}
                    {/* <span className="text-sm font-medium">Cancel</span> */}
                </Button>
            </div>
        </div>
    );
};

export default UrlSelection;