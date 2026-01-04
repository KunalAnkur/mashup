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
import { LuCheck, LuLink, LuLogOut, LuPencil, LuUser, LuMail } from "react-icons/lu";
import { showError, showSuccess } from "@/utils/toast";
import { useRoomContext } from "@/context/RoomContext";
import { validateUsername } from "@/utils/validation";

const SettingTab = () => {
  const host = useSelector((state: RootState) => state.room.host);
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const dispatch = useDispatch();
  const { updateUserName } = useRoomContext();
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

  const handleUpdateProfile = async () => {
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
      // if (socket && (roomId || roomIdFromContext)) {
      //   const currentRoomId = roomId || roomIdFromContext;
      //   socket.emit(SocketEvent.USERNAME_UPDATED, {
      //     username: result.data?.username || username.trim(),
      //     name: result.data?.name || name.trim(),
      //     profile: result.data?.picture || authState.user?.profile,
      //   });
      // }

      await updateUserName(result.data?.username || username.trim(), result.data?.name || name.trim(), result.data?.picture || authState.user?.profile || "");

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
  };

  return (
    <div className="flex flex-col h-full w-full gap-3 md:gap-4 overflow-x-hidden">
    

      {/* Room Settings */}
      <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto overflow-x-hidden pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Profile Update Section */}
        <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-xl p-3 md:p-4 space-y-3 md:space-y-4 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30">
              <LuUser className="text-purple-400" size={14} />
            </div>
            <h3 className="text-white font-semibold text-xs md:text-sm font-parkinsans">
              Profile Settings
            </h3>
          </div>

          {/* Profile Fields */}
          <div className="space-y-2.5 md:space-y-3">
            {/* Name Field */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[10px] md:text-xs text-white/70 font-medium">Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border border-zinc-600/15 rounded-lg text-white text-xs md:text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                  placeholder="Enter your name"
                  disabled={isUpdatingProfile}
                />
              ) : (
                <div className="px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border border-zinc-600/15 rounded-lg">
                  <p className="text-white text-xs md:text-sm">{name || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[10px] md:text-xs text-white/70 font-medium">Username</label>
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
                    className={`w-full px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border rounded-lg text-white text-xs md:text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 transition-colors ${
                      usernameError 
                        ? "focus:ring-red-500/50 border-red-500/30" 
                        : "focus:ring-purple-500/50 border-zinc-600/15"
                    }`}
                    placeholder="Enter your username (letters, numbers, underscores only)"
                    disabled={isUpdatingProfile}
                  />
                  {usernameError && (
                    <p className="text-red-400 text-[10px] md:text-xs font-medium px-1">{usernameError}</p>
                  )}
                  {!usernameError && username.trim() && (
                    <p className="text-white/50 text-[10px] md:text-xs px-1">Username can only contain letters, numbers, and underscores</p>
                  )}
                </div>
              ) : (
                <div className="px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border border-zinc-600/15 rounded-lg">
                  <p className="text-white text-xs md:text-sm">{username || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Email Field - Read Only */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[10px] md:text-xs text-white/70 font-medium flex items-center gap-1">
                <LuMail size={10} />
                Email Address
              </label>
              <div className="px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border border-zinc-600/15 rounded-lg min-w-0">
                <p className="text-white text-xs md:text-sm truncate" title={email || "Not set"}>
                  {email || "Not set"}
                </p>
                <p className="text-white/50 text-[10px] md:text-xs mt-1">Email cannot be changed</p>
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
                className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-xs md:text-sm font-medium rounded-lg transition-all duration-200"
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile || !name.trim() || !username.trim() || !!usernameError}
                className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs md:text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-purple-400 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2"
            >
              <LuPencil size={12} />
              Edit Profile
            </button>
          )}
        </div>

       

        {/* Copy Room Link */}
        <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-xl p-3 md:p-4 space-y-2.5 md:space-y-3 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30">
              <LuLink className="text-purple-400" size={14} />
            </div>
            <h3 className="text-white font-semibold text-xs md:text-sm font-parkinsans">
              Room Link
            </h3>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-black/10 backdrop-blur-xl border border-zinc-600/15 rounded-lg">
              <p className="text-white/70 text-[10px] md:text-xs truncate">
                {roomUrl || "No room link available"}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="relative p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 transition-all duration-200 group z-40"
            >
              {copied ? (
                <LuCheck
                  size={18}
                  className="text-green-400 transition-colors"
                />
              ) : (
                <LuLink
                  size={18}
                  className="text-white/70 group-hover:text-white transition-colors"
                />
              )}
              {copied && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 text-green-400 text-xs rounded-lg whitespace-nowrap pointer-events-none z-[110] shadow-xl animate-fade-in">
                  Link copied!
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-zinc-800/15"></div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Leave Party */}
        <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-xl p-3 md:p-4 space-y-2.5 md:space-y-3 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30">
              <LuLogOut className="text-red-400" size={14} />
            </div>
            <h3 className="text-white font-semibold text-xs md:text-sm font-parkinsans">
              Leave Party
            </h3>
          </div>

          <p className="text-white/70 text-[10px] md:text-xs leading-relaxed">
            {host
              ? "Leaving will end the party for everyone. You'll need the room ID to rejoin."
              : "You'll need the room ID to rejoin this party."}
          </p>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
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
