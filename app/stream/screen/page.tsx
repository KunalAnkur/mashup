"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { PageHeader } from "@/components/UI";
import { FaCheckCircle, FaShare, FaDesktop, FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { RootState } from "@/lib/store";
import { useCreateRoomMutation } from "@/lib/store/api/roomApi";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";

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
  const [createRoom] = useCreateRoomMutation();
  const { setStream: setMediaStream } = useMediaStreamContext();

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
      }

      // Use the cross-browser helper function to capture tab stream
      const mediaStream = await helper.captureTabStream({
        audioOnly: currentAudioOnly,
        preferredDisplaySurface: 'tab'
      });

      if (!mediaStream) {
        // User cancelled or capture failed - silently handle
        return;
      }

      setStream(mediaStream);
      // Store in MediaStreamContext for use in room (MediaStream cannot be in Redux)
      setMediaStream(mediaStream);
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
        showError("Screen sharing failed", "Please check your browser permissions and try again.");
      }
    }
  }, [audioOnly, setMediaStream, stream]);

  const handleStartStreaming = async () => {
    if (!isStreamReady || !stream) return;

    // Check authentication
    if (!authState.isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/stream/screen`)}`);
      return;
    }

    setIsCreatingRoom(true);

    try {
      // Create room with screen sharing stream type
      const response = await createRoom({
        type: "stream",
        source: "stream",
        urls: [], // Screen share doesn't need URLs
      }).unwrap();

      if (response.success && response.data?.room_id) {
        // Set refer data for AuthGuard to handle
        dispatch(
          setRefers({
            refer: true,
            type: "stream",
            source: "stream",
            urls: [],
          })
        );

        // Store stream in context or pass it somehow
        // For now, we'll need to handle this in the room page
        // The stream will need to be passed to MediaSoup hook
        
        // Redirect to room
        router.push(`/room/${response.data.room_id}`);
      } else {
        showError("Failed to create room", "Please check your connection and try again.");
        setIsCreatingRoom(false);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      showError("Failed to create room", "Please check your connection and try again.");
      setIsCreatingRoom(false);
    }
  };


  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
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
      `}</style>
    <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen">
      <PageHeader title="Screen Share" onBack={handleBack} logoGap="gap-8" />

      {/* Content */}
      <div className="flex h-full flex-1 items-start justify-center w-full overflow-y-auto overflow-x-hidden py-8">
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-6">
          {!stream ? (
            <>
              {/* Initial State - Before Preview */}
              {/* Main Action Section */}
              <div className="flex flex-col gap-6 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg shadow-purple-500/25">
                    <FaDesktop className="text-xl text-white" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h2 className="text-xl font-semibold text-white mb-1">Ready to Share?</h2>
                    <p className="text-gray-400 text-sm">Click the button below to start sharing your screen</p>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={() => handleShareScreen()}
                  disabled={!!stream}
                  className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 text-white ${
                    stream
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-500/30"
                  }`}
                >
                  {stream ? "✓ Screen Sharing Active" : "Share Your Screen"}
                </button>
              </div>

              {/* Simple Steps Guide - Only show when no preview */}
              <div className="flex flex-col gap-6">
                <h3 className="text-2xl font-bold text-white text-center">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Step 1 */}
                  <div 
                    className="flex flex-col items-center text-center px-5 py-8 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                    style={{ 
                      animation: 'float 3s ease-in-out infinite',
                      animationDelay: '0s'
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/25">
                      1
                    </div>
                    <h4 className="text-base font-semibold text-white mb-2">
                      Click on screen share button
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Click the "Share Screen" button above to start the sharing process.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div 
                    className="flex flex-col items-center text-center px-5 py-8 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                    style={{ 
                      animation: 'float 3s ease-in-out infinite',
                      animationDelay: '0.2s'
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/25">
                      2
            </div>
                    <h4 className="text-base font-semibold text-white mb-2">
                      Choose the tab you want to share
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Make sure to choose a tab (not your entire screen) for best audio quality.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div 
                    className="flex flex-col items-center text-center px-5 py-8 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                    style={{ 
                      animation: 'float 3s ease-in-out infinite',
                      animationDelay: '0.4s'
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/25">
                      3
                    </div>
                    <h4 className="text-base font-semibold text-white mb-2">
                      Click on "Start Sharing"
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Once your stream is ready, click "Start Sharing" to create a room and enjoy watching together!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="p-6 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <p className="text-white font-semibold mb-3 text-sm">Quick Tips</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-gray-300 text-xs leading-relaxed">Select a specific tab (not your entire screen) for best audio quality</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-gray-300 text-xs leading-relaxed">Keep the tab active and playing for the best experience</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0"></div>
                        <p className="text-gray-300 text-xs leading-relaxed">Make sure you have permission to share the content</p>
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
              <div className="flex flex-col gap-6 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-xl p-6 shadow-xl border border-purple-500/30">
                <div className="text-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-2">Preview Active</h2>
                  <p className="text-gray-300 text-sm">Your screen share is ready. Adjust settings below and start sharing when ready.</p>
                </div>
          </div>

          {/* Stream Preview */}
              <div className="rounded-xl overflow-hidden bg-black animate-fade-in">
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
                      <FaVolumeUp className="text-5xl text-fuchsia-400/60 mb-4" />
                      <div className="text-fuchsia-300 font-semibold text-base mb-1">Audio Only Mode</div>
                      <div className="text-gray-400 text-sm">Streaming audio from your tab</div>
                  </div>
                )}
                {isStreamReady && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-semibold">
                          {audioOnly ? 'Audio Ready' : 'Ready'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Post-Preview Action Section - Below Video */}
              <div className="flex flex-col gap-6 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl p-6 shadow-xl">
                {/* Audio-only toggle */}
                <div className="flex items-center justify-center p-4 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="flex items-center gap-2">
                      {audioOnly ? (
                        <FaVolumeMute className="text-lg text-fuchsia-400 transition-colors" />
                      ) : (
                        <FaVolumeUp className="text-lg text-purple-400 transition-colors" />
                      )}
                      <span className="text-sm font-medium text-white">
                        {audioOnly ? "Audio Only" : "Video + Audio"}
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
                                const newStream = await helper.captureTabStream({
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
                                  showError("Failed to re-enable video", "Your audio-only stream is still active. Please try sharing again if you want video.");
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
                      <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out ${
                        audioOnly 
                          ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600' 
                          : 'bg-gradient-to-r from-purple-600 to-fuchsia-600'
                      }`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out ${
                          audioOnly ? 'translate-x-7' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Warning */}
                {showWarning && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-fade-in">
                    <FaExclamationTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-yellow-300 font-medium text-sm mb-1">Tab Selection Required</p>
                      <p className="text-yellow-200/80 text-xs leading-relaxed">
                        {!isTabSelected
                          ? "Please select a specific tab (not your entire screen) to capture audio properly."
                          : "For best audio quality, select the specific tab with your content."}
                      </p>
                </div>
              </div>
                )}

                {/* Start Sharing Button */}
          {isStreamReady && (
                  <div className="text-center animate-fade-in">
              <button
                onClick={handleStartStreaming}
                disabled={isCreatingRoom || !isStreamReady}
                      className={`w-full px-8 py-5 rounded-xl font-bold text-lg transition-all duration-200 text-white inline-flex items-center justify-center gap-3 ${
                  isCreatingRoom || !isStreamReady
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-500/30"
                }`}
              >
                {isCreatingRoom && <ImSpinner2 className="animate-spin" />}
                      {isCreatingRoom ? "Creating Room..." : "Start Sharing"}
              </button>
              <p className="text-gray-400 text-sm mt-3">
                      Your room will be created and you can enjoy watching together!
              </p>
            </div>
          )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ScreenSharePage;
