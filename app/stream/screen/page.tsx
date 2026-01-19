"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { PageHeader } from "@/components/UI";
import { FaCheckCircle, FaShare, FaDesktop, FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { RootState } from "@/lib/store";
import { setPlaylist, setRefers, setScreenSharing } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import type { Playlist } from "@/types/storeTypes";

// Generic screen share styling
const SCREEN_SHARE_STYLE = {
  bgStyle: {
    background: "linear-gradient(to bottom right, #a855f7, #ec4899)",
  },
};

const ScreenSharePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const { setStream: setMediaStream, setScreenType } = useMediaStreamContext();
  const tToast = useTranslations("toast");
  const tStream = useTranslations("stream");
  const tCommon = useTranslations("common");

  // State management
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [isTabSelected, setIsTabSelected] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleBack = () => {
    // Stop stream if active
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setMediaStream(null);
      setScreenType(null);
      setIsStreamReady(false);
      setIsTabSelected(false);
    }
    router.push("/stream");
  };

  // Handle video element to show preview
  useEffect(() => {
    if (videoRef.current && stream) {
      // Always set the stream to the video element
      // AudioVisualizer will tap into it for audio-only mode
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Validate stream when it changes
  useEffect(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      // For audio-only mode, only check audio tracks (video tracks should be removed)
      if (audioOnly) {
        const hasAudio = audioTracks.length > 0;
        const hasVideo = videoTracks.length > 0;
        
        // If video tracks still exist, remove them
        if (hasVideo) {
          console.log("Audio only mode - removing remaining video tracks");
          videoTracks.forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });
        }
        
        if (hasAudio) {
          setIsTabSelected(true);
          setShowWarning(false);
          setIsStreamReady(true);
        } else {
          setIsTabSelected(false);
          setShowWarning(true);
          setIsStreamReady(false);
        }
        
        // Only listen to audio track ended events in audio-only mode
        const handleTrackEnded = () => {
          setStream(null);
          setMediaStream(null);
          setScreenType(null);
          setIsStreamReady(false);
          setIsTabSelected(false);
          setShowWarning(false);
        };

        audioTracks.forEach(track => {
          track.addEventListener('ended', handleTrackEnded);
        });

        return () => {
          audioTracks.forEach(track => {
            track.removeEventListener('ended', handleTrackEnded);
          });
        };
      }
      
      // For video mode, check both video and audio
      // Check if it's a tab
      // displaySurface may not be available in all browsers, so we check audio as primary indicator
      const hasAudio = audioTracks.length > 0;
      let isTab = false;
      
      if (videoTracks.length > 0) {
        try {
          const settings = videoTracks[0].getSettings();
          // displaySurface can be 'monitor', 'window', 'browser', or 'tab'
          isTab = settings.displaySurface === 'tab' || settings.displaySurface === 'browser';
        } catch (e) {
          // Fallback: if audio exists, assume it's a tab (tab sharing typically captures audio)
          isTab = hasAudio;
        }
      }
      
      // Check if audio track exists (tab sharing should have audio for proper streaming)
      if (hasAudio && isTab) {
        setIsTabSelected(true);
        setShowWarning(false);
        setIsStreamReady(true);
      } else if (hasAudio && !isTab) {
        // Has audio but might be window/screen - still allow but warn
        setIsTabSelected(true);
        setShowWarning(true);
        setIsStreamReady(true);
      } else if (!hasAudio) {
        // No audio track - likely not a tab or audio capture failed
        setIsTabSelected(false);
        setShowWarning(true);
        setIsStreamReady(false);
      } else {
        // Has video but unclear if tab - allow but warn
        setIsTabSelected(true);
        setShowWarning(true);
        setIsStreamReady(true);
      }

      // Handle track ended (user stopped sharing)
      const handleTrackEnded = () => {
        setStream(null);
        setMediaStream(null);
        setScreenType(null);
        setIsStreamReady(false);
        setIsTabSelected(false);
        setShowWarning(false);
      };

      videoTracks.forEach(track => {
        track.addEventListener('ended', handleTrackEnded);
      });
      audioTracks.forEach(track => {
        track.addEventListener('ended', handleTrackEnded);
      });

      return () => {
        videoTracks.forEach(track => {
          track.removeEventListener('ended', handleTrackEnded);
        });
        audioTracks.forEach(track => {
          track.removeEventListener('ended', handleTrackEnded);
        });
      };
    } else {
      setIsStreamReady(false);
      setIsTabSelected(false);
      setShowWarning(false);
    }
  }, [stream, audioOnly, setMediaStream]);


  const handleShareScreen = useCallback(async (overrideAudioOnly?: boolean) => {
    try {
      // Use overrideAudioOnly if provided, otherwise use current audioOnly state
      const currentAudioOnly = overrideAudioOnly !== undefined ? overrideAudioOnly : audioOnly;
      
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setMediaStream(null);
        setScreenType(null);
      }

      // Use the cross-browser helper function to capture tab stream
      const { mediaStream, screenType } = await helper.captureTabStream({
        audioOnly: currentAudioOnly,
        preferredDisplaySurface: 'tab'
      });

      if (!mediaStream) {
        // User cancelled or capture failed - silently handle
        return;
      }
      setMediaStream(mediaStream);
      setScreenType(screenType);
      setStream(mediaStream);
      const screenItem: Playlist = {
        id: mediaStream.id,
        type: "stream",
        source: "screen",
        link: tStream("screenShare"),
        selected: true, 
        onlyAudio: currentAudioOnly,
        metadata: {
          title: tStream("screenShare"),
          description: tStream("liveScreenSharingSession"),
          thumbnail: undefined,
          author: authState.user?.name || authState.user?.username || tCommon("you"),
        },
      };
      dispatch(setScreenSharing(screenItem));
      // Store in MediaStreamContext for use in room (MediaStream cannot be in Redux)
      
    } catch (err: any) {
      // Only show alert for unexpected errors, not user cancellations
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        // User cancelled or permission denied - silently handle
        console.log("Screen sharing cancelled or permission denied");
        return;
      }
      
      // For other errors, log but don't show alert (less intrusive)
      console.error("Screen sharing error:", err);
      // Only show toast for truly unexpected errors
      if (err.name !== 'NotFoundError' && err.name !== 'NotReadableError') {
        showError(tToast("screenSharingFailed"), tToast("checkPermissions"));
      }
    }
  }, [audioOnly, setMediaStream, stream]);

  const handleStartStreaming = useCallback(async () => {
    if (!stream) return;

    try {
      // Build a playlist entry for screen sharing
      const screenItem: Playlist = {
        id: stream.id,
        type: "stream",
        source: "screen",
        link: tStream("screenShare"),
        selected: true,
        onlyAudio: audioOnly,
        metadata: {
          title: tStream("screenShare"),
          description: tStream("liveScreenSharingSession"),
          thumbnail: undefined,
          author: authState.user?.name || authState.user?.username || tStream("you"),
        },
      };
      
      // Save playlist and mark refer so AuthGuard can create the room
      dispatch(setScreenSharing(screenItem));
      dispatch(
        setRefers({
          refer: true,
        })
      );

      // If not authenticated, go to login; AuthGuard will create room after login
      if (!authState.isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(`/stream/screen`)}`);
        return;
      }

      // If authenticated, AuthGuard (on /stream/screen) will see refer+playlist and create room
      setIsCreatingRoom(true);
    } catch (error) {
      console.error("Error creating room:", error);
      showError(tToast("failedToCreateRoom"), tToast("checkConnection"));
      setIsCreatingRoom(false);
    }
  }, [isStreamReady, stream, audioOnly, dispatch, router, authState.isAuthenticated, authState.user]);


  return (
    <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen">
      {/* Background Effects - Matching CTASection */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#e11d48]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#c026d3]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Emojis - Hidden on small screens */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span className="absolute top-1/4 left-[8%] text-2xl md:text-4xl animate-float opacity-50">🎬</span>
        <span className="absolute top-1/3 right-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">🍿</span>
        <span className="absolute bottom-1/3 left-[15%] text-3xl md:text-5xl animate-float opacity-30">😍</span>
        <span className="absolute top-1/2 right-[8%] text-2xl md:text-4xl animate-float-delayed opacity-40">🎉</span>
        <span className="absolute bottom-1/4 right-[20%] text-xl md:text-3xl animate-float opacity-50">❤️</span>
        <span className="absolute top-2/3 left-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">⭐</span>
        <span className="absolute bottom-1/2 right-[15%] text-2xl md:text-4xl animate-float opacity-40">🎊</span>
        <span className="absolute top-[15%] left-[25%] text-xl md:text-3xl animate-float-delayed opacity-35">🎞️</span>
        <span className="absolute bottom-[20%] left-[30%] text-2xl md:text-4xl animate-float opacity-45">🎭</span>
      </div>

      {/* Content - Above Background */}
      <div className="relative z-20 w-full h-screen flex flex-col overflow-hidden">
        <PageHeader title={tStream("screenSharePageTitle")} onBack={handleBack} logoGap="gap-8" />

        {/* Content - Scrollable area */}
        <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6 md:py-8">
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 w-full">
          {!stream ? (
            <>
              {/* Initial State - Before Preview */}
              {/* Main Action Section */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30">
                    <FaDesktop className="text-lg sm:text-xl text-white" />
                  </div>
                  <div className="flex-1 flex flex-col text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-0.5 sm:mb-1">{tStream("readyToShare")}</h2>
                    <p className="text-white/60 text-xs sm:text-sm">{tStream("clickButtonBelow")}</p>
                  </div>
                </div>
          
                {/* Share Button */}
                <button
                  onClick={() => handleShareScreen()}
                  disabled={!!stream}
                  className={`w-full px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-200 text-white ${
                    stream
                      ? "bg-zinc-700/50 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-500/30"
                  }`}
                >
                  {stream ? tStream("screenSharingActive") : tStream("shareYourScreen")}
                </button>
              </div>

              {/* Simple Steps Guide - Only show when no preview */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">{tStream("howItWorks")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {/* Step 1 */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-0 px-3 sm:px-4 md:px-5 py-4 sm:py-6 md:py-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10 transition-all duration-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 sm:mb-4">
                      1
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                        {tStream("clickScreenShareButton")}
                      </h4>
                      <p className="text-white/60 text-[10px] sm:text-xs leading-relaxed">
                        {tStream("clickShareScreenButton")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-0 px-3 sm:px-4 md:px-5 py-4 sm:py-6 md:py-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 sm:mb-4">
                      2
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                        {tStream("chooseTabToShare")}
                      </h4>
                      <p className="text-white/60 text-[10px] sm:text-xs leading-relaxed">
                        {tStream("chooseTabForBestAudio")}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-0 px-3 sm:px-4 md:px-5 py-4 sm:py-6 md:py-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-600/10 hover:via-pink-600/10 hover:to-fuchsia-600/10 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 sm:mb-4">
                      3
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                        {tStream("clickStartSharing")}
                      </h4>
                      <p className="text-white/60 text-[10px] sm:text-xs leading-relaxed">
                        {tStream("clickStartSharingDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips - Hidden on very small screens */}
              <div className="hidden sm:block p-4 sm:p-5 md:p-6 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-lg sm:rounded-xl">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5 sm:mt-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">{tStream("quickTips")}</p>
                    <div className="space-y-2 sm:space-y-2.5">
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed">{tStream("tipSelectSpecificTab")}</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed">{tStream("tipKeepTabActive")}</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed">{tStream("tipCheckPermission")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Post-Preview State - After Tab Selection */}
              {/* Preview Active Status Header - Above Video */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-purple-500/30 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">{tStream("previewActive")}</h2>
                  <p className="text-white/70 text-xs sm:text-sm">{tStream("screenShareReady")}</p>
                </div>
              </div>

              {/* Stream Preview */}
              <div className="rounded-lg sm:rounded-xl overflow-hidden bg-black animate-fade-in">
                <div className="relative aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={true}
                    playsInline
                    className={audioOnly ? "hidden" : "w-full h-full object-contain"}
                  />
                  {audioOnly && (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-900/20 to-pink-900/20">
                      <FaVolumeUp className="text-3xl sm:text-4xl md:text-5xl text-fuchsia-400/60 mb-2 sm:mb-3 md:mb-4" />
                      <div className="text-fuchsia-300 font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">{tStream("audioOnlyMode")}</div>
                      <div className="text-gray-400 text-xs sm:text-sm">{tStream("streamingAudioFromTab")}</div>
                    </div>
                  )}
                  {isStreamReady && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 border border-green-500/50 rounded-md sm:rounded-lg backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-[10px] sm:text-xs font-semibold">
                          {audioOnly ? tStream("audioReady") : tStream("ready")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Post-Preview Action Section - Below Video */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6">
                {/* Audio-only toggle */}
                <div className="flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 backdrop-blur-xl border border-purple-500/20 rounded-lg sm:rounded-xl">
                  <label className="flex items-center gap-3 sm:gap-4 cursor-pointer group">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {audioOnly ? (
                        <FaVolumeMute className="text-base sm:text-lg text-fuchsia-400 transition-colors" />
                      ) : (
                        <FaVolumeUp className="text-base sm:text-lg text-purple-400 transition-colors" />
                      )}
                      <span className="text-xs sm:text-sm font-medium text-white">
                        {audioOnly ? tStream("audioOnly") : tStream("videoPlusAudio")}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={audioOnly}
                        onChange={async (e) => {
                          const newAudioOnly = e.target.checked;
                          
                          if (stream) {
                            if (newAudioOnly) {
                              // Enable audio-only: remove video tracks
                              setAudioOnly(true);
                              const videoTracks = stream.getVideoTracks();
                              const audioTracks = stream.getAudioTracks();
                              if (videoTracks.length > 0) {
                                const audioOnlyStream = new MediaStream(audioTracks);
                                videoTracks.forEach(track => {
                                  track.stop();
                                  stream.removeTrack(track);
                                });
                                setStream(audioOnlyStream);
                                setMediaStream(audioOnlyStream);
                              } else {
                                setMediaStream(stream);
                              }
                            } else {
                              // Disable audio-only: need to re-capture with video
                              // Keep the current stream active while re-capturing
                              try {
                                const {mediaStream: newStream, screenType: newScreenType} = await helper.captureTabStream({
                                  audioOnly: false,
                                  preferredDisplaySurface: 'tab'
                                });
                                
                                if (newStream) {
                                  // Successfully captured new stream with video
                                  // Stop old stream tracks
                                  const oldStream = stream;
                                  oldStream.getTracks().forEach(track => track.stop());
                                  
                                  // Set new stream
                                  setStream(newStream);
                                  setMediaStream(newStream);
                                  setScreenType(newScreenType);
                                  setAudioOnly(false);
                                  // State will be validated by useEffect
                                } else {
                                  // User cancelled - keep current stream and audio-only mode
                                  console.log("Re-capture cancelled, keeping audio-only mode");
                                  // audioOnly state stays true, stream stays active
                                }
                              } catch (error: any) {
                                console.error("Error re-capturing stream with video:", error);
                                // If re-capture fails, keep current stream active
                                // Don't stop the stream or change state
                                if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
                                  // User cancelled or permission denied - silently keep current state
                                  console.log("Re-capture cancelled or denied, keeping audio-only mode");
                                } else {
                                  // Other errors - show message but keep stream active
                                  showError(tToast("failedToReenableVideo"), tToast("audioOnlyActive"));
                                }
                                // Keep audioOnly as true, stream stays active
                              }
                            }
                          } else {
                            // No stream yet, just update state
                            setAudioOnly(newAudioOnly);
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 sm:w-14 sm:h-7 rounded-full transition-all duration-300 ease-in-out ${
                        audioOnly 
                          ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600' 
                          : 'bg-gradient-to-r from-purple-600 to-fuchsia-600'
                      }`}>
                        <div className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out ${
                          audioOnly ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Warning */}
                {showWarning && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md sm:rounded-lg backdrop-blur-sm">
                    <FaExclamationTriangle className="text-yellow-400 flex-shrink-0 mt-0.5 text-sm sm:text-base" />
                    <div className="flex-1">
                      <p className="text-yellow-300 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">{tStream("tabSelectionRequired")}</p>
                      <p className="text-yellow-200/80 text-[10px] sm:text-xs leading-relaxed">
                        {!isTabSelected
                          ? tStream("selectSpecificTabForAudio")
                          : tStream("selectTabForBestAudio")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Start Sharing Button - Always show when stream exists */}
                {stream && (
                  <div className="text-center">
                    <button
                      onClick={handleStartStreaming}
                      disabled={isCreatingRoom}
                      className={`w-full px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-200 text-white inline-flex items-center justify-center gap-2 sm:gap-3 ${
                        isCreatingRoom
                          ? "bg-zinc-700/50 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-500/30"
                      }`}
                    >
                      {isCreatingRoom && <ImSpinner2 className="animate-spin text-sm sm:text-base" />}
                      {isCreatingRoom ? tStream("creatingRoom") : tStream("startSharing")}
                    </button>
                    <p className="text-white/60 text-xs sm:text-sm mt-2 sm:mt-3">
                      {tStream("roomWillBeCreated")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenSharePage;
