"use client"

import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { showError } from "@/utils/toast";

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
            showError("Screen sharing failed", "Please check your browser permissions and try again.");
        }
    };
    return (
        <div className="flex flex-col h-full w-full p-4">
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-2xl p-8 max-w-md w-full">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-2">Screen Sharing</h3>
                            <p className="text-white/60 text-sm">Share your screen to stream content to the room</p>
                        </div>
                        <button
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
                            onClick={handleShareScreen}
                        >
                            Share Screen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SourceTab;