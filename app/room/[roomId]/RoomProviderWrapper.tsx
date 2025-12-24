"use client";

import { RoomProvider } from "@/context/RoomContext";
import { SocketProvider } from "@/context/SocketContext";
import { ChatProvider } from "@/context/ChatContext";
import { VideoSelectionProvider } from "@/context/VideoSelectionContext";

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
            {children}
          </VideoSelectionProvider>
        </ChatProvider>
      </RoomProvider>
    </SocketProvider>
  );
}

