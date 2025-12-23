"use client";
import { Button } from "../UI";
import { useDispatch, useSelector } from "react-redux";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import type { RootState } from "@/lib/store";
import { FaYoutube, FaVimeo, FaTwitch, FaFileVideo } from "react-icons/fa";
import { MdOndemandVideo } from "react-icons/md";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useRouter } from "next/navigation";
import { Playlist } from "@/types/storeTypes";
const UrlSelection = () => {
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);
  const roomState = useSelector((state: RootState) => state.room);
  
  const playlist = roomState.playlist || [];
  const activeContent = playlist.find((item) => item.selected) as Playlist;
  // const [sourceUrl, setSourceUrl] = useState<string[]>([]);
  const [sourceUrlInput, setSourceUrlInput] = useState<string>("");
  // useEffect(() => {
  //   if (activeContent.link) {
  //     setSourceUrl([activeContent.link]);
  //   }
  // }, [activeContent.link]);

  const [isEnterDisabled, setEnterDisabled] = useState<boolean>(
    !ReactPlayer.canPlay(activeContent.link)
  );
  const dispatch = useDispatch();

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setSourceUrl((prev) => Array.from(new Set([...prev, e.target.value])));
    setSourceUrlInput(e.target.value);
    setEnterDisabled(!ReactPlayer.canPlay(e.target.value));
  };

  const handleOnEnterRoom = async () => {
    // setSourceUrl([sourceUrlInput]);
    
    dispatch(setPlaylist(playlist));
    dispatch(
      setRefers({
        refer: true,
      })
    );
    if (!authState.isAuthenticated) {
      router.push("/login");
    }
    // If authenticated, AuthGuard will handle room creation and navigation
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#18181b] px-4 py-6">
      <div className="w-full max-w-md flex flex-col items-center gap-6 sm:gap-8">
        {/* Back button */}

        <div className="gap-3 sm:gap-4 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 text-center font-parkinsans">
            Enter Source URL
          </h2>
          <p className="text-gray-300 text-center mb-2 sm:mb-4 text-xs sm:text-sm font-medium px-4">
            Paste a video URL to start your party.
          </p>
        </div>
        <div className="flex flex-col md:flex-row  items-center md:items-start  w-full gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Paste your source link here"
            value={sourceUrlInput}
            onChange={handleOnSourceUrlChange}
            className="flex-1 rounded-lg w-full bg-zinc-800 text-gray-100 text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
          <Button
            onClick={handleOnEnterRoom}
            className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:bg-gradient-to-r hover:from-rose-900 hover:via-pink-700 hover:to-fuchsia-600 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition
                        disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed"
            name="Enter"
            disabled={isEnterDisabled}
          >
            {/* Enter */}
          </Button>
        </div>

        {/* Supported sources */}
        <div className="flex flex-col items-center gap-2 mt-2 sm:mt-4">
          <span className="text-xs text-gray-400 mb-1">Supported sources:</span>
          <div className="flex gap-4 sm:gap-6 justify-center flex-wrap">
            {[
              {
                icon: (
                  <FaYoutube className="text-xl sm:text-2xl text-red-500" />
                ),
                name: "YouTube",
              },
              {
                icon: (
                  <MdOndemandVideo className="text-xl sm:text-2xl text-green-400" />
                ),
                name: "HLS",
              },
              {
                icon: (
                  <FaFileVideo className="text-xl sm:text-2xl text-blue-400" />
                ),
                name: "FLV",
              },
              {
                icon: <FaVimeo className="text-xl sm:text-2xl text-blue-500" />,
                name: "Vimeo",
              },
              {
                icon: (
                  <FaTwitch className="text-xl sm:text-2xl text-purple-500" />
                ),
                name: "Twitch",
              },
            ].map((source, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 rounded-full bg-zinc-800">
                  {source.icon}
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {source.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleBack}
          className="self-stretch w-full rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-gray-100 text-sm sm:text-base px-4 py-2.5 sm:py-3 hover:bg-red-800 transition-colors"
          name="Cancel"
        >
          {/* <FaArrowLeft className="text-sm" /> */}
          {/* <span className="text-sm font-medium">Cancel</span> */}
        </Button>
      </div>
    </div>
  );
};

export default UrlSelection;
