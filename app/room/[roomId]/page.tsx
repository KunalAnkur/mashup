"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef } from "react";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import { VideoSelectionProvider } from "@/context/VideoSelectionContext";

const Page = () => {
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use different socket namespace based on source type
  const socketNamespace = roomState.sourceType === "file" ? "filestream" : undefined;
  
  return (
    <VideoSelectionProvider namespace={socketNamespace}>
      <div ref={containerRef} className="flex h-screen bg-[#030712]">
        <div
          className={`
                      bg-black flex-1 transition-all duration-300 h-full w-full
                      ${roomState.settings.panelCollapsed ? "w-full" : ""}
                  `}
        >
          <PlayerWrapper fullscreenTargetRef={containerRef} />
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
    </VideoSelectionProvider>
  );
};

export default Page;
