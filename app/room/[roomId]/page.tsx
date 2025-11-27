"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef } from "react";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import ReactionsContainer from "@/components/Panel/ReactionsContainer";
import { ChatProvider } from "@/context/ChatContext";

const Page = () => {
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <ChatProvider>
      <div ref={containerRef} className="flex h-screen bg-[#030712] relative">
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

        {/* Flying Emoji Animations - Rendered at page level to fly over video */}
        <ReactionsContainer />
      </div>
    </ChatProvider>
  );
};

export default Page;
