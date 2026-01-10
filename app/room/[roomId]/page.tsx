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
import { useInactiveMyRoomMutation } from "@/lib/store/api/roomApi";
import { usePlaytimeTracking } from "@/hooks/usePlaytimeTracking";

const Page = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const authState = useSelector((state: RootState) => state.auth);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isJoined, roomId, isHost, joinResponse } = useRoomContext();
  const hostUsername = joinResponse?.users?.find((user: UserInfo) => user.host)?.username as string | null;
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const hasCalledInactiveRef = useRef(false);
  
  // Playtime tracking - get sendPlaytime function to call when leaving
  const { sendPlaytime } = usePlaytimeTracking({
    roomId: roomState.roomId || roomId || null,
    isHost: isHost || false,
    enabled: isJoined && isHost,
  });
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

  // Call inactive API and send playtime when host navigates away (component unmounts)
  useEffect(() => {
    return () => {
      // Cleanup: when component unmounts (user navigates away)
      if (isHost && isJoined && !hasCalledInactiveRef.current) {
        // !commenting this down anymore we will not going to inactive the old room id because we will now create a new room id
        // hasCalledInactiveRef.current = true;
        // // Send accumulated playtime first
        sendPlaytime();
        //   // Then inactivate room
        //   inactiveMyRoomApi().catch(() => {
        //     // Silently fail if API call doesn't complete
        //   });
        // }).catch(() => {
        //   // If playtime send fails, still try to inactivate room
        //   inactiveMyRoomApi().catch(() => {});
        // });
      }
    };
  }, [isHost, isJoined, inactiveMyRoomApi, sendPlaytime]);

  // Warn user before closing tab/window when in room and call inactive API for host
  useEffect(() => {
    if (!isJoined) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Send playtime and call inactive API when host closes tab/window
      // NOTE: We MUST use fetch with keepalive: true here because:
      // 1. RTK Query mutations are async and may be cancelled when page unloads
      // 2. keepalive: true tells the browser to complete the request even after page closes
      // 3. This is the only reliable way to send requests during beforeunload
      if (isHost && !hasCalledInactiveRef.current) {
        hasCalledInactiveRef.current = true;
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = authState?.token;
        const currentRoomId = roomState.roomId || roomId;
        
        if (baseUrl && token && currentRoomId) {
          sendPlaytime();
          // Try to get accumulated seconds and send playtime
          // We'll need to use fetch here since RTK Query won't work during beforeunload
          // Note: We can't access the ref from the hook here, so we'll send a placeholder
          // The actual tracking happens in StreamPlayer/SyncPlayer, so this is a fallback

          // Send inactive room request
          // !commenting this down anymore we will not going to inactive the old room id because we will now create a new room id
          // const inactiveUrl = `${baseUrl}/api/v1/room/inactive-my-room`;
          // fetch(inactiveUrl, {
          //   method: 'PUT',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${token}`,
          //   },
          //   keepalive: true,
          //   body: JSON.stringify({}),
          // }).catch(() => {
          //   // Silently fail
          // });
        }
      }
      
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
  }, [isJoined, isHost, authState?.token, sendPlaytime]);


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
      <div ref={containerRef} className="flex flex-col md:flex-row h-screen bg-[#030712] relative overflow-hidden">
        <div
          className={`
            bg-black transition-all duration-300 relative
            ${roomState.settings.panelCollapsed 
              ? "flex-1 h-full w-full" 
              : "flex-1 h-[40vh] md:h-full w-full"
            }
          `}
        >
          <PlayerWrapper fullscreenTargetRef={containerRef} />
          {/* Flying Emoji Animations - Inside fullscreen container to work in fullscreen mode */}
          <ReactionsContainer />
        </div>
        <div
          className={`
            bg-zinc-800 overflow-hidden transition-all duration-300 ease-in-out
            ${roomState.settings.panelCollapsed 
              ? "hidden" 
              : "flex flex-col h-[60vh] md:h-full md:w-[25%] md:min-w-[320px] md:max-w-[420px] w-full z-40 md:z-auto shadow-2xl md:shadow-none md:relative"
            }
          `}
        >
          <Panel />
        </div>
      </div>
    </>
  );
};

export default Page;
