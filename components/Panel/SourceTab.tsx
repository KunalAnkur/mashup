"use client"

import { useMediaStreamContext } from "@/context/MediaStreamContext";

const SourceTab = () => {
    const { setStream } = useMediaStreamContext();
    const handleShareScreen = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    // width: { ideal: 640, max: 640 },
                    // height: { ideal: 360, max: 360 },
                    // frameRate: { ideal: 30, max: 30 }, // keep it smooth
                    width: { ideal: 854, max: 854 }, // 480p width
                    height: { ideal: 480, max: 480 },
                    frameRate: { ideal: 30, max: 30 },
              },
                audio: true
            });
            setStream(mediaStream);
        } catch (err) {
            alert("Screen sharing was cancelled or failed.");
        }
    };
    return (
        <div className="flex flex-col h-full w-full p-4">
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-fit"
                onClick={handleShareScreen}
            >
                Share Screen
            </button>
        </div>
    );
};

export default SourceTab;