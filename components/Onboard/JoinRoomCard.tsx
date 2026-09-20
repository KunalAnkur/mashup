"use client";

import { ImSpinner2 } from "react-icons/im";
import { LuArrowRight } from "react-icons/lu";

import { useJoinRoom } from "@/hooks";
import { useTranslations } from "@/i18n/I18nProvider";
import { joinRoomIllustration } from "@/constants/assets";
import { ROOM_CODE_LENGTH } from "@/utils/validation";
import { Input } from "../UI";
import {
  dashJoinCardArtClass,
  dashJoinCardClass,
  dashJoinCardCopyClass,
  dashJoinCardDescriptionClass,
  dashJoinCardFormClass,
  dashJoinCardImgClass,
  dashJoinCardScrimClass,
  dashJoinCardTitleClass,
  dashJoinSubmitIconClass,
  dashJoinTileInputClass,
  dashJoinTileInputWrapClass,
} from "../UI/classTokens";

/**
 * Joining someone else's room, as the home rail's own card.
 *
 * It used to be the fifth tile in the Actions row, where it had to disguise itself as a
 * button and swap into a text field on click — a row of one-tap shortcuts has no room for
 * something that needs typing. With a column to itself the field is simply always there,
 * which is one less tap and one less thing to discover.
 *
 * It also no longer competes with the sidebar: every other Actions tile is a route that
 * "Watch Together" already lists, while this is the only one that takes input.
 */
const JoinRoomCard = () => {
  const t = useTranslations("home");
  const {
    roomId,
    isJoining,
    joinError,
    isJoinDisabled,
    inputRef,
    handleRoomIdChange,
    handleJoinRoom,
    handleKeyDown,
  } = useJoinRoom();

  return (
    <section className={dashJoinCardClass}>
      <div className={dashJoinCardArtClass}>
        {/* A plain <img>, matching GameCard and the sidebar illustration: the file is
            already a sized WebP on the CDN, so next/image would re-encode something that
            is already optimal and need asset.movmash.com in remotePatterns to do it.

            Decorative, so alt is empty — the art says "JOIN A ROOM" in English only, while
            the heading below is the real, translated one. No width/height here: the art
            box holds the aspect ratio itself, so there is nothing left to reserve. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={joinRoomIllustration}
          alt=""
          loading="lazy"
          decoding="async"
          className={dashJoinCardImgClass}
        />
        <div className={dashJoinCardScrimClass} />
      </div>

      <div className={dashJoinCardCopyClass}>
        <h2 className={dashJoinCardTitleClass}>{t("joinCardTitle")}</h2>
        <p className={dashJoinCardDescriptionClass}>{t("joinCardHint")}</p>

        <div className={dashJoinCardFormClass}>
          <div className={dashJoinTileInputWrapClass}>
            <Input
              ref={inputRef}
              variant="raw"
              type="text"
              placeholder={t("roomIdPlaceholder")}
              value={roomId}
              onChange={handleRoomIdChange}
              onKeyDown={handleKeyDown}
              disabled={isJoining}
              maxLength={ROOM_CODE_LENGTH}
              // A room code is a fixed-length token, not prose: stop the browser and the
              // keyboard from autocorrecting, capitalising or offering to autofill it.
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={dashJoinTileInputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={isJoinDisabled || isJoining}
            aria-label={t("join")}
            className={dashJoinSubmitIconClass}
          >
            {isJoining ? (
              <ImSpinner2 className="animate-spin text-[14px]" />
            ) : (
              <LuArrowRight className="text-[15px]" />
            )}
          </button>
        </div>

        {joinError ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-[10px] border border-red-400/20 bg-red-500/10 px-2.5 py-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[11.5px] leading-[1.45] text-red-200">{joinError}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default JoinRoomCard;
