"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import ReactionsContainer from "@/components/Panel/ReactionsContainer";
import { useRoomContext } from "@/context/RoomContext";

const Page = () => {
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isJoined, roomId } = useRoomContext();
  
  // Chat warning modal state
  const [showChatWarning, setShowChatWarning] = useState(false);
  const [chatWarningAccepted, setChatWarningAccepted] = useState(false);
  const warningShownRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);

  // Reset warning when room changes
  useEffect(() => {
    console.log('[RoomPage] Room ID check:', { roomId, currentRoomId: roomIdRef.current });
    if (roomId && roomId !== roomIdRef.current) {
      console.log('[RoomPage] Room changed, resetting warning state');
      roomIdRef.current = roomId;
      warningShownRef.current = false;
      setShowChatWarning(false);
      setChatWarningAccepted(false);
    }
  }, [roomId]);

  // Show warning modal when user joins room (show every time for new room)
  useEffect(() => {
    console.log('[RoomPage] ===== MODAL CHECK START =====');
    console.log('[RoomPage] isJoined:', isJoined, 'roomId:', roomId);
    
    if (typeof window === 'undefined') {
      console.log('[RoomPage] Window undefined, returning');
      return;
    }
    
    console.log('[RoomPage] State values:', {
      isJoined,
      warningShown: warningShownRef.current,
      roomId,
      showChatWarning,
      currentRoomId: roomIdRef.current
    });
    
    // Show modal when user joins room and hasn't shown warning for this room yet
    if (isJoined && roomId && roomId === roomIdRef.current) {
      console.log('[RoomPage] ✓ Room is joined and matches current room');
      
      if (warningShownRef.current) {
        console.log('[RoomPage] ✗ Warning already shown for this room, NOT showing modal');
        setShowChatWarning(false);
      } else {
        console.log('[RoomPage] ✓✓✓ ALL CONDITIONS MET! Will show modal in 1 second ✓✓✓');
        // Small delay to ensure everything is loaded
        const timer = setTimeout(() => {
          console.log('[RoomPage] ⏰ TIMER FIRED - Setting showChatWarning to TRUE');
          setShowChatWarning(true);
          warningShownRef.current = true;
          console.log('[RoomPage] Modal state updated, showChatWarning:', true);
        }, 1000);
        
        return () => {
          console.log('[RoomPage] Cleaning up timer');
          clearTimeout(timer);
        };
      }
    } else {
      console.log('[RoomPage] ✗ Room not joined yet or room ID mismatch (isJoined:', isJoined, 'roomId:', roomId, 'currentRoomId:', roomIdRef.current, ')');
      setShowChatWarning(false);
    }
    
    console.log('[RoomPage] ===== MODAL CHECK END =====');
  }, [isJoined, roomId]);

  // Handle accepting the warning
  const handleAcceptChatWarning = () => {
    console.log('[RoomPage] handleAcceptChatWarning called, chatWarningAccepted:', chatWarningAccepted);
    if (!chatWarningAccepted) {
      console.log('[RoomPage] Checkbox not checked, returning');
      return;
    }
    
    // Just close the modal - we don't need localStorage since we show it per room
    setShowChatWarning(false);
    warningShownRef.current = true;
    console.log('[RoomPage] Modal closed, warningShownRef set to true');
  };

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

  // Render warning modal via portal
  console.log('[RoomPage] Render check - showChatWarning:', showChatWarning, 'window:', typeof window !== 'undefined');
  
  const modalContent = showChatWarning && typeof window !== 'undefined' ? (
    createPortal(
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ position: 'fixed', zIndex: 99999 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-white text-xl md:text-2xl font-bold text-center mb-4 font-parkinsans">
            Chat Guidelines
          </h3>

          {/* Message */}
          <p className="text-white/80 text-sm md:text-base text-center mb-6 leading-relaxed">
            I promise to talk nice. Not illegal on chat.
          </p>

          {/* Checkbox */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 backdrop-blur-xl border border-zinc-600/15 rounded-xl">
            <input
              type="checkbox"
              id="chatWarningCheckbox"
              checked={chatWarningAccepted}
              onChange={(e) => setChatWarningAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-600/30 bg-zinc-800/50 text-purple-600 focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0 cursor-pointer"
            />
            <label
              htmlFor="chatWarningCheckbox"
              className="text-white/90 text-sm md:text-base cursor-pointer flex-1"
            >
              I understand and agree to follow the chat guidelines
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleAcceptChatWarning}
            disabled={!chatWarningAccepted}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            Continue Watching
          </button>
        </motion.div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {/* Chat Warning Modal */}
      {modalContent}
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
