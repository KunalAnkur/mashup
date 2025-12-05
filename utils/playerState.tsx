import { RoomType } from "@/context/RoomContext";

const getPlayerMessage = (isHost: boolean, roomType: RoomType, hostLeft: boolean, remoteStream: MediaStream | null) => {
    if (isHost) {} else {
        if (roomType === "stream") {
            if (hostLeft) {
                return "Host has left the room";
            } else {
                if (!remoteStream) {
                    return "Host is stop streaming";
                }
            }
        } else {

        }
    }
};

export default getPlayerMessage;