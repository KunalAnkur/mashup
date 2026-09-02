"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { LuClock, LuSparkles } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import UpgradeSubscriptionModal from "@/components/Modals/UpgradeSubscriptionModal";

const URGENT_THRESHOLD_MINUTES = 5;

/**
 * Mobile-only watch-limit strip. Replaces WatchLimitIndicator's full card on small screens
 * (that card is `hidden md:block`) with a single ~30px pill so the chat keeps the panel
 * height. The low-minutes toast + zero-minutes blocking modal still come from
 * WatchLimitIndicator, which stays mounted on every breakpoint.
 *
 * The calls prompt is not folded in here — it lives in PanelCallSection as the real call
 * control (locked), on every breakpoint.
 */
export default function PanelMobilePlanBar() {
  const dailyUsage = useSelector((state: RootState) => state.room.dailyUsage);
  const isHost = useSelector((state: RootState) => state.room.host);
  const tPanel = useTranslations("panel");
  const [modalOpen, setModalOpen] = useState(false);

  if (!dailyUsage) return null;

  const { remainingMinutes } = dailyUsage;
  const isUrgent = remainingMinutes <= URGENT_THRESHOLD_MINUTES;

  const limitLabel = tPanel(
    isHost ? "watchLimit.minutesLeft" : "watchLimit.hostMinutesLeft",
    { minutes: String(remainingMinutes) }
  );

  const body = (
    <div
      className={`flex w-full items-center gap-2 rounded-full px-3 py-1.5 ring-1 transition-colors ${
        isUrgent
          ? "bg-rose-500/10 ring-rose-400/20"
          : "bg-white/[0.04] ring-white/[0.06]"
      }`}
    >
      <span
        className={`flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-medium ${
          isUrgent ? "text-rose-200" : "text-white/75"
        }`}
      >
        <LuClock size={12} className="shrink-0" />
        <span className="truncate">{limitLabel}</span>
      </span>

      {isHost && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20">
          <LuSparkles size={10} />
          {tPanel("watchLimit.upgrade")}
        </span>
      )}
    </div>
  );

  return (
    <>
      <section className="shrink-0 px-2 pb-2 md:hidden">
        {isHost ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full text-left"
          >
            {body}
          </button>
        ) : (
          body
        )}
      </section>

      {isHost && (
        <UpgradeSubscriptionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isHost
          context="watch_limit"
        />
      )}
    </>
  );
}
