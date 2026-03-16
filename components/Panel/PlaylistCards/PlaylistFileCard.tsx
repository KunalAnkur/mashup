import React from "react";
import { LuPlay, LuFilm } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { appMutedGroupHoverSurfaceClass } from "@/components/UI/classTokens";
import {
    panelCardHoverSurfaceClass,
    panelCardSurfaceClass,
} from "../panelCardStyles";

interface PlaylistFileCardProps {
    file: File;
    index: number;
    isPlaying: boolean;
    isHost: boolean;
    thumbnail: string | null;
    onSelect: () => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const PlaylistFileCard: React.FC<PlaylistFileCardProps> = ({
    file,
    index,
    isPlaying,
    isHost,
    thumbnail,
    onSelect,
}) => {
    const t = useTranslations("panel.playlist");
    return (
        <button
            onClick={onSelect}
            disabled={!isHost}
            className={`
                group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0
                ${isPlaying
                    ? 'bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30'
                    : `${panelCardSurfaceClass} border border-transparent ${isHost ? panelCardHoverSurfaceClass : ""}`
                }
                ${!isHost ? 'cursor-default' : 'cursor-pointer'}
            `}
        >
            {/* Thumbnail */}
            <div className={`
                relative w-20 h-13 rounded-lg overflow-hidden shrink-0 
                ${isPlaying ? 'ring-2 ring-pink-500/50' : ''}
                bg-gradient-to-br from-zinc-700 to-zinc-800
            `}>
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <LuFilm className="text-gray-500" size={20} />
                    </div>
                )}
                
                {/* Play indicator overlay */}
                {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <LuPlay className="text-white ml-0.5" size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* File info */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold line-clamp-1 leading-tight ${
                        isPlaying ? 'text-pink-400' : 'text-gray-200'
                    }`}>
                        {file.name}
                    </p>
                    {isPlaying && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                            {t("playing")}
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-[10px] truncate">
                    {formatFileSize(file.size)} • {t("localFile")}
                </p>
            </div>

            {/* Index number */}
            <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
                ${isPlaying
                    ? 'bg-pink-500/20 text-pink-400'
                    : `${appMutedGroupHoverSurfaceClass} text-gray-500`
                }
            `}>
                {index + 1}
            </div>
        </button>
    );
};
