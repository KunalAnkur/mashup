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
import { setFocused, updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { useFileContext } from "@/context/FileContext";
import ProductBottomSheet from "@/components/Product/ProductBottomSheet";
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

  // Generate room URL (include host query so social previews can render host-specific titles)
  const roomUrl = roomId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}${
        hostUsername ? `?host=${encodeURIComponent(hostUsername)}` : ""
      }`
    : "";

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

  // Warn before tab close while user is in room
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

  // * This code block is for cleaning up the orphaned screen share data from the playlist
  const { stream } = useMediaStreamContext();
  useEffect(() => {
    if (!stream && isHost) {
      const playlist = roomState.playlist;
      const hasScreenShare = playlist.some((item) => item.source === "screen");
      if (hasScreenShare) {
        console.log("Host has no stream - showing modal to prompt screen share");
        const newPlaylist = playlist.filter((item) => item.source !== "screen").map((item, index) => ({ ...item, selected: index === 0 }));
        dispatch(updateRoomInfo({ playlist: newPlaylist }));
        // * We will not going to update in the database so we can keep those data in case we require to debugg it
        // updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: newPlaylist } }).unwrap();  
      }
    }
  }, [stream, isHost, roomState.playlist, dispatch, roomState.roomId]);

  /**
   * * The below code block is responsible for cleaning i.e when there is a playlist in the database for local file streaming
   * * existed but it is not saved at all in the local storage access. So in that case because there is no reference of the actual files 
   * * which are stored then we gonna remove those all unneccessary files present in the playlist tabs
   * 
   * !The above assumption was wrong because while creating the room for screenshare the old file data was already stored in 
   * !playlist state so i just need to clean that up before creating a new room for screensharing so anymore below code block
   * !we will going to comment it out
   * 
   * * [Update]: Bringing this bottom code block again because it is usefull during the time When user did not given a permission of file editing
   * * so in that case when user reload on room page. The empty orphaned playlist appears which need to be cleaned
   */
  
  const { files, isInitialFilesLoaded } = useFileContext()
  useEffect(() => {
    if (!isHost || !isInitialFilesLoaded) return;
    console.log("------- This is file stream checker -----");
    const playlist = roomState.playlist;
    const fileContents = playlist.filter(content => content.source === 'file');
    if (!fileContents.length) return;
    // * This is basically a subset this prove whether all the file content are accessible in local storage or not.
    // const isAllPlaylistFileSaved = fileContents.every(content => files.some(file => file.id === content.id));
    const savedFileIds = new Set(files.map((file) => file.id));
    const isAllPlaylistFileSaved = fileContents.every((content) => savedFileIds.has(content.id));
    console.log('FileContext ===== Files & FilesContents ======', { files, fileContents, isAllPlaylistFileSaved })
    if (!isAllPlaylistFileSaved) {
      const existedFileContents = playlist.filter(content => (content.source === 'file' && savedFileIds.has(content.id)));
      const restContents = playlist.filter(content => content.source !== 'file');
      const newPlaylist = [...restContents, ...existedFileContents].map((content, index) => ({
          ...content,
          selected: index === 0
      }));
      dispatch(updateRoomInfo({ playlist: newPlaylist }));
    }

  }, [files, isHost, isInitialFilesLoaded, roomState.playlist, dispatch])

  const mobilePanelHeightClass = roomState.settings.bottomSheet
    ? "h-[40vh]"
    : roomState.settings.playerActive
      ? "h-[75vh]"
      : "h-[60vh]";

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
      <div ref={containerRef} className="relative flex h-screen flex-col overflow-hidden bg-[#09090c] md:flex-row">
        {/* Global room background vibe (player + panel) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_40%,transparent_100%)]" />

          <svg
            className="absolute inset-0 opacity-[0.035]"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <filter id="room-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#room-noise)" />
          </svg>

          <div className="absolute -top-20 -left-16 h-[360px] w-[360px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] animate-pulse-glow" />
          <div
            className="absolute -bottom-16 -right-10 h-[300px] w-[300px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(236,72,153,0.13)_0%,transparent_70%)] animate-pulse-glow"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            className="absolute bottom-[10%] left-[28%] h-[240px] w-[240px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(59,130,246,0.10)_0%,transparent_70%)] animate-pulse-glow"
            style={{ animationDelay: "2.1s" }}
          />
        </div>

        <div
          className={`
            relative z-10 bg-transparent transition-all duration-300
            ${roomState.settings.panelCollapsed 
              ? "flex-1 h-full w-full" 
              : "flex-1 h-[40vh] md:h-full w-full"
            }
          `}
        >
          <PlayerWrapper fullscreenTargetRef={containerRef} />
          {/* Flying Emoji Animations - Inside fullscreen container to work in fullscreen mode */}
          <ReactionsContainer />
          <ProductBottomSheet />
        </div>
        <div
          className={`
            z-10 overflow-hidden bg-transparent transition-all duration-300 ease-in-out
            ${roomState.settings.panelCollapsed 
              ? "hidden" 
            : `flex flex-col ${mobilePanelHeightClass} md:h-full md:w-[25%] md:min-w-[320px] md:max-w-[420px] w-full z-40 md:z-auto shadow-2xl md:shadow-none md:relative`
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
