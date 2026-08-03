"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { LuClock, LuSparkles } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackUpgradeClicked } from "@/lib/analytics";
import {
  appWatchLimitCardClass,
  appWatchLimitCardUrgentClass,
} from "@/components/UI/classTokens";

const URGENT_THRESHOLD_MINUTES = 5;

// Only renders once the backend has reported a capped daily usage — unlimited plans
// never receive a `usageUpdated` event, so this naturally stays hidden for them.
export default function WatchLimitIndicator() {
  const dailyUsage = useSelector((state: RootState) => state.room.dailyUsage);
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const router = useRouter();
  const t = useTranslations("panel");

  if (!dailyUsage) return null;

  const { remainingMinutes } = dailyUsage;
  const isUrgent = remainingMinutes <= URGENT_THRESHOLD_MINUTES;

  const handleUpgradeClick = () => {
    trackUpgradeClicked("panel_indicator", roomId);
    router.push("/pricing");
  };

  return (
    <section className="shrink-0 px-2 pb-3">
      <div className={isUrgent ? appWatchLimitCardUrgentClass : appWatchLimitCardClass}>
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUrgent ? "bg-rose-500/15" : "bg-white/[0.08]"
              }`}
          >
            <LuClock size={14} className={isUrgent ? "text-rose-300" : "text-white/70"} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[11px] font-semibold leading-tight ${isUrgent ? "text-rose-200" : "text-white/85"
                }`}
            >
              {t("watchLimit.minutesLeft", { minutes: remainingMinutes })}
            </p>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20 transition-colors hover:bg-amber-500/25"
          >
            <LuSparkles size={10} />
            {t("watchLimit.upgrade")}
          </button>
        </div>
      </div>
    </section>
  );
}
