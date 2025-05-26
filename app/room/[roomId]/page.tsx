"use client";

import { Button } from "@/components";
import { useDispatch } from "react-redux";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";

const Page = () => {
    const dispatch = useDispatch();
    const [inactiveMyRoomApi] = useInactiveMyRoomMutation();

    const handleExitRoom = async () => {
        const response = await inactiveMyRoomApi();
        console.log(response)
        dispatch(exitRoom());
    }
    return (
        <div className="flex h-screen bg-[#030712] select-none">
            ROOM
            <Button onClick={handleExitRoom} name="Exit Room"/>
        </div>
    );
};

export default Page;