"use client";

import { RoomProvider } from "@/context/RoomContext";
import { SocketProvider } from "@/context/SocketContext";
import { ChatProvider } from "@/context/ChatContext";
import { VideoSelectionProvider } from "@/context/VideoSelectionContext";
import { CallProvider } from "@/context/CallContext";

export default function RoomProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <RoomProvider>
        <ChatProvider>
          <VideoSelectionProvider>
            <CallProvider>
              {children}
            </CallProvider>
          </VideoSelectionProvider>
        </ChatProvider>
      </RoomProvider>
    </SocketProvider>
  );
}

