"use client"
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as constants from "@/constants/assets";
interface AudioVisualizerProps {
    playing: boolean;
    muted: boolean;
    playerRef: React.RefObject<any>;
}
// const backgroundImageUrl = "https://images.unsplash.com/photo-1495584816685-4bdbf1b5057e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
const backgroundImageUrl = "https://images.unsplash.com/photo-1434394354979-a235cd36269d?q=80&w=1702&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D "
const AudioVisualizer = ({ playing, muted, playerRef }: AudioVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const previousDataRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
    const playerElementRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sourceRef.current) {
                try {
                    sourceRef.current.disconnect();
                } catch (e) {
                    // Ignore disconnect errors
                }
                sourceRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => { });
                audioContextRef.current = null;
            }
            playerElementRef.current = null;
        };
    }, []);

    useEffect(() => {
        // Always keep visualizer visible, but only set up audio when playing and not muted
        if (!playing || muted) {
            setIsVisible(false); // Don't process audio, but visualizer will still render with minimum bars
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Don't return - let the component render with static bars
        }
        
        if (!playing || muted) {
            return; // Don't set up audio context
        }

        const setupAudioContext = async () => {
            try {
                let player = playerRef.current?.getInternalPlayer?.();
                let retries = 0;
                const maxRetries = 10;
                
                while ((!player || !(player instanceof HTMLVideoElement || player instanceof HTMLAudioElement)) && retries < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    player = playerRef.current?.getInternalPlayer?.();
                    retries++;
                }

                if (!player || !(player instanceof HTMLVideoElement || player instanceof HTMLAudioElement)) {
                    return;
                }

                // If same player element and already set up, just resume if needed
                if (playerElementRef.current === player && sourceRef.current && analyserRef.current && audioContextRef.current) {
                    if (audioContextRef.current.state === 'suspended') {
                        await audioContextRef.current.resume();
                    }
                    setIsVisible(true);
                    console.log("playerElementRef.current", playerElementRef.current);
                    return;
                }

                // Clean up previous source if different element
                if (playerElementRef.current && playerElementRef.current !== player) {
                    if (sourceRef.current) {
                        try {
                            sourceRef.current.disconnect();
                        } catch (e) {
                            // Ignore disconnect errors
                        }
                        sourceRef.current = null;
                    }
                    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                        try {
                            await audioContextRef.current.close();
                        } catch (e) {
                            // Ignore close errors
                        }
                        audioContextRef.current = null;
                    }
                }

                // Try captureStream first (doesn't have "already connected" issue)
                // if (player instanceof HTMLVideoElement) {
                //     const videoElement = player as HTMLVideoElement & { captureStream?: () => MediaStream };
                //     if (videoElement.captureStream) {
                //         try {
                //             const stream = videoElement.captureStream();
                //             const audioTracks = stream.getAudioTracks();
                //             const videoTracks = stream.getVideoTracks();
                            
                //             console.log("AudioVisualizer: captureStream result", {
                //                 audioTracks: audioTracks.length,
                //                 videoTracks: videoTracks.length,
                //                 audioTrackEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false,
                //                 audioTrackReadyState: audioTracks.length > 0 ? audioTracks[0].readyState : 'N/A'
                //             });
                            
                //             // Only proceed if we have audio tracks (required for visualizer)
                //             if (audioTracks.length > 0) {
                //                 const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                //                 if (newAudioContext.state === 'suspended') {
                //                     await newAudioContext.resume();
                //                 }

                //                 const mediaStreamSource = newAudioContext.createMediaStreamSource(stream);
                //                 const newAnalyser = newAudioContext.createAnalyser();
                //                 newAnalyser.fftSize = 512;
                //                 newAnalyser.smoothingTimeConstant = 0.7;
                //                 newAnalyser.minDecibels = -90;
                //                 newAnalyser.maxDecibels = -10;

                //                 // FIX: Connect the nodes properly
                //                 mediaStreamSource.connect(newAnalyser);
                //                 // NOTE: We intentionally DON'T connect to destination
                //                 // to avoid double audio output since the video element
                //                 // is already playing audio

                //                 const bufferLength = newAnalyser.frequencyBinCount;
                //                 const dataArray = new Uint8Array(bufferLength);

                //                 audioContextRef.current = newAudioContext;
                //                 analyserRef.current = newAnalyser;
                //                 dataArrayRef.current = dataArray;
                //                 sourceRef.current = mediaStreamSource;
                //                 playerElementRef.current = player;

                //                 console.log("AudioVisualizer: Successfully set up with captureStream");
                //                 setIsVisible(true);
                //                 return;
                //             } else {
                //                 console.warn("AudioVisualizer: captureStream has no audio tracks, cannot create visualizer");
                //             }
                //         } catch (captureError) {
                //             // Fall through to MediaElementSource approach
                //             console.warn("AudioVisualizer: captureStream failed, trying MediaElementSource:", captureError);
                //         }
                //     }
                // }

                // Fallback: create WebAudio graph depending on element type
                try {
                    // CASE 1: Consumer - video element playing a MediaStream via srcObject.
                    // Safest is to tap the MediaStream directly without touching the element.
                    if (player instanceof HTMLVideoElement) {
                        const videoElement = player as HTMLVideoElement;
                        const srcObject = videoElement.srcObject;

                        if (srcObject instanceof MediaStream) {
                            const stream = srcObject;
                            const audioTracks = stream.getAudioTracks();

                            console.log("AudioVisualizer: Using MediaStream from video.srcObject", {
                                audioTracks: audioTracks.length,
                                audioTrackEnabled: audioTracks[0]?.enabled ?? false,
                                audioTrackReadyState: audioTracks[0]?.readyState ?? "N/A",
                            });

                            if (audioTracks.length > 0) {
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                if (ctx.state === "suspended") {
                                    await ctx.resume();
                                }

                                const mediaStreamSource = ctx.createMediaStreamSource(stream);
                                const analyser = ctx.createAnalyser();
                                analyser.fftSize = 512;
                                analyser.smoothingTimeConstant = 0.7;
                                analyser.minDecibels = -90;
                                analyser.maxDecibels = -10;

                                // IMPORTANT: Only connect to analyser, do NOT connect to destination.
                                // This avoids double audio or interfering with WebRTC routing.
                                mediaStreamSource.connect(analyser);

                                const bufferLength = analyser.frequencyBinCount;
                                const dataArray = new Uint8Array(bufferLength);

                                audioContextRef.current = ctx;
                                analyserRef.current = analyser;
                                dataArrayRef.current = dataArray;
                                sourceRef.current = mediaStreamSource;
                                playerElementRef.current = player;

                                console.log("AudioVisualizer: WebAudio setup from MediaStream (consumer)");
                                setIsVisible(true);
                                return;
                            } else {
                                console.warn("AudioVisualizer: MediaStream from srcObject has no audio tracks");
                            }
                        }
                        // If no srcObject MediaStream, fall through to generic handling below (file / URL source).
                    }

                    // CASE 2: Generic HTMLMediaElement (file / URL, including host side).
                    // Use MediaElementSource, which is safe when the element is not already tied to WebRTC.
                    if (!audioContextRef.current) {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                    }

                    if (audioContextRef.current.state === "suspended") {
                        await audioContextRef.current.resume();
                    }

                    const analyser = audioContextRef.current.createAnalyser();
                    analyser.fftSize = 512;
                    analyser.smoothingTimeConstant = 0.7;
                    analyser.minDecibels = -90;
                    analyser.maxDecibels = -10;

                    const source = audioContextRef.current.createMediaElementSource(player);
                    source.connect(analyser);
                    analyser.connect(audioContextRef.current.destination);

                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    analyserRef.current = analyser;
                    dataArrayRef.current = dataArray;
                    sourceRef.current = source;
                    playerElementRef.current = player;

                    console.log("AudioVisualizer: WebAudio setup with MediaElementSource");
                    setIsVisible(true);
                } catch (createError: any) {
                    if (createError.name === "InvalidStateError" && createError.message.includes("already connected")) {
                        console.warn("AudioVisualizer: Element already connected, cannot create visualizer");
                        setIsVisible(false);
                        return;
                    }
                    throw createError; // Re-throw other errors
                }
            } catch (error) {
                console.error("AudioVisualizer setup failed:", error);
                setIsVisible(false);
            }
        };

        setupAudioContext();
    }, [playing, muted, playerRef]);

    useEffect(() => {
        // Always render visualizer, even when muted or paused
        if (!canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Audio analyser is optional - only used when playing and not muted
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const newWidth = rect.width;
            const newHeight = rect.height;
            
            // Only resize if dimensions actually changed
            if (canvas.width !== newWidth * dpr || canvas.height !== newHeight * dpr) {
                canvas.width = newWidth * dpr;
                canvas.height = newHeight * dpr;
                ctx.scale(dpr, dpr);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        };

        resizeCanvas();
        
        // Use ResizeObserver to detect container size changes (like when panel closes)
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }
        
        window.addEventListener("resize", resizeCanvas);

        // Helper function to process frequency data into bar values (inspired by getBars logic)
        const getBars = (frequencyData: Uint8Array, numBars: number): number[] => {
            const samples = frequencyData;
            const sampleStep = Math.floor(samples.length / numBars);
            
            const bars = Array.from({ length: numBars }).map((_, i) => {
                const sampleIndex = (i * sampleStep) % samples.length;
                const normalizedValue = samples[sampleIndex] / 255;
                
                // Use logarithmic scaling for better visual response (like Math.log(1 + processed))
                // This makes the bars more responsive to audio changes
                const processed = Math.log(1 + normalizedValue * 9) / Math.log(10); // log10(1 + 9x) normalized
                return processed;
            });
            
            return bars;
        };

        const draw = () => {
            // Always draw, but use minimum values when muted or paused
            const shouldUseAudio = isVisible && dataArrayRef.current && analyser;
            
            if (shouldUseAudio && analyser && dataArrayRef.current) {
                try {
                    // @ts-expect-error - Web Audio API type compatibility issue
                    analyser.getByteFrequencyData(dataArrayRef.current);
                } catch (e) {
                    // Fall through to draw minimum bars
                }
            }

            // Get accurate dimensions from bounding rect
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // Ensure canvas internal size matches display size
            const dpr = window.devicePixelRatio || 1;
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }

            ctx.clearRect(0, 0, width, height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Circle radius for logo area
            const circleRadius = 125;
            const innerRadius = circleRadius + 12; // Bars start from here (closer to logo)
            const outerRadius = innerRadius + 160; // Maximum bar extension (longer bars)
            const numBars = 72; // More bars for fuller, more even distribution
            const barThickness = 5; // Thinner bars like in the image
            const gapSize = 3; // Even gaps between bars
            const topRoundness = barThickness / 2; // Only top (outer) end rounded
            const maxAmplitude = 1; // Normalized max value

            // Get bar values - use minimum when muted/paused, otherwise use audio data
            let barValues: number[];
            let volumeMultiplier = 1.0; // Volume-based scaling factor
            
            if (shouldUseAudio && dataArrayRef.current) {
                // Smooth data for better animation
                const previousData = previousDataRef.current || new Uint8Array(dataArrayRef.current.length);
                if (!previousDataRef.current) {
                    previousDataRef.current = new Uint8Array(dataArrayRef.current.length);
                    previousDataRef.current.set(dataArrayRef.current);
                }

                const smoothingFactor = 0.7;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    previousData[i] = previousData[i] * smoothingFactor + dataArrayRef.current[i] * (1 - smoothingFactor);
                }
                previousDataRef.current = previousData;

                // Calculate overall volume/amplitude from frequency data
                // Average amplitude across all frequencies to get overall volume
                const sum = previousData.reduce((acc, val) => acc + val, 0);
                const averageAmplitude = sum / previousData.length;
                const normalizedVolume = averageAmplitude / 255; // Normalize to 0-1
                
                // Use volume to scale bar heights (0.3 to 1.0 range for subtle effect)
                // This ensures bars are always visible but scale with volume
                volumeMultiplier = 0.3 + normalizedVolume * 0.7;

                // Get processed bar values using logarithmic scaling
                // Get half the bars, then mirror them to create symmetric pattern around the circle
                const halfBars = Math.floor(numBars / 2);
                const firstHalf = getBars(previousData, halfBars);
                const secondHalf = [...firstHalf].reverse(); // Mirror the first half
                barValues = [...firstHalf, ...secondHalf]; // Combine to create symmetric pattern
            } else {
                // When muted or paused, use minimum values for all bars
                barValues = new Array(numBars).fill(0.01); // Minimum value to show small bars
                volumeMultiplier = 0.3; // Minimum height when muted/paused
            }
            
            const maxBarValue = Math.max(...barValues, 0.01); // Prevent division by zero

            // Draw radial bars - extending from inner radius outward (barOrigin: 'inner')
            for (let i = 0; i < numBars; i++) {
                const angle = (i / numBars) * Math.PI * 2;
                const value = barValues[i];
                
                // Calculate bar height (extending outward from inner radius)
                // Apply volume multiplier to scale height based on overall audio volume
                const baseBarHeight = (value / maxAmplitude) * (outerRadius - innerRadius);
                const volumeScaledHeight = baseBarHeight * volumeMultiplier;
                const minBarHeight = 4; // Minimum visible bar
                const actualBarHeight = Math.max(minBarHeight, volumeScaledHeight);
                
                // Bar origin is 'inner' - bars start at innerRadius and extend outward
                const barStartRadius = innerRadius;
                const barEndRadius = barStartRadius + actualBarHeight;
                
                // Calculate opacity based on value - matching logo opacity (0.13 base)
                const normalizedValue = value / maxAmplitude;
                // Match logo opacity: #E3E3E3 with 0.13 opacity, with slight variation based on audio
                const baseOpacity = 0.13; // Match logo fill-opacity="0.13"
                const opacity = baseOpacity + normalizedValue * 0.05; // Slight variation: 0.13 to 0.18

                // Calculate bar positions (radial alignment)
                const startX = centerX + Math.cos(angle) * barStartRadius;
                const startY = centerY + Math.sin(angle) * barStartRadius;
                const endX = centerX + Math.cos(angle) * barEndRadius;
                const endY = centerY + Math.sin(angle) * barEndRadius;

                // Use logo color #E3E3E3 (227, 227, 227) with matching opacity
                const barGradient = ctx.createLinearGradient(startX, startY, endX, endY);
                barGradient.addColorStop(0, `rgba(227, 227, 227, ${opacity * 0.95})`);
                barGradient.addColorStop(0.7, `rgba(227, 227, 227, ${opacity})`);
                barGradient.addColorStop(1, `rgba(227, 227, 227, ${opacity * 0.85})`);

                // Draw bar with only top (outer) end rounded, bottom (inner) end square
                ctx.save();
                ctx.translate(startX, startY);
                ctx.rotate(angle); // Rotate to align with radius

                const length = actualBarHeight;
                const halfWidth = barThickness / 2;

                ctx.beginPath();
                // Start at inner end (bottom) - square corner
                ctx.moveTo(0, -halfWidth);
                // Top edge (extending outward)
                ctx.lineTo(length - topRoundness, -halfWidth);
                // Outer rounded end (top/outer end) - only this end is rounded
                ctx.arc(length - topRoundness, 0, topRoundness, -Math.PI / 2, Math.PI / 2, false);
                // Bottom edge (back to start)
                ctx.lineTo(0, halfWidth);
                // Close path (inner end is square)
                ctx.closePath();

                ctx.fillStyle = barGradient;
                ctx.fill();

                // Subtle glow for high values - using logo color
                if (normalizedValue > 0.5) {
                    ctx.shadowBlur = 12 * normalizedValue;
                    ctx.shadowColor = `rgba(227, 227, 227, ${opacity * 0.5})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                ctx.restore();

                // Subtle sparkle particles for very high values - using logo color
                if (normalizedValue > 0.85) {
                    const particleCount = Math.floor(normalizedValue);
                    for (let p = 0; p < particleCount; p++) {
                        const progress = 0.7 + Math.random() * 0.3;
                        const particleRadius = barStartRadius + actualBarHeight * progress;
                        const particleX = centerX + Math.cos(angle) * particleRadius;
                        const particleY = centerY + Math.sin(angle) * particleRadius;
                        const particleSize = Math.random() * 2 + 1;

                        ctx.beginPath();
                        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(227, 227, 227, ${0.13 + Math.random() * 0.05})`;
                        ctx.fill();
                    }
                }
            }

            // Subtle inner glow effect for depth - using logo color
            const innerGlow = ctx.createRadialGradient(centerX, centerY, circleRadius * 0.8, centerX, centerY, circleRadius * 1.2);
            innerGlow.addColorStop(0, 'rgba(227, 227, 227, 0.08)');
            innerGlow.addColorStop(1, 'rgba(227, 227, 227, 0)');

            ctx.beginPath();
            ctx.arc(centerX, centerY, circleRadius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = innerGlow;
            ctx.fill();

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            resizeObserver.disconnect();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isVisible, playing, muted]);

    // Always render the visualizer, even when muted or paused (bars will be at minimum)

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                {/* <Image
                    src={backgroundImageUrl}
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    style={{
                        filter: 'brightness(0.75) contrast(1.05) saturate(0.9)'
                    }}
                /> */}
                <video
                    src="https://raw.githubusercontent.com/KunalAnkur/assets/refs/heads/main/270983_medium.mp4"
                    autoPlay
                    loop
                    playsInline
                    muted
                    className="object-cover w-full h-full"
                    style={{
                        filter: 'brightness(0.75) contrast(1.05) saturate(0.9)'
                    }}
                />
            </div>

            {/* Very light overlay with minimal vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse at center, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0, 0, 0, 0.2) 100%),
                        linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 0%, transparent 40%, rgba(0, 0, 0, 0.03) 100%)
                    `
                }}
            />

            {/* Canvas for visualization */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    mixBlendMode: 'screen',
                    filter: 'brightness(1.15) contrast(1.2)',
                    width: "100%",
                    height: "100%"
                }}
            />

            {/* Center content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                {/* Logo - full size to replace the circle */}
                <div
                    className="relative z-10"
                    style={{
                        width: '250px',
                        height: '250px',
                        mixBlendMode: 'overlay'
                    }}
                >
                    <Image
                        src={constants.visualizerLogo}
                        alt="Movmash Logo"
                        fill
                        className="object-contain"
                        style={{
                            filter: 'brightness(1.3) contrast(1.2) drop-shadow(0 0 20px rgba(227, 227, 227, 0.4))'
                        }}
                    />
                </div>
            </div>

        </div>
    );
};

export default AudioVisualizer;