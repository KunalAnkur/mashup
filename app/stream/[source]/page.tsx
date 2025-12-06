"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { ProfileHeader, Logo } from "@/components";
import { FaArrowLeft, FaCheckCircle, FaShare, FaDesktop, FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { RootState } from "@/lib/store";
import { useCreateRoomMutation } from "@/lib/store/api/roomApi";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";

const PlatformStreamPage = () => {
  const router = useRouter();
  const params = useParams();
  const source = params?.source as string;
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

  // Find the platform by matching the slug
  const platform = STREAMING_PLATFORMS.find((p) => {
    const platformSlug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/\+/g, "-plus");
    return platformSlug === source;
  });

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

  // If platform not found, redirect to /stream
  useEffect(() => {
    if (!platform && source) {
      router.replace("/stream");
    }
  }, [platform, source, router]);

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

  const handleOpenPlatform = () => {
    if (platform) {
      window.open(platform.url, "_blank", "noopener,noreferrer");
    }
  };

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
      router.push(`/login?redirect=${encodeURIComponent(`/stream/${source}`)}`);
      return;
    }

    setIsCreatingRoom(true);

    try {
      // Create room with screen sharing stream type
      const response = await createRoom({
        type: "stream",
        source: "stream",
        urls: [platform?.url || ""], // Store platform URL for reference
      }).unwrap();

      if (response.success && response.data?.room_id) {
        // Set refer data for AuthGuard to handle
        dispatch(
          setRefers({
            refer: true,
            type: "stream",
            source: "stream",
            urls: [platform?.url || ""],
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

  if (!platform) {
    return null;
  }

  const steps = [
    {
      number: 1,
      title: "Open the platform",
      description: `Navigate to ${platform.name} in your browser and sign in to your account.`,
      icon: <FaDesktop className="text-2xl" />,
      action: (
        <button
          onClick={handleOpenPlatform}
          className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg text-white hover:scale-105"
          style={platform.bgStyle}
        >
          Open {platform.name}
        </button>
      ),
    },
    {
      number: 2,
      title: "Start your content",
      description: "Play the movie, show, or video you want to share with others.",
      icon: <FaCheckCircle className="text-2xl" />,
    },
    {
      number: 3,
      title: "Share your screen",
      description:
        "Click the share button below and select the tab with the platform. Make sure to share only the tab (not your entire screen) to capture audio properly.",
      icon: <FaShare className="text-2xl" />,
      action: (
        <div className="mt-4 space-y-3">
          {/* Audio-only toggle - only show when stream is active */}
          {stream && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={audioOnly}
                  onChange={(e) => {
                  const newAudioOnly = e.target.checked;
                  
                  // Update the audioOnly state first
                  setAudioOnly(newAudioOnly);
                  
                  // If stream exists, modify it based on the new setting
                  if (stream) {
                    if (newAudioOnly) {
                      // Enabling audio-only: remove video tracks from existing stream
                      const videoTracks = stream.getVideoTracks();
                      const audioTracks = stream.getAudioTracks();
                      
                      if (videoTracks.length > 0) {
                        // Create a new stream with only audio tracks to trigger re-render
                        const audioOnlyStream = new MediaStream(audioTracks);
                        
                        // Stop and remove video tracks from original stream
                        videoTracks.forEach(track => {
                          track.stop();
                          stream.removeTrack(track);
                        });
                        
                        console.log("Audio-only enabled: video tracks removed, audio-only stream created");
                        
                        // Update both stream states with the new audio-only stream
                        setStream(audioOnlyStream);
                        setMediaStream(audioOnlyStream);
                        // Validation will run automatically via useEffect
                      } else {
                        // Already audio-only, just update context
                        setMediaStream(stream);
                      }
                    } else {
                      // Disabling audio-only: can't add video tracks back, need to re-capture
                      // Re-capture the stream with video enabled
                      const currentStream = stream;
                      currentStream.getTracks().forEach(track => track.stop());
                      setStream(null);
                      setMediaStream(null);
                      setIsStreamReady(false);
                      setIsTabSelected(false);
                      setShowWarning(false);
                      
                      // Wait a bit then re-capture with video
                      setTimeout(async () => {
                        try {
                          await handleShareScreen(false); // false = not audio-only, so video will be requested
                        } catch (error) {
                          console.error("Error re-capturing stream with video:", error);
                          // If user cancels, that's okay - they can manually click share again
                        }
                      }, 300);
                    }
                  }
                }}
                  className="w-4 h-4 rounded accent-fuchsia-500"
                />
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  {audioOnly ? <FaVolumeMute /> : <FaVolumeUp />}
                  Audio only
                </span>
              </label>
            </div>
          )}
          
          <button
            onClick={() => handleShareScreen()}
            disabled={!!stream}
            className={`w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg text-white ${
              stream
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "hover:scale-105"
            }`}
            style={stream ? {} : platform.bgStyle}
          >
            {stream ? "Screen Sharing Active" : "Share Screen"}
          </button>
          
          {showWarning && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl animate-fade-in">
              <FaExclamationTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-300 font-medium text-sm mb-1">Warning: Tab Selection Required</p>
                <p className="text-yellow-200/80 text-xs leading-relaxed">
                  {!isTabSelected
                    ? "Please select a tab (not your entire screen or window) to capture audio. Audio capture only works when sharing a specific tab."
                    : "You may have selected a window instead of a tab. For best audio quality, please select the specific tab with the platform."}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      number: 4,
      title: "Start watching together",
      description:
        "Once your stream is ready, click the button below to create a room and start watching with others.",
      icon: <FaCheckCircle className="text-2xl" />,
    },
  ];

  return (
    <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen">
      {/* Header with logo, back button, and profile */}
      <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-white/10 relative z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Logo size="sm" href="/" showText={true} />
          </div>
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft className="text-lg" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">
          Stream from {platform.name}
        </h2>
        <div className="flex items-center">
          <ProfileHeader />
        </div>
      </div>

      {/* Content */}
      <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 md:py-6">
        <div className="w-full max-w-5xl mx-auto px-6 md:px-10">
          {/* Platform Header */}
          <div className="mb-8 text-center">
            <div
              className="inline-flex items-center justify-center p-6 rounded-2xl mb-4"
              style={platform.bgStyle}
            >
              <div className="text-white text-5xl md:text-6xl">
                {platform.logo}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              How to stream from {platform.name}
            </h1>
            <p className="text-gray-400 text-lg">
              Follow these simple steps to share your {platform.name} content
            </p>
          </div>

          {/* Stream Preview */}
          {stream && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-black border border-white/10">
              <div className={`relative ${audioOnly ? 'aspect-square' : 'aspect-video'}`}>
                {/* Video element - always present (hidden in audio-only mode) to play audio */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted={true}
                  playsInline
                  className={audioOnly ? "hidden" : "w-full h-full object-contain"}
                />
                {audioOnly && (
                  // Audio-only visualizer overlay
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-900/20 to-pink-900/20">
                    <div className="mb-4">
                      <FaVolumeUp className="text-6xl text-fuchsia-400/60" />
                    </div>
                    <div className="text-fuchsia-300 font-semibold text-lg mb-2">Audio Only Mode</div>
                    <div className="text-gray-400 text-sm">Streaming audio from {platform.name}</div>
                    {/* Audio waveform visualization */}
                    <div className="flex items-end gap-1.5 mt-6 h-16">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-fuchsia-500 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {isStreamReady && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-semibold">
                        {audioOnly ? 'Audio Stream Ready' : 'Stream Ready'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex gap-6 p-6 rounded-2xl bg-gradient-to-br from-[#1f1f23] to-[#27272a] border border-white/5 hover:border-white/10 transition-all duration-200"
              >
                {/* Step Number and Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={platform.bgStyle}
                    >
                      {step.number}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#18181b] p-2 rounded-full border-2 border-[#27272a]">
                      <div className="text-white">{step.icon}</div>
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-2">
                    {step.description}
                  </p>
                  {step.action && <div>{step.action}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Final Action Button - Start Streaming */}
          {isStreamReady && (
            <div className="mt-8 text-center animate-fade-in">
              <button
                onClick={handleStartStreaming}
                disabled={isCreatingRoom || !isStreamReady}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg text-white ${
                  isCreatingRoom || !isStreamReady
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "hover:scale-105"
                }`}
                style={isCreatingRoom || !isStreamReady ? {} : platform.bgStyle}
              >
                {isCreatingRoom ? "Creating Room..." : "Start Streaming"}
              </button>
              <p className="text-gray-400 text-sm mt-3">
                This will create a room and redirect you to start watching together
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-6 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-fuchsia-500"
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
              <div className="flex-1">
                <p className="text-gray-300 font-medium mb-1">Important Notes</p>
                <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
                  <li>Make sure you have the necessary subscription or access to the content</li>
                  <li>Always select the specific tab (not screen or window) to capture audio</li>
                  <li>Screen sharing quality depends on your internet connection</li>
                  <li>Keep the tab active and playing for the best experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStreamPage;
