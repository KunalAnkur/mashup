"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef, useEffect } from "react";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import ReactionsContainer from "@/components/Panel/ReactionsContainer";
import { useRoomContext } from "@/context/RoomContext";

const Page = () => {
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isJoined } = useRoomContext();

  // Warn user before closing tab/window when in a room
  useEffect(() => {
    if (!isJoined) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages and show their own generic warning
      // But we still need to set returnValue or return a string to trigger the dialog
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
      return ''; // Required for some other browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isJoined]);

  return (
        <div ref={containerRef} className="flex h-screen bg-[#030712] relative">
          <div
            className={`
              bg-black flex-1 transition-all duration-300 h-full w-full relative
              ${roomState.settings.panelCollapsed ? "w-full" : ""}
            `}
          >
            <PlayerWrapper fullscreenTargetRef={containerRef} />
            {/* Flying Emoji Animations - Inside fullscreen container to work in fullscreen mode */}
            <ReactionsContainer />
          </div>
          <div
            className={`
              relative bg-zinc-800 overflow-hidden transition-all duration-300
              w-[25%] min-w-[320px] max-w-[420px]
              ${roomState.settings.panelCollapsed ? "hidden" : "visible"}
            `}
          >
            <Panel />
          </div>
        </div>
  );
};

export default Page;
