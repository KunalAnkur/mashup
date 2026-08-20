"use client"

import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { useScreenShareQuality } from "@/hooks";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import {
    purplePinkAccentIconSurfaceClass,
    zincGlassBorderedSurfaceClass,
} from "@/components/UI/classTokens";
import { panelTabRootClass } from "./panelCardStyles";

const sourceTabCardClass =
    `${zincGlassBorderedSurfaceClass} rounded-2xl p-8 max-w-md w-full`;
const sourceTabButtonClass =
    "w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25";
const sourceTabCenterLayoutClass = "flex h-full flex-col items-center justify-center gap-4";
const sourceTabTitleClass = "mb-2 text-lg font-semibold text-white";
const sourceTabDescriptionClass = "text-sm text-white/60";

const SourceTab = () => {
    const { setStream, setScreenType } = useMediaStreamContext();
    const screenShareQuality = useScreenShareQuality();
    const tToast = useTranslations("toast");
    const tStream = useTranslations("stream");
    const handleShareScreen = async () => {
        try {
            // Shared with the other capture entry points so the quality ceiling is decided in
            // one place; this used to carry its own inline 480p constraint block.
            const { mediaStream, screenType } = await helper.captureTabStream({
                preferredDisplaySurface: "tab",
                quality: screenShareQuality,
            });
            // A dismissed picker is not a failure and should not raise a toast.
            if (!mediaStream) return;
            setStream(mediaStream);
            setScreenType(screenType);
        } catch {
            showError(tToast("screenSharingFailed"), tToast("checkPermissions"));
        }
    };
    return (
        <div className={`${panelTabRootClass} p-4`}>
            <div className={sourceTabCenterLayoutClass}>
                <div className={sourceTabCardClass}>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`w-16 h-16 rounded-full ${purplePinkAccentIconSurfaceClass}`}>
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={sourceTabTitleClass}>{tStream("screenShare")}</h3>
                            <p className={sourceTabDescriptionClass}>{tStream("screenShareDescription")}</p>
                        </div>
                        <button
                            className={sourceTabButtonClass}
                            onClick={handleShareScreen}
                        >
                            {tStream("screenShare")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SourceTab;
