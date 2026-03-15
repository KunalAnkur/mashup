import { KeyboardEvent, MouseEvent, useEffect, useRef } from "react";
import { isMobile } from "react-device-detect";
import { FaPlay } from "react-icons/fa";
/**
 *  *The native onDoubleClick handler has a critical flaw: it still fires onClick before onDoubleClick. So with the native approach:
 *  *First click → onClick fires → play/pause toggles
 *  *Second click → onClick fires again → play/pause toggles back
 *  *Then onDoubleClick fires → fullscreen toggles
 */
interface PlayPauseOverlayProps {
    playing: boolean;
    onToggle: () => void;
    onDoubleClick: () => void;
    disablePlay?: boolean;
}

export const PlayPauseOverlay = ({
    playing,
    onToggle,
    onDoubleClick,
    disablePlay = false
}: PlayPauseOverlayProps) => {
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
        };
    }, []);

    const clearClickTimer = () => {
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }
    };
    const handleSingleAction = () => {
        if (disablePlay) return;
        onToggle();
    };
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (event.detail === 2) {
            clearClickTimer();
            onDoubleClick();
            return;
        }

        clearClickTimer();
        clickTimerRef.current = setTimeout(() => {
            handleSingleAction();
            clickTimerRef.current = null;
        }, 220);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            handleSingleAction();
        }
    };
    const isMobileDevice = isMobile;
    const playButtonPadding = isMobileDevice ? "p-4" : "p-6";
    const playIconSize = isMobileDevice ? 22 : 32;
    
    return (
        <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            
            // onDoubleClick={onDoubleClick}
            className="absolute left-0 right-0 top-0 inset-0 z-10 flex h-full items-center justify-center p-4"
        >
            {!playing && !disablePlay && (
                <div className={`${playButtonPadding} cursor-pointer rounded-full bg-black/45 text-white/90 backdrop-blur-sm`}>
                    <FaPlay size={playIconSize} className="translate-x-[2px] text-white" />
                </div>
            )}
        </button>
    );
};
