"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import {
  useInactiveMyRoomMutation,
  useUpdateRoomMutation,
} from "@/lib/store/api/roomApi";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { FaPlay, FaPause, FaCrown } from "react-icons/fa";
import { LuCheck, LuLink, LuLogOut, LuPencil } from "react-icons/lu";
import { showError, showSuccess } from "@/utils/toast";

const SettingTab = () => {
  const host = useSelector((state: RootState) => state.room.host);
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const dispatch = useDispatch();
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const [updateRoom] = useUpdateRoomMutation();

  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [roomName, setRoomName] = useState("My Party Room");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Construct room URL
  const roomUrl = roomId
    ? typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : ""
    : "";

  // Handle video play/pause (host only)
  const handlePlayPause = () => {
    if (host) {
      setIsPlaying(!isPlaying);
      // TODO: Emit socket event to control video
      console.log(isPlaying ? "Pausing video" : "Playing video");
    }
  };

  // Handle copy room link
  const handleCopyLink = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Handle rename room
  const handleRenameRoom = async () => {
    if (!roomId || !host) return;

    setIsSavingName(true);
    try {
      await updateRoom({
        id: roomId,
        body: { name: roomName },
      }).unwrap();
      setIsEditingName(false);
      showSuccess("Room name updated successfully");
    } catch (error) {
      console.error("Failed to rename room:", error);
      showError("Failed to rename room", "Please try again. Make sure you have a stable internet connection.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle leave party
  const handleLeaveParty = async () => {
    try {
      await inactiveMyRoomApi().unwrap();
    } catch (error) {
      console.error("Failed to leave room:", error);
    } finally {
      dispatch(exitRoom());
      setShowLeaveConfirm(false);
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Host Controls Section */}
      {host && (
        <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a]  rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20">
              <FaCrown className="text-yellow-400" size={16} />
            </div>
            <h3 className="text-white font-semibold text-sm font-parkinsans">
              Host Controls
            </h3>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 hover:from-rose-600/30 hover:via-pink-600/30 hover:to-fuchsia-600/30  rounded-xl transition-all duration-200 group"
          >
            {isPlaying ? (
              <>
                <FaPause
                  className="text-rose-400 group-hover:text-rose-300"
                  size={14}
                />
                <span className="text-white text-sm font-medium">
                  Pause Video
                </span>
              </>
            ) : (
              <>
                <FaPlay
                  className="text-rose-400 group-hover:text-rose-300"
                  size={14}
                />
                <span className="text-white text-sm font-medium">
                  Play Video
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Room Settings */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Rename Room */}
        <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a]  rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20">
              <LuPencil className="text-rose-400" size={16} />
            </div>
            <h3 className="text-white font-semibold text-sm font-parkinsans">
              Room Name
            </h3>
          </div>

          {isEditingName && host ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5  rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                placeholder="Enter room name"
                disabled={isSavingName}
              />
              <button
                onClick={handleRenameRoom}
                disabled={isSavingName || !roomName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingName ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setRoomName("My Party Room");
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white text-sm">{roomName}</p>
              {host && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10  text-gray-400 hover:text-rose-400 transition-all duration-200"
                >
                  <LuPencil size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Copy Room Link */}
        <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a]  rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20">
              <LuLink className="text-rose-400" size={16} />
            </div>
            <h3 className="text-white font-semibold text-sm font-parkinsans">
              Room Link
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-white/5  rounded-lg">
              <p className="text-gray-400 text-xs truncate">
                {roomUrl || "No room link available"}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            >
              {copied ? (
                <LuCheck
                  size={18}
                  className="text-green-400 transition-colors"
                />
              ) : (
                <LuLink
                  size={18}
                  className="text-gray-400 group-hover:text-pink-400 transition-colors"
                />
              )}
              {copied && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#2a2a2e] text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-10 shadow-xl animate-fade-in">
                  Link copied!
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-[#2a2a2e]"></div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Leave Party */}
        <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <LuLogOut className="text-red-400" size={16} />
            </div>
            <h3 className="text-white font-semibold text-sm font-parkinsans">
              Leave Party
            </h3>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed">
            {host
              ? "Leaving will end the party for everyone. You'll need the room ID to rejoin."
              : "You'll need the room ID to rejoin this party."}
          </p>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
          >
            Leave Party
          </button>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <LuLogOut className="text-red-400" size={20} />
              </div>
              <h3 className="text-white text-lg font-bold font-parkinsans">
                Leave Party?
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {host
                ? "Are you sure you want to leave this party? This will end the party for everyone. You'll need the room ID to rejoin."
                : "Are you sure you want to leave this party? You'll need the room ID to rejoin."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveParty}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SettingTab;
