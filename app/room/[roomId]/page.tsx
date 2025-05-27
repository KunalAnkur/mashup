"use client";

import { Button } from "@/components";
import { useDispatch } from "react-redux";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";
import { Player } from "@/components/VideoPlayer";
import { useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import screenfull from "screenfull";

const Page = () => {
    const dispatch = useDispatch();
    const containerRef = useRef<HTMLDivElement>(null)
    const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    const handleExitRoom = async () => {
        const response = await inactiveMyRoomApi();
        console.log(response);
        dispatch(exitRoom());
    };

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    return (
        <div ref={containerRef} className="flex h-screen bg-[#030712] select-none">
            {/* Main video area */}
            <div className={`bg-black ${isPanelOpen ? 'w-[70%]' : 'w-[95%]'} transition-all duration-300 p-2`}>
                <Player fullscreenTargetRef={containerRef} url="https://www.youtube.com/watch?v=KJwYBJMSbPI" />
            </div>

            {/* Collapsible panel */}
            <div
                className={`relative bg-gray-900 border-l border-gray-700 overflow-hidden transition-all duration-300 ${isPanelOpen ? 'w-[30%]' : 'w-0'}`}
            >
                <div className="p-4 border-t border-gray-700">
                    <Button
                        onClick={handleExitRoom}
                        name="Exit Room"
                        className="w-full bg-red-600 hover:bg-red-700"
                    />
                </div>
            </div>
        </div>
    );
};

export default Page;