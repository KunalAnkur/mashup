"use client";
import React from "react";
import {
    LuAppWindow,
    LuFilm,
    LuGlobe,
    LuMonitor,
    LuPause,
    LuPlay,
    LuRadioTower,
    LuX,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import { getPlatformById, getUrlDisplayName, detectPlatform, getPlatformByLink } from "@/types/ModalTypes/urlUtils";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Playlist } from "@/types/storeTypes";
import { useTranslations } from "@/i18n/I18nProvider";
import { RootState } from "@/lib/store";
import { appPulseSurfaceClass } from "@/components/UI/classTokens";
import { FaPause, FaPlay } from "react-icons/fa";


interface PlaylistCardProps {
    content: Playlist;
    host: boolean;
    index: number;
    onSelect?: (id: string, source: "file" | "url" | "screen") => void;
    onStop?: (id: string, source: "file" | "url" | "screen") => void;
    isLoading?: boolean;
}

type ScreenShareMode = "tab" | "window" | "screen" | "unknown";

const playlistCardInfoRowClass = "flex items-center gap-1.5 md:gap-2";
const playlistCardTitleBaseClass = "text-[11px] md:text-xs font-normal leading-tight";
const playlistCardScreenLabelClass = "text-[7px] font-semibold uppercase tracking-[0.14em]";
const playlistCardStopButtonClass =
    "flex h-6 w-6 flex-shrink-0 self-center items-center justify-center rounded-full bg-black/20 text-white/45 transition-all duration-200 hover:bg-black/30 hover:text-white/78";
const playlistCardScreenStatusIconClass =
    "flex h-6 w-6 flex-shrink-0 self-center items-center justify-center rounded-full text-xs";
const playlistCardNumberBadgeClass =
    "flex h-7 w-7 flex-shrink-0 self-center items-center justify-center rounded-full text-[10px] font-medium tabular-nums";
const playlistCardThumbnailClass =
    "relative h-10 w-14 shrink-0 self-center overflow-hidden rounded-lg md:h-11 md:w-[72px]";

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const PlaylistCard: React.FC<PlaylistCardProps> = ({
    content,
    host,
    index,
    onSelect,
    onStop,
    isLoading = false,
}) => {
    const { source, selected: isSelected, link, metadata } = content;
    const isClickable = source !== "screen" && host;
    const hostPlaybackPlaying = useSelector((state: RootState) => state.room.hostPlayback.playing);
    const { files, getThumbnail } = useFileContext();
    const { screenType, stream, handleStopScreenSharing } = useMediaStreamContext();
    const t = useTranslations("panel.playlist");
    const tStream = useTranslations("stream");
    const handleClick = () => {
        if (isClickable && onSelect) {
            // The playlist tab is hidden in activity rooms, so `source` is always
            // a media source here; the guard keeps the type honest.
            if (source !== "game") onSelect(content.id, source);
        }
    };
    const isPlaybackActive = isSelected && hostPlaybackPlaying;
    const titleClass = isSelected ? "text-white/92" : "text-white/72";
    const secondaryTextClass = `text-[9px] md:text-[10px] ${isSelected ? "text-white/48" : "text-white/38"}`;
    const badgePlayButtonClass = source === "screen"
        ? "bg-cyan-200/15 text-cyan-50/90 shadow-[0_6px_16px_rgba(15,23,42,0.22)]"
        : "bg-white/14 text-white/92 shadow-[0_6px_16px_rgba(15,23,42,0.18)]";

    const getScreenShareMode = (): ScreenShareMode => {
        const rawMode = metadata?.description?.split("-")[0]?.trim()?.toLowerCase() || screenType?.toLowerCase() || "";

        if (rawMode === "tab" || rawMode === "browser") {
            return "tab";
        }

        if (rawMode === "window") {
            return "window";
        }

        if (rawMode === "monitor" || rawMode === "screen" || rawMode === "display") {
            return "screen";
        }

        return "unknown";
    };

    const screenShareMode = source === "screen" ? getScreenShareMode() : "unknown";
    const screenShareLabelMap: Record<ScreenShareMode, string> = {
        tab: t("screenShareTab"),
        window: t("screenShareWindow"),
        screen: t("screenShareScreen"),
        unknown: t("screenShareLive"),
    };

    const renderPlaybackButton = () => {
        const Icon = isPlaybackActive ? FaPause : FaPlay;

        return (
            <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${badgePlayButtonClass}`}
            >
                <Icon size={10} className={isPlaybackActive ? "" : "ml-[1px]"} />
            </span>
        );
    };

    const renderScreenShareThumbnail = () => {
        const surfaceClassMap: Record<ScreenShareMode, string> = {
            tab: "bg-[linear-gradient(135deg,#34d399,#0f766e)]",
            window: "bg-[linear-gradient(135deg,#a78bfa,#6d28d9)]",
            screen: "bg-[linear-gradient(135deg,#7dd3fc,#0369a1)]",
            unknown: "bg-[linear-gradient(135deg,#94a3b8,#334155)]",
        };

        const iconMap: Record<ScreenShareMode, React.ComponentType<{ className?: string; size?: number }>> = {
            tab: LuGlobe,
            window: LuAppWindow,
            screen: LuMonitor,
            unknown: LuRadioTower,
        };

        const label = screenShareLabelMap[screenShareMode];
        const Icon = iconMap[screenShareMode];

        if (screenShareMode === "tab") {
            return (
                <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${surfaceClassMap.tab}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
                    <div className="relative flex items-center gap-1.5 text-white">
                        <Icon size={10} />
                        <span className={playlistCardScreenLabelClass}>
                            {label}
                        </span>
                    </div>
                </div>
            );
        }

        if (screenShareMode === "window") {
            return (
                <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${surfaceClassMap.window}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
                    <div className="relative flex items-center gap-1.5 text-white">
                        <Icon size={10} />
                        <span className={playlistCardScreenLabelClass}>
                            {label}
                        </span>
                    </div>
                </div>
            );
        }

        if (screenShareMode === "screen") {
            return (
                <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${surfaceClassMap.screen}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
                    <div className="relative flex items-center gap-1.5 text-white">
                        <Icon size={10} />
                        <span className={playlistCardScreenLabelClass}>
                            {label}
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${surfaceClassMap.unknown}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
                <div className="relative flex items-center gap-1.5 text-white">
                    <Icon size={10} />
                    <span className={playlistCardScreenLabelClass}>
                        {label}
                    </span>
                </div>
            </div>
        );
    };

    // Render thumbnail based on card source
    const renderThumbnail = () => {
        if (source === "url") {
            const platform = getPlatformByLink(link);

            if (isLoading) {
                return (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                );
            }

            if (metadata?.thumbnail) {
                return (
                    <img
                        src={metadata.thumbnail}
                        alt={metadata?.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                );
            }

            return (
                <div className="absolute inset-0 flex items-center justify-center bg-white/[0.04]">
                    <span className="text-white/75 text-base md:text-lg">
                        {platform?.smallIcon || <LuFilm className="text-white text-xs md:text-sm" />}
                    </span>
                </div>
            );
        }

        if (source === "screen") {
            return renderScreenShareThumbnail();
        }

        if (source === "file") {
            const ext = files.find((f) => f.id === content.id);
            if (!ext) return null;
            const file = ext.file;
            const thumbnail = getThumbnail(file);
            if (thumbnail) {
                return (
                    <img
                        src={thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                );
            }
            return (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                    <LuFilm className="text-white/45" size={16} />
                </div>
            );
        }
    };

    // Render metadata section
    const renderMetadata = () => {
        if (source === "url") {
            const platformId = link ? detectPlatform(link) : null;
            const platform = platformId ? getPlatformById(platformId) : null;
            const hasMetadata = metadata && (metadata.title || metadata.thumbnail);

            if (isLoading) {
                return (
                    <div className="space-y-1 md:space-y-1.5">
                        <div className={`h-3 md:h-3.5 w-3/4 ${appPulseSurfaceClass}`} />
                        <div className="h-2 md:h-2.5 bg-white/5 rounded w-1/2 animate-pulse" />
                    </div>
                );
            }

            if (hasMetadata && metadata) {
                return (
                    <>
                        <div className={playlistCardInfoRowClass}>
                            <p
                                className={`${playlistCardTitleBaseClass} line-clamp-1 ${titleClass}`}
                            >
                                {metadata.title || getUrlDisplayName(link)}
                            </p>
                        </div>
                        {metadata.description && (
                            <p className="text-[9px] md:text-[10px] text-white/42 line-clamp-1 leading-tight">
                                {metadata.description}
                            </p>
                        )}
                        <div className={`mt-0.5 flex items-center gap-1 md:gap-1.5 ${secondaryTextClass}`}>
                            {metadata.author && (
                                <span className="truncate max-w-[60px] md:max-w-[80px]">{metadata.author}</span>
                            )}
                            {metadata.author && platform && <span>•</span>}
                            {platform && <span className="truncate">{platform.name}</span>}
                        </div>
                    </>
                );
            }

            return (
                <>
                    <div className={playlistCardInfoRowClass}>
                        <p
                            className={`${playlistCardTitleBaseClass} truncate ${titleClass}`}
                        >
                            {getUrlDisplayName(link)}
                        </p>
                    </div>
                    {platform && (
                        <p className={`${secondaryTextClass} truncate`}>{platform.name}</p>
                    )}
                </>
            );
        }

        if (source === "screen") {
            const platformName = metadata?.title || tStream("screenShare");
            return (
                <>
                    <div className={playlistCardInfoRowClass}>
                        <p
                            className={`${playlistCardTitleBaseClass} line-clamp-1 ${titleClass}`}
                        >
                            {platformName}
                        </p>
                    </div>
                    <p className={`${secondaryTextClass} truncate`}>
                        {screenShareLabelMap[screenShareMode]} • {t("screenSharingActive")}
                    </p>
                </>
            );
        }

        if (source === "file") {
            const ext = files.find((f) => f.id === content.id);
            if (!ext) return null;
            const file = ext.file;
            return (
                <>
                    <div className={playlistCardInfoRowClass}>
                        <p
                            className={`${playlistCardTitleBaseClass} line-clamp-1 ${titleClass}`}
                        >
                            {metadata?.title || link}
                        </p>
                    </div>
                    <p className={`${secondaryTextClass} truncate`}>
                        {file.size ? `${formatFileSize(file.size)} • ` : ""}{t("localFile")}
                    </p>
                </>
            );
        }
    };

    // Render right action (index or stop button)
    const renderRightAction = () => {
        const handleStop = (id: string, source: "file" | "url" | "screen") => {
            console.log("screen stream mediastream = [PlaylistCard] Stopping screen stream = ", stream);
            handleStopScreenSharing()
            if (onStop) {
                onStop(content.id, source);
            }
        };
        if (source === "screen" && host && onStop) {
            return (
                <button
                    onClick={() => handleStop(content.id, source)}
                    className={playlistCardStopButtonClass}
                    title={t("stopScreenSharing")}
                >
                    <LuX size={11} className="md:w-3 md:h-3" />
                </button>
            );
        }

        if (source === "screen") {
            return (
                <div
                    className={`
            ${playlistCardScreenStatusIconClass}
            ${isSelected ? "bg-white/[0.1] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "bg-white/[0.04] text-white/35"}
          `}
                >
                    <LuRadioTower size={9} className="md:w-2.5 md:h-2.5" />
                </div>
            );
        }

        return (
            isSelected ? (
                renderPlaybackButton()
            ) : (
                <div
                    className={`${playlistCardNumberBadgeClass} bg-white/[0.04] text-white/45`}
                >
                    {index + 1}
                </div>
            )
        );
    };

    const CardWrapper = isClickable ? "button" : "div";
    const cardClassName = `
        group relative flex w-full shrink-0 items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-2 text-left transition-all duration-200
        ${isSelected
            ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.04))] shadow-[0_14px_34px_rgba(0,0,0,0.22)]"
            : "bg-white/[0.015] hover:bg-white/[0.03]"}
        ${isClickable ? "cursor-pointer" : "cursor-default"}
      `;

    return (
        <CardWrapper
            onClick={handleClick}
            className={cardClassName}
        >
            {isSelected && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_42%)]"
                />
            )}

            {/* Thumbnail */}
            <div
                className={`
          ${playlistCardThumbnailClass}
          ${isSelected
              ? "bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "bg-white/[0.03]"}
        `}
            >
                {renderThumbnail()}
            </div>

            {/* Metadata */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden text-left">
                {renderMetadata()}
            </div>

            {/* Right Action */}
            {renderRightAction()}
        </CardWrapper>
    );
};

export { PlaylistCard };
