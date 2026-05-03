"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { EntryPageHeader, Input } from "@/components/UI";
import { FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { RootState } from "@/lib/store";
import { setRefers, setScreenSharing, updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import type { Playlist } from "@/types/storeTypes";
import {
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appFlexibleViewportPageClass,
  appScrollbarHideClass,
  appSectionTitleTextClass,
  appStreamScreenAudioOnlyStateClass,
  appStreamScreenHeroSurfaceClass,
  appStreamScreenInfoSurfaceClass,
  appStreamScreenIntroClusterClass,
  appStreamScreenIntroCopyClass,
  appStreamScreenIntroWidthClass,
  appStreamScreenOpenSectionClass,
  appStreamScreenPreviewFrameClass,
  appStreamScreenPreviewStatusClass,
  appStreamScreenPrimaryButtonClass,
  appStreamScreenSupportCopyClass,
  appStreamScreenStepBadgeClass,
  appStreamScreenStepCardClass,
  appStreamScreenToggleSurfaceClass,
  appStreamScreenWarningSurfaceClass,
} from "@/components/UI/classTokens";

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
  const contentScrollRef = useRef<HTMLDivElement>(null);

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
        } catch {
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
          description: screenType ? `${screenType}-${tStream("liveScreenSharingSession")}` : tStream("liveScreenSharingSession"),
          thumbnail: undefined,
          author: authState.user?.name || authState.user?.username || tCommon("you"),
        },
      };
      dispatch(setScreenSharing(screenItem));
      // Store in MediaStreamContext for use in room (MediaStream cannot be in Redux)
      
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : undefined;
      // Only show alert for unexpected errors, not user cancellations
      if (errorName === 'NotAllowedError' || errorName === 'AbortError') {
        // User cancelled or permission denied - silently handle
        console.log("Screen sharing cancelled or permission denied");
        return;
      }
      
      // For other errors, log but don't show alert (less intrusive)
      console.error("Screen sharing error:", err);
      // Only show toast for truly unexpected errors
      if (errorName !== 'NotFoundError' && errorName !== 'NotReadableError') {
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
      
      // * Calling this for cleaning up the playlist so that only sceen sharing object
      dispatch(updateRoomInfo({ playlist: [] }));
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

  useEffect(() => {
    const handleGlobalWheel = (event: WheelEvent) => {
      const scrollContainer = contentScrollRef.current;
      if (!scrollContainer || event.deltaY === 0) return;

      const target = event.target as Node | null;
      if (target && scrollContainer.contains(target)) {
        return;
      }

      const canScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
      if (!canScroll) return;

      event.preventDefault();
      scrollContainer.scrollTop += event.deltaY * 1.35;
    };

    window.addEventListener("wheel", handleGlobalWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleGlobalWheel);
    };
  }, []);


  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title={tStream("screenSharePageTitle")} onBack={handleBack} fixed />

        {/* Content - Scrollable area */}
        <div
          ref={contentScrollRef}
          className={`flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden ${appScrollbarHideClass} ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <div className="flex w-full flex-col gap-4 sm:gap-5 md:gap-6">
                {!stream ? (
                  <>
                    {/* Initial State - Before Preview */}
                    {/* Main Action Section */}
                    <div className={appStreamScreenOpenSectionClass}>
                      <div className={appStreamScreenIntroClusterClass}>
                        <div className={appStreamScreenIntroCopyClass}>
                          <h2 className="mb-1 text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
                            {tStream("readyToShare")}
                          </h2>
                          <p className={appStreamScreenSupportCopyClass}>
                            {tStream("clickButtonBelow")}
                          </p>
                        </div>
                      </div>
          
                      {/* Share Button */}
                      <div className={appStreamScreenIntroWidthClass}>
                        <button
                          onClick={() => handleShareScreen()}
                          disabled={!!stream}
                          className={`${
                            stream
                              ? "cursor-not-allowed bg-zinc-700/50 opacity-50"
                              : appStreamScreenPrimaryButtonClass
                          }`}
                        >
                          {stream ? tStream("screenSharingActive") : tStream("shareYourScreen")}
                        </button>
                      </div>
                    </div>

                    {/* Simple Steps Guide - Only show when no preview */}
                    <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
                      <h3 className={`${appSectionTitleTextClass} text-center text-lg sm:text-xl md:text-2xl`}>{tStream("howItWorks")}</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6">
                  {/* Step 1 */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`}>
                    <div className={appStreamScreenStepBadgeClass}>
                      1
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-white sm:mb-2 sm:text-base">
                        {tStream("clickScreenShareButton")}
                      </h4>
                      <p className={appStreamScreenSupportCopyClass}>
                        {tStream("clickShareScreenButton")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`} style={{ animationDelay: '0.2s' }}>
                    <div className={appStreamScreenStepBadgeClass}>
                      2
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-white sm:mb-2 sm:text-base">
                        {tStream("chooseTabToShare")}
                      </h4>
                      <p className={appStreamScreenSupportCopyClass}>
                        {tStream("chooseTabForBestAudio")}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`} style={{ animationDelay: '0.4s' }}>
                    <div className={appStreamScreenStepBadgeClass}>
                      3
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-white sm:mb-2 sm:text-base">
                        {tStream("clickStartSharing")}
                      </h4>
                      <p className={appStreamScreenSupportCopyClass}>
                        {tStream("clickStartSharingDescription")}
                      </p>
                    </div>
                  </div>
                      </div>
                    </div>

              {/* Quick Tips - Hidden on very small screens */}
                    <div className={`hidden p-4 sm:block sm:p-5 md:p-6 ${appStreamScreenInfoSurfaceClass}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5 sm:mt-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(168,85,247,0.12),rgba(244,63,94,0.14))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-8 sm:w-8">
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
                    <p className="mb-2 text-xs font-semibold tracking-tight text-white sm:mb-3 sm:text-sm">{tStream("quickTips")}</p>
                    <div className="space-y-2 sm:space-y-2.5">
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-300 sm:h-1.5 sm:w-1.5"></div>
                        <p className={appStreamScreenSupportCopyClass}>{tStream("tipSelectSpecificTab")}</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-violet-300 sm:h-1.5 sm:w-1.5"></div>
                        <p className={appStreamScreenSupportCopyClass}>{tStream("tipKeepTabActive")}</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-rose-300 sm:h-1.5 sm:w-1.5"></div>
                        <p className={appStreamScreenSupportCopyClass}>{tStream("tipCheckPermission")}</p>
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
              <div className={`flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 md:gap-6 md:p-6 ${appStreamScreenPreviewStatusClass}`}>
                <div className="text-center">
                  <h2 className="mb-1 text-lg font-semibold tracking-tight text-white sm:mb-2 sm:text-xl md:text-2xl">{tStream("previewActive")}</h2>
                  <p className={appStreamScreenSupportCopyClass}>{tStream("screenShareReady")}</p>
                </div>
              </div>

              {/* Stream Preview */}
              <div className={`${appStreamScreenPreviewFrameClass} animate-fade-in`}>
                <div className="relative aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={true}
                    playsInline
                    className={audioOnly ? "hidden" : "w-full h-full object-contain"}
                  />
                  {audioOnly && (
                    <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${appStreamScreenAudioOnlyStateClass}`}>
                      <FaVolumeUp className="text-3xl sm:text-4xl md:text-5xl text-fuchsia-400/60 mb-2 sm:mb-3 md:mb-4" />
                      <div className="mb-0.5 text-sm font-semibold text-fuchsia-200 sm:mb-1 sm:text-base">{tStream("audioOnlyMode")}</div>
                      <div className={appStreamScreenSupportCopyClass}>{tStream("streamingAudioFromTab")}</div>
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
              <div className={`flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 md:gap-6 md:p-6 ${appStreamScreenHeroSurfaceClass}`}>
                {/* Audio-only toggle */}
                <div className={`flex items-center justify-center p-3 sm:p-4 ${appStreamScreenToggleSurfaceClass}`}>
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
                      <Input
                        variant="raw"
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
                              } catch (error: unknown) {
                                const errorName = error instanceof Error ? error.name : undefined;
                                console.error("Error re-capturing stream with video:", error);
                                // If re-capture fails, keep current stream active
                                // Don't stop the stream or change state
                                if (errorName === 'NotAllowedError' || errorName === 'AbortError') {
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
                  <div className={`flex items-start gap-2 p-3 sm:gap-3 sm:p-4 ${appStreamScreenWarningSurfaceClass}`}>
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
                      className={`${
                        isCreatingRoom
                          ? "bg-zinc-700/50 cursor-not-allowed opacity-50"
                          : appStreamScreenPrimaryButtonClass
                      }`}
                    >
                      {isCreatingRoom && <ImSpinner2 className="animate-spin text-sm sm:text-base" />}
                      {isCreatingRoom ? tStream("creatingRoom") : tStream("startSharing")}
                    </button>
                    <p className={`${appStreamScreenSupportCopyClass} mt-2 sm:mt-3`}>
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
    </div>
  );
};

export default ScreenSharePage;
