"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "@/components/UI";
import { FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { LuMonitor, LuMousePointerClick, LuCheck, LuRadioTower, LuFileUp } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { setRefers, setScreenSharing, updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { useScreenShareQuality, useScreenShareSupport } from "@/hooks";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import type { Playlist } from "@/types/storeTypes";
import {
  appScrollbarHideClass,
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
  appStreamScreenAudioOnlyStateClass,
  appStreamScreenHeroSurfaceClass,
  appStreamScreenIntroClusterClass,
  appStreamScreenIntroCopyClass,
  appStreamScreenIntroWidthClass,
  appStreamScreenOpenSectionClass,
  appStreamScreenPreviewFrameClass,
  appStreamScreenPreviewStatusClass,
  appStreamScreenPrimaryButtonClass,
  appStreamScreenSupportCopyClass,
  appStreamScreenStepVisualClass,
  appStreamScreenStepNumberClass,
  appStreamScreenStepCardClass,
  appStreamScreenToggleSurfaceClass,
  appStreamScreenWarningSurfaceClass,
} from "@/components/UI/classTokens";

const ScreenSharePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const { setStream: setMediaStream, setScreenType } = useMediaStreamContext();
  const canScreenShare = useScreenShareSupport();
  const screenShareQuality = useScreenShareQuality();
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
  const streamRef = useRef<MediaStream | null>(null);
  // Set right before handing the stream off to the room flow (handleStartStreaming), so the
  // unmount cleanup below knows not to stop it. Navigating away any other way (sidebar nav,
  // browser back) should still stop the tracks — there's no dedicated back button anymore.
  const keepStreamAliveRef = useRef(false);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (!keepStreamAliveRef.current) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
    // The page renders its unsupported state instead of this flow on mobile, so reaching here
    // means the check changed under us (or the button was triggered some other way).
    if (!canScreenShare) {
      showError(tStream("screenShareUnsupportedTitle"), tStream("screenShareUnsupportedDescription"));
      return;
    }
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
        preferredDisplaySurface: 'tab',
        quality: screenShareQuality,
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
  }, [audioOnly, canScreenShare, screenShareQuality, setMediaStream, stream]);

  const handleStartStreaming = useCallback(async () => {
    if (!stream) return;
    keepStreamAliveRef.current = true;

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


  /**
   * Nothing on this page works without getDisplayMedia, and the links into it are already
   * hidden where it is missing — but the URL is shareable, so the page still has to answer
   * for itself rather than showing a share button that can only fail.
   */
  if (canScreenShare === null) {
    return null;
  }

  if (!canScreenShare) {
    return (
      <div className={`${dashPageContentWrapClass} ${appScrollbarHideClass}`}>
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div className={`${dashPageTitleWrapClass} justify-center`}>
            <h1 className={appSectionTitleTextClass}>{tStream("screenSharePageTitle")}</h1>
          </div>
          <div className={appStreamScreenOpenSectionClass}>
            <div className={appStreamScreenIntroClusterClass}>
              <div className={appStreamScreenIntroCopyClass}>
                <h2 className="mb-1 text-base font-semibold tracking-tight text-dashText sm:text-lg">
                  {tStream("screenShareUnsupportedTitle")}
                </h2>
                <p className={appStreamScreenSupportCopyClass}>
                  {tStream("screenShareUnsupportedDescription")}
                </p>
              </div>
            </div>

            <div className={appStreamScreenIntroWidthClass}>
              <button
                onClick={() => router.push("/stream")}
                className={appStreamScreenPrimaryButtonClass}
              >
                <LuFileUp className="text-base" />
                {tStream("screenShareUnsupportedAction")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div
        ref={contentScrollRef}
        className={`${dashPageContentWrapClass} ${appScrollbarHideClass}`}
      >
        {/* Whole page centered as one column — owner asked for horizontal centering
            instead of the flush-left start point used elsewhere in the dashboard. */}
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className={`${dashPageTitleWrapClass} justify-center`}>
          <h1 className={appSectionTitleTextClass}>{tStream("screenSharePageTitle")}</h1>
        </div>
        <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5 md:gap-6">
                {!stream ? (
                  <>
                    {/* Initial State - Before Preview */}
                    {/* Main Action Section */}
                    <div className={appStreamScreenOpenSectionClass}>
                      <div className={appStreamScreenIntroClusterClass}>
                        <div className={appStreamScreenIntroCopyClass}>
                          <h2 className="mb-1 text-base font-semibold tracking-tight text-dashText sm:text-lg">
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
                          {!stream && <LuMonitor className="text-base" />}
                          {stream ? tStream("screenSharingActive") : tStream("shareYourScreen")}
                        </button>
                      </div>
                    </div>

                    {/* Simple Steps Guide - Only show when no preview */}
                    <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5 md:gap-6">
                      <h3 className="text-base font-semibold tracking-tight text-dashText sm:text-lg">{tStream("howItWorks")}</h3>
                      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6">
                  {/* Step 1 — mini preview of the actual Share button + a click cursor */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`}>
                    <div className={appStreamScreenStepVisualClass}>
                      <span className={appStreamScreenStepNumberClass}>1</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 sm:h-9 sm:w-9">
                        <LuMonitor className="text-sm text-white sm:text-base" />
                      </span>
                      <LuMousePointerClick className="absolute bottom-1 right-1 text-dashText/80 text-xs drop-shadow sm:bottom-1.5 sm:right-1.5 sm:text-sm" />
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-dashText sm:mb-2 sm:text-base">
                        {tStream("clickScreenShareButton")}
                      </h4>
                      <p className={appStreamScreenSupportCopyClass}>
                        {tStream("clickShareScreenButton")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 — mini tab picker with the middle tab selected */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`} style={{ animationDelay: '0.2s' }}>
                    <div className={appStreamScreenStepVisualClass}>
                      <span className={appStreamScreenStepNumberClass}>2</span>
                      <div className="flex items-end gap-1">
                        <div className="h-3 w-4 rounded-t-[3px] bg-white/10 sm:h-4 sm:w-5" />
                        <div className="relative flex h-5 w-6 items-center justify-center rounded-t-[3px] bg-gradient-to-r from-rose-600 to-fuchsia-600 sm:h-8 sm:w-9">
                          <LuCheck className="text-[10px] text-white sm:text-xs" />
                        </div>
                        <div className="h-3 w-4 rounded-t-[3px] bg-white/10 sm:h-4 sm:w-5" />
                      </div>
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-dashText sm:mb-2 sm:text-base">
                        {tStream("chooseTabToShare")}
                      </h4>
                      <p className={appStreamScreenSupportCopyClass}>
                        {tStream("chooseTabForBestAudio")}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 — live indicator, same visual language as the in-room streaming badge */}
                  <div className={`flex flex-row items-center gap-3 px-3 py-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:py-6 sm:text-center md:px-5 md:py-8 ${appStreamScreenStepCardClass}`} style={{ animationDelay: '0.4s' }}>
                    <div className={appStreamScreenStepVisualClass}>
                      <span className={appStreamScreenStepNumberClass}>3</span>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-fuchsia-600 sm:h-9 sm:w-9">
                          <LuRadioTower className="text-xs text-white sm:text-sm" />
                        </div>
                        <div className="h-1 w-1 rounded-full bg-pink-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center">
                      <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-dashText sm:mb-2 sm:text-base">
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
                    <div className="hidden w-full p-4 sm:block sm:p-5 md:p-6">
                  <p className="mb-2 text-xs font-semibold tracking-tight text-dashText sm:mb-3 sm:text-sm">{tStream("quickTips")}</p>
                  <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-rose-300 sm:h-1.5 sm:w-1.5"></div>
                      <p className={appStreamScreenSupportCopyClass}>{tStream("tipSelectSpecificTab")}</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-pink-300 sm:h-1.5 sm:w-1.5"></div>
                      <p className={appStreamScreenSupportCopyClass}>{tStream("tipKeepTabActive")}</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-fuchsia-300 sm:h-1.5 sm:w-1.5"></div>
                      <p className={appStreamScreenSupportCopyClass}>{tStream("tipCheckPermission")}</p>
                    </div>
                  </div>
                    </div>
                  </>
                ) : (
                  <>
              {/* Post-Preview State - After Tab Selection */}
              {/* Preview Active Status Header - Above Video */}
              <div className={`flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 md:gap-6 md:p-6 ${appStreamScreenPreviewStatusClass}`}>
                <div className="text-left">
                  <h2 className="mb-1 text-base font-semibold tracking-tight text-dashText sm:text-lg">{tStream("previewActive")}</h2>
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
                        <FaVolumeUp className="text-base sm:text-lg text-pink-400 transition-colors" />
                      )}
                      <span className="text-xs sm:text-sm font-medium text-dashText">
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
                                  preferredDisplaySurface: 'tab',
                                  quality: screenShareQuality,
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
                          : 'bg-gradient-to-r from-rose-600 to-pink-600'
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
                      {isCreatingRoom ? (
                        <ImSpinner2 className="animate-spin text-base" />
                      ) : (
                        <LuMonitor className="text-base" />
                      )}
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
  );
};

export default ScreenSharePage;
