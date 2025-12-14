"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef, useEffect, useState } from "react";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import ReactionsContainer from "@/components/Panel/ReactionsContainer";
import { UserInfo, useRoomContext } from "@/context/RoomContext";
import ModalOnRoomCreate from "@/components/Modals/ModalOnRoomCreate";
import { useDispatch } from "react-redux";
import { setFocused } from "@/lib/store/slices/roomSlice";
const Page = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isJoined, roomId, isHost, joinResponse } = useRoomContext();
  const hostUsername = joinResponse?.users?.find((user: UserInfo) => user.host)?.username as string | null;
  // Welcome/invite modal state
  const [showModal, setShowModal] = useState(false);
  const modalShownRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);

  // Generate room URL
  const roomUrl = roomId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}` : '';

  // Reset modal when room changes
  useEffect(() => {
    if (roomId && roomId !== roomIdRef.current) {
      roomIdRef.current = roomId;
      modalShownRef.current = false;
      setShowModal(false);
    }
  }, [roomId]);

  // Show appropriate modal when user joins room
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Show modal when user joins room and hasn't shown it for this room yet
    if (isJoined && roomId && roomId === roomIdRef.current) {
      if (!modalShownRef.current) {
        // Small delay to ensure everything is loaded
        const timer = setTimeout(() => {
          setShowModal(true);
          modalShownRef.current = true;
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShowModal(false);
    }
  }, [isJoined, roomId]);

  // Handle closing modal
  const handleCloseModal = () => {
    setShowModal(false);
    dispatch(setFocused(true));
    modalShownRef.current = true;
  };

  // Handle closing guest modal and joining
  const handleJoinRoom = () => {
    setShowModal(false);
    modalShownRef.current = true;
  };

  // Warn user before closing tab/window when in  room
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
    <>
      {/* Modal */}
      <ModalOnRoomCreate
        isHost={isHost}
        hostUsername={hostUsername}
        showModal={showModal}
        onClose={handleCloseModal}
        roomUrl={roomUrl}
        onJoinRoom={handleJoinRoom}
      />
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
    </>
  );
};

export default Page;
