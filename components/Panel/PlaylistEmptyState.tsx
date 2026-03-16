"use client";

import React from "react";
import { LuFilm } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { zincGlassBorderedSurfaceClass } from "@/components/UI/classTokens";

interface PlaylistEmptyStateProps {
    isFileStreaming: boolean;
}

export const PlaylistEmptyState: React.FC<PlaylistEmptyStateProps> = ({
    isFileStreaming,
}) => {
    const t = useTranslations("panel.playlist");
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className={`mb-4 rounded-2xl p-4 ${zincGlassBorderedSurfaceClass}`}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
                    <LuFilm className="text-white/70" size={24} />
                </div>
            </div>
            <h3 className="text-white font-semibold mb-2">{t("noVideos")}</h3>
            <p className="text-white/60 text-sm">
                {isFileStreaming
                    ? t("noVideosDescription")
                    : t("noVideosUrlDescription")
                }
            </p>
        </div>
    );
};
