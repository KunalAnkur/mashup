"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuClock, LuSparkles } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { markWatchLimitNudgeShown } from "@/lib/store/slices/roomSlice";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackWatchLimitNudgeShown } from "@/lib/analytics";
import { showActionToast } from "@/utils/toast";
import UpgradeSubscriptionModal from "@/components/Modals/UpgradeSubscriptionModal";
import {
  appWatchLimitCardClass,
  appWatchLimitCardUrgentClass,
} from "@/components/UI/classTokens";

const URGENT_THRESHOLD_MINUTES = 5;
// The card has been sitting in the panel since minute one, so by the time it matters it has
// become furniture. One toast breaks through that once, early enough that the host can still
// upgrade before the room stalls mid-scene — 5 min is urgent but too late to act on.
const NUDGE_THRESHOLD_MINUTES = 10;

// Only renders once the backend has reported a capped daily usage — unlimited plans
// never receive a `usageUpdated` event, so this naturally stays hidden for them.
export default function WatchLimitIndicator() {
  const dailyUsage = useSelector((state: RootState) => state.room.dailyUsage);
  // The allowance is the host's, so only they can act on it — a viewer upgrading their own
  // account would not give this room any more minutes.
  const isHost = useSelector((state: RootState) => state.room.host);
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const nudgeShown = useSelector((state: RootState) => state.room.watchLimitNudgeShown);
  const t = useTranslations("panel");
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);

  // One-shot upgrade nudge as the allowance runs low. Host only — a viewer cannot buy their
  // way out of someone else's limit, so for them this would be pure interruption. At zero the
  // blocking modal takes over, so stay out of its way.
  useEffect(() => {
    if (!isHost || nudgeShown || !dailyUsage) return;

    const { remainingMinutes, limit } = dailyUsage;
    if (remainingMinutes <= 0 || remainingMinutes > NUDGE_THRESHOLD_MINUTES) return;

    dispatch(markWatchLimitNudgeShown());
    trackWatchLimitNudgeShown(roomId, remainingMinutes, limit);
    showActionToast(
      t("watchLimit.nudgeTitle", { minutes: remainingMinutes }),
      t("watchLimit.nudgeMessage"),
      t("watchLimit.upgrade"),
      () => setModalOpen(true)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyUsage, isHost, nudgeShown]);

  if (!dailyUsage) return null;

  const { remainingMinutes } = dailyUsage;
  const isUrgent = remainingMinutes <= URGENT_THRESHOLD_MINUTES;

  return (
    <>
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
                {/* The allowance is the host's. Saying just "43 min left" to a viewer reads as
                    their own quota, which is untouched — they could host their own room with a
                    full 45 right now. */}
                {t(isHost ? "watchLimit.minutesLeft" : "watchLimit.hostMinutesLeft", {
                  minutes: remainingMinutes,
                })}
              </p>
            </div>
            {isHost && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20 transition-colors hover:bg-amber-500/25"
              >
                <LuSparkles size={10} />
                {t("watchLimit.upgrade")}
              </button>
            )}
          </div>
        </div>
      </section>

      <UpgradeSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isHost={true}
        context="watch_limit"
      />
    </>
  );
}
