"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useCallStream } from "@/context/CallStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import { useTranslations } from "@/i18n/I18nProvider";
import UpgradeSubscriptionModal from "@/components/Modals/UpgradeSubscriptionModal";
import CallTiles from "../VideoCall/CallTiles";
import { LuLayoutGrid, LuLoader, LuLock, LuPhone, LuVideo } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { setContentModal } from "@/lib/store/slices/roomSlice";
import {
  panelRoomActionsAddClass,
  panelRoomActionsAddIconClass,
  panelRoomActionsCardClass,
  panelRoomActionsLockedHintClass,
  panelRoomActionsMobileAddClass,
  panelRoomActionsMobileRowClass,
  panelRoomActionsRowClass,
} from "@/components/UI/classTokens";

export default function PanelCallSection() {
  const {
    isJoining,
    isInCall,
    isHost,
    hostIsPremium,
    remoteParticipants,
    joinCall,
  } = useCallStream();
  const { participants } = useRoomContext();
  const t = useTranslations("room.callUpsell");
  const tCall = useTranslations("room.call");
  const tRoom = useTranslations("room");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const dispatch = useDispatch();
  // Host only, matching every other way into the playlist. A guest sees the call row
  // exactly as before.
  const canAddContent = useSelector((state: RootState) => state.room.host);
  const openContentModal = () => dispatch(setContentModal({ open: true }));

  // Non-premium rooms still show the real call control — pressing a button opens the
  // upgrade sheet instead of joining, so the feature is visible and one tap from unlock.
  const locked = !hostIsPremium;
  const hasActiveRemoteCall = remoteParticipants.size > 0 && !locked;

  const startAudio = () => {
    if (locked) return setUpgradeOpen(true);
    void joinCall({ micOn: true, cameraOn: false });
  };
  const startVideo = () => {
    if (locked) return setUpgradeOpen(true);
    void joinCall({ micOn: true, cameraOn: true });
  };

  const renderStartButtons = (compact = false) => {
    const sizeClass = compact ? "h-7 w-7" : "h-9 w-9";
    const iconSize = compact ? 13 : 16;
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={startAudio}
          className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-white/[0.08] text-white/78 ring-1 ring-white/10 transition-colors hover:bg-white/[0.14] hover:text-white`}
          aria-label={locked ? t("hostHint") : tCall("startAudioCall")}
          title={locked ? t("hostHint") : tCall("startAudioCall")}
        >
          <LuPhone size={iconSize} />
        </button>
        <button
          type="button"
          onClick={startVideo}
          className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-400 ${
            compact ? "" : "shadow-lg shadow-emerald-950/30"
          }`}
          aria-label={locked ? t("hostHint") : tCall("startVideoCall")}
          title={locked ? t("hostHint") : tCall("startVideoCall")}
        >
          <LuVideo size={iconSize} />
        </button>
      </div>
    );
  };

  const restingTitle = locked ? t("title") : tCall("startCall");
  const restingHint = locked
    ? isHost
      ? t("hostHint")
      : t("guestHint")
    : tCall("peopleInRoom", { count: participants.length });

  /**
   * A host gets the Change button where the call's title and hint used to be; a guest,
   * who has no Change button, keeps the copy so the two phone icons are still explained.
   */
  const callCopy = (compact: boolean) => (
    <div className="min-w-0 flex-1">
      <p
        className={`flex items-center gap-1 leading-tight text-white/85 ${
          compact ? "text-[11px] font-medium" : "text-[11px] font-semibold"
        }`}
      >
        {locked ? (
          <LuLock size={11} className="shrink-0 text-amber-200/80" />
        ) : compact ? (
          <LuPhone size={12} className="shrink-0" />
        ) : null}
        <span className="truncate">{restingTitle}</span>
      </p>
      {!compact ? (
        <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
          {restingHint}
        </p>
      ) : null}
    </div>
  );

  const restingCard = (
    <>
      {/* Mobile: one row, no card. The panel is the whole screen on a phone and every
          pixel of chrome comes out of the chat. */}
      <div className={panelRoomActionsMobileRowClass}>
        {canAddContent ? (
          <button
            type="button"
            onClick={openContentModal}
            className={panelRoomActionsMobileAddClass}
          >
            <LuLayoutGrid size={13} className={panelRoomActionsAddIconClass} />
            <span className="truncate">{tRoom("addContent")}</span>
          </button>
        ) : (
          callCopy(true)
        )}
        {renderStartButtons(true)}
      </div>

      {/* Desktop: Change and the call buttons share one row. */}
      <div
        className={`hidden md:block ${panelRoomActionsCardClass} ${
          locked ? "ring-amber-400/15" : ""
        }`}
      >
        <div className={panelRoomActionsRowClass}>
          {canAddContent ? (
            <button
              type="button"
              onClick={openContentModal}
              className={panelRoomActionsAddClass}
            >
              <LuLayoutGrid size={15} className={panelRoomActionsAddIconClass} />
              <span className="truncate">{tRoom("addContentLabel")}</span>
            </button>
          ) : (
            callCopy(false)
          )}
          {renderStartButtons()}
        </div>

        {/* The one thing the row cannot say for itself: these buttons open an upsell
            rather than a call. Only for a host — a guest already has the copy above. */}
        {locked && canAddContent ? (
          <p className={panelRoomActionsLockedHintClass}>
            <LuLock size={10} className="shrink-0 text-amber-200/80" />
            <span className="truncate">{restingHint}</span>
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <section className="shrink-0 px-2 pb-2 md:pb-3">
      {!isInCall && !isJoining ? (
        hasActiveRemoteCall ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-white/85">
                  {tCall("liveNow")}
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                  {tCall("sharingInRoom", { count: remoteParticipants.size })}
                </p>
              </div>
              {renderStartButtons()}
            </div>
            <CallTiles compact showControls={false} layout="responsive" />
          </div>
        ) : (
          restingCard
        )
      ) : isJoining ? (
        <div className="space-y-2">
          {hasActiveRemoteCall && (
            <CallTiles compact showControls={false} layout="responsive" />
          )}
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-3 ring-1 ring-white/[0.08]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]">
              <LuLoader className="animate-spin text-white/70" size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight text-white/85">
                {tCall("startingFeed")}
              </p>
              <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                {tCall("startingFeedHint")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <CallTiles compact layout="responsive" />
        </div>
      )}

      {locked && (
        <UpgradeSubscriptionModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          isHost={isHost}
          context="calls"
        />
      )}
    </section>
  );
}
