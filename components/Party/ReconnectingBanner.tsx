"use client";

import { LuTriangleAlert } from "react-icons/lu";
import { useRoomContext } from "@/context/RoomContext";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appReconnectBannerClass,
  appReconnectBannerFailedClass,
  appReconnectBannerSpinnerClass,
  appReconnectBannerWrapClass,
} from "@/components/UI/classTokens";

/**
 * Non-blocking status pill shown over the player while the socket is recovering.
 *
 * A dropped socket is not the same thing as leaving the room. The client rejoins on its own,
 * and the room's state is held through the outage, so this deliberately avoids a modal or any
 * teardown of the player — it just tells the user why playback paused and that they do not
 * need to do anything.
 *
 * The copy stays "Reconnecting..." whatever the cause. Whether the drop was a deploy or a bad
 * network is our problem, not the viewer's, and naming it would only invite worry about
 * something they cannot act on.
 *
 * Renders nothing in the normal connected case, so it costs no layout.
 */
const ReconnectingBanner = () => {
  const { isReconnecting, connectionFailed } = useRoomContext();
  const t = useTranslations("room");

  if (!isReconnecting && !connectionFailed) return null;

  return (
    <div className={appReconnectBannerWrapClass}>
      {connectionFailed ? (
        <div className={appReconnectBannerFailedClass} role="alert">
          <LuTriangleAlert size={14} className="shrink-0" />
          <span>{t("connectionLostReload")}</span>
        </div>
      ) : (
        <div className={appReconnectBannerClass} role="status" aria-live="polite">
          <span className={appReconnectBannerSpinnerClass} aria-hidden="true" />
          <span>{t("reconnectingBanner")}</span>
        </div>
      )}
    </div>
  );
};

export default ReconnectingBanner;
