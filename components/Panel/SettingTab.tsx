"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import {
  useInactiveMyRoomMutation,
  useUpdateRoomMutation,
} from "@/lib/store/api/roomApi";
import { useUpdateProfileMutation } from "@/lib/store/api/userApi";
import { exitRoom } from "@/lib/store/slices/roomSlice";
import { updateProfile as updateProfileAction } from "@/lib/store/slices/authSlice";
import { FaPlay, FaPause, FaCrown } from "react-icons/fa";
import { LuCheck, LuLink, LuLogOut, LuPencil, LuUser, LuMail } from "react-icons/lu";
import { showError, showSuccess } from "@/utils/toast";
import { useSocket } from "@/context/SocketContext";
import { useRoomContext } from "@/context/RoomContext";
import { SocketEvent } from "@/types/socketEvents";
import { validateUsername } from "@/utils/validation";

const SettingTab = () => {
  const host = useSelector((state: RootState) => state.room.host);
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { roomId: roomIdFromContext } = useRoomContext();
  const [inactiveMyRoomApi] = useInactiveMyRoomMutation();
  const [updateRoom] = useUpdateRoomMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();

  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [roomName, setRoomName] = useState("My Party Room");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Profile update states
  const authState = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState<string>(authState.user?.name || "");
  const [username, setUsername] = useState<string>(authState.user?.username || "");
  const [email, setEmail] = useState<string>(authState.user?.email || "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [usernameError, setUsernameError] = useState<string>("");

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
    

      {/* Room Settings */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Profile Update Section */}
        <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20">
              <LuUser className="text-rose-400" size={16} />
            </div>
            <h3 className="text-white font-semibold text-sm font-parkinsans">
              Profile Settings
            </h3>
          </div>

          {/* Profile Fields */}
          <div className="space-y-3">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors"
                  placeholder="Enter your name"
                  disabled={isUpdatingProfile}
                />
              ) : (
                <div className="px-3 py-2 bg-white/5 rounded-lg">
                  <p className="text-white text-sm">{name || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Username</label>
              {isEditingProfile ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const newUsername = e.target.value;
                      setUsername(newUsername);
                      
                      // Real-time validation
                      if (newUsername.trim()) {
                        const validation = validateUsername(newUsername);
                        if (!validation.valid) {
                          setUsernameError(validation.error || "");
                        } else {
                          setUsernameError("");
                        }
                      } else {
                        setUsernameError("");
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white/5 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                      usernameError 
                        ? "focus:ring-red-500/50 border border-red-500/30" 
                        : "focus:ring-rose-500/50"
                    }`}
                    placeholder="Enter your username (letters, numbers, underscores only)"
                    disabled={isUpdatingProfile}
                  />
                  {usernameError && (
                    <p className="text-red-400 text-xs font-medium px-1">{usernameError}</p>
                  )}
                  {!usernameError && username.trim() && (
                    <p className="text-gray-500 text-xs px-1">Username can only contain letters, numbers, and underscores</p>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/5 rounded-lg">
                  <p className="text-white text-sm">{username || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Email Field - Read Only */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <LuMail size={12} />
                Email Address
              </label>
              <div className="px-3 py-2 bg-white/5 rounded-lg min-w-0">
                <p className="text-white text-sm truncate" title={email || "Not set"}>
                  {email || "Not set"}
                </p>
                <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditingProfile ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  // Reset to original values
                  setName(authState.user?.name || "");
                  setUsername(authState.user?.username || "");
                  setEmail(authState.user?.email || "");
                  setUsernameError("");
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!authState.user?.id) {
                    showError("Error", "User not found. Please log in again.");
                    return;
                  }

                  if (!name.trim() || !username.trim()) {
                    showError("Validation error", "Please fill in name and username.");
                    return;
                  }

                  // Validate username format
                  const usernameValidation = validateUsername(username);
                  if (!usernameValidation.valid) {
                    setUsernameError(usernameValidation.error || "");
                    showError("Invalid username", usernameValidation.error || "Please enter a valid username.");
                    return;
                  }

                  // Clear any previous errors
                  setUsernameError("");

                  try {
                    const result = await updateProfile({
                      id: authState.user.id,
                      name: name.trim(),
                      username: username.trim(),
                    }).unwrap();

                    // Update Redux state with new user data
                    if (result.data) {
                      dispatch(updateProfileAction({
                        name: result.data.name,
                        username: result.data.username,
                      }));
                    }

                    // Emit username update to socket so all users in the room see the updated username
                    if (socket && (roomId || roomIdFromContext)) {
                      const currentRoomId = roomId || roomIdFromContext;
                      socket.emit(SocketEvent.USERNAME_UPDATED, {
                        username: result.data?.username || username.trim(),
                        name: result.data?.name || name.trim(),
                        profile: result.data?.profile || authState.user?.profile,
                      });
                    }

                    showSuccess("Profile updated successfully");
                    setIsEditingProfile(false);
                  } catch (error: any) {
                    console.error("Failed to update profile:", error);
                    const errorMessage = error?.data?.message || error?.message || "Failed to update profile";
                    
                    // Check if it's a username already exists error
                    if (errorMessage.toLowerCase().includes("username already exists") || 
                        errorMessage.toLowerCase().includes("already exists")) {
                      setUsernameError("This username is already taken. Please choose a different one.");
                    }
                    
                    showError("Update failed", errorMessage);
                  }
                }}
                disabled={isUpdatingProfile || !name.trim() || !username.trim() || !!usernameError}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full px-4 py-2 bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 hover:from-rose-600/30 hover:via-pink-600/30 hover:to-fuchsia-600/30 text-rose-400 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LuPencil size={14} />
              Edit Profile
            </button>
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
