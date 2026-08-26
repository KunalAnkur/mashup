"use client";

import { LuCrown, LuMonitor } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  isScreenShareQualityAllowed,
  offeredScreenShareQualities,
} from "@/utils/screenShareQuality";
import type { ScreenShareQualityControl } from "@/hooks/useScreenShareQualityControl";
import {
  appScreenShareQualityOptionActiveClass,
  appScreenShareQualityOptionClass,
  appScreenShareQualityOptionIdleClass,
  appScreenShareQualityOptionLockedClass,
  appScreenShareQualityRowClass,
} from "./classTokens";

interface ScreenShareQualityPickerProps {
  control: ScreenShareQualityControl;
  /**
   * Drops the written label, leaving the icon and the pills. For the in-room panel, which is
   * 272px at its narrowest — the word does not fit there beside three options, and the row
   * is already sitting under a button that says what it belongs to.
   */
  compact?: boolean;
  className?: string;
}

/**
 * Capture-quality picker.
 *
 * Every quality is listed for every user. The ones above the viewer's plan are shown locked
 * rather than hidden, because a ceiling nobody can see is a ceiling nobody knows they could
 * raise — and they stay clickable, since that click is the upgrade path.
 */
export const ScreenShareQualityPicker = ({
  control,
  compact = false,
  className = "",
}: ScreenShareQualityPickerProps) => {
  const tStream = useTranslations("stream");
  const { quality, planQuality, select } = control;
  const label = tStream("screenShareQualityLabel");

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <LuMonitor
          aria-hidden
          className={compact ? "text-sm text-violet-300" : "text-base sm:text-lg text-violet-300"}
        />
        {!compact && (
          <span className="text-xs sm:text-sm font-medium text-dashText">{label}</span>
        )}
      </div>

      <div role="radiogroup" aria-label={label} className={appScreenShareQualityRowClass}>
        {offeredScreenShareQualities.map((option) => {
          const locked = !isScreenShareQualityAllowed(option, planQuality);
          const selected = !locked && option === quality;
          const upgradeHint = tStream("screenShareQualityUpgradeHint", { quality: option });
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              // The label carries the whole sentence because the crown beside it is
              // decorative; a screen reader would otherwise read "1080p" and give no hint
              // that choosing it goes somewhere else entirely.
              aria-label={locked ? upgradeHint : option}
              title={locked ? upgradeHint : undefined}
              onClick={() => select(option)}
              className={`${appScreenShareQualityOptionClass} ${
                selected
                  ? appScreenShareQualityOptionActiveClass
                  : locked
                    ? appScreenShareQualityOptionLockedClass
                    : appScreenShareQualityOptionIdleClass
              }`}
            >
              {option}
              {locked && (
                <LuCrown aria-hidden className="ml-1 inline-block align-[-1px] text-[9px]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ScreenShareQualityPicker;
