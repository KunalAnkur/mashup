"use client"

import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";
import { exitRoom, setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../UI";
import { MdOutlineExitToApp } from "react-icons/md";
import { BsFillChatSquareFill } from "react-icons/bs";
import { FiChevronsLeft } from "react-icons/fi";
import { FiChevronsRight } from "react-icons/fi";

import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";



const PlayerOverlay = () => {
    const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
    const dispatch = useDispatch();
    const panelCollapsed = useSelector((state: RootState) => state.room.settings.panelCollapsed);
    const host = useSelector((state: RootState) => state.room.host);
    const router = useRouter()
    const handleExitRoom = async () => {
        const response = await inactiveMyRoomApi();
        if (host) {
            console.log(response);
            
        } else {

        }
        dispatch(exitRoom());
        router.push("/");
    };

    const handleTogglePanelExpand = () => {
        const newPanelCollapsedState = !panelCollapsed;
        dispatch(setPanelCollapsed({ panelCollapsed: newPanelCollapsedState }));
    }
    
    const handleToggleChat = () => {

    }

    return (
        <>
            <div className="z-20 flex justify-between absolute top-0 left-0 w-full h-20 p-4">
                <span
                    className="bg-white/20 backdrop-blur-md gap-2 flex p-6 justify-center items-center rounded-full cursor-pointer"
                    onClick={handleExitRoom}
                >
                    <MdOutlineExitToApp /> <span>Exit</span>
                </span>
                <div className="flex gap-4">
                    <span
                        className="bg-white/20 backdrop-blur-md flex p-6 justify-center items-center rounded-full cursor-pointer"
                        onClick={handleToggleChat}
                    >
                        <BsFillChatSquareFill />
                    </span>
                    <span
                        className="bg-white/20 backdrop-blur-md flex p-6 justify-center items-center rounded-full cursor-pointer"
                        onClick={handleTogglePanelExpand}
                    >
                        {panelCollapsed ? <FiChevronsLeft size={20} /> : <FiChevronsRight size={20} />}
                    </span>
                </div>
            </div>
            {/* <div className="z-20 absolute bottom-0 right-0">
                <div className="w-60 h-80 bg-red-500">
                    
                </div>
            </div> */}
        </>
    );
};

export default PlayerOverlay;
