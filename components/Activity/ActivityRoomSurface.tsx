"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActivitySurface, useActivitySession } from "@movmash/arcade-client";
import { ImSpinner2 } from "react-icons/im";
import { LuArrowLeft, LuMessageCircle } from "react-icons/lu";

import { RootState } from "@/lib/store";
import { useSocket } from "@/context/SocketContext";
import { useRoomContext } from "@/context/RoomContext";
import { useI18n, useTranslations } from "@/i18n/I18nProvider";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import { setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import {
  roomActivityBarButtonClass,
  roomActivityBarClass,
  roomExitActivityClass,
} from "@/components/UI/classTokens";
import { useActivityTransport } from "./useActivityTransport";
import { activityDesignTokens } from "./activityTokens";

/**
 * The game, where the video player would otherwise be.
 *
 * Owns exactly one activity session for this room. Everything game-specific lives
 * behind `ActivitySurface` — this file never learns which game is running, and does
 * not import one.
 *
 * Whoever arrives first opens the session and everyone else joins it. The server
 * enforces one activity per room, so a second person pressing start lands in the
 * first one's game rather than opening a rival to it — which means the invite link
 * needs no new behaviour: share it, someone opens it, they land in the game.
 */
export function ActivityRoomSurface() {
  const { socket } = useSocket();
  const { isJoined } = useRoomContext();
  const { locale } = useI18n();
  const t = useTranslations("games");

  const roomState = useSelector((state: RootState) => state.room);
  const authUser = useSelector((state: RootState) => state.auth.user);

  const transport = useActivityTransport(socket);
  const session = useActivitySession({ transport });
  const { removeActivity } = usePlaylistActions();
  const dispatch = useDispatch();
  const isHost = roomState.host;
  const panelCollapsed = roomState.settings.panelCollapsed;

  const me = useMemo(
    () => ({
      userId: authUser?.id ?? "",
      username: authUser?.username ?? authUser?.name ?? "",
    }),
    [authUser],
  );

  /**
   * Which game this room was opened for. The synthetic playlist entry created at
   * `/games` carries it; the platform stores it as an opaque string and never
   * interprets it beyond passing it back to arcade.
   */
  const gameId = useMemo(() => {
    const entry =
      roomState.playlist.find((item) => item.type === "activity" && item.selected) ??
      roomState.playlist.find((item) => item.type === "activity");
    return entry?.link ?? null;
  }, [roomState.playlist]);

  // Two latches, both guarding against the same hazard: `session` is a new object on
  // every state change, so any effect depending on it re-runs while a request is still
  // in flight — and every request below changes state. Without these, each would be an
  // unbounded loop rather than a retry.
  const openedRef = useRef(false);          // one open/resume attempt per connection
  const joiningRef = useRef<string | null>(null); // one join per announced session

  /**
   * Resume first, start second.
   *
   * A reload has no session id to offer, so it asks to join whatever is running in
   * this room — the server hands back the seat this user already had. Only when there
   * is genuinely nothing to resume does the host open a new game, which also stops
   * two people opening two sessions in the same room.
   */
  const openOrJoin = useCallback(async () => {
    if (!gameId || openedRef.current) return;
    // Held for this connection. Every call below changes state, which hands this
    // component a new `session` object and re-runs the effect that called us — so a
    // flag that reopened on *failure* would be an unbounded loop of requests, not a
    // retry. A failure surfaces as an error the player can act on instead. Only a
    // reconnect clears it, in the effect below.
    openedRef.current = true;

    const resumed = await session.join();
    if (resumed) return;

    // "Nothing running here" is the normal answer for a fresh room, not a failure —
    // clear it so the surface shows "waiting" rather than an error nobody caused.
    session.clearError();

    // Anyone may open one, not only the host. The server turns a start into a join
    // when the room is already playing, so this cannot produce two sessions — and a
    // player who left a finished game and came back gets a fresh board immediately
    // instead of waiting on a host who is sitting on a final score.
    await session.start(gameId);
  }, [gameId, session]);

  useEffect(() => {
    if (!isJoined || !transport || session.sessionId) return;
    void openOrJoin();
  }, [isJoined, transport, session.sessionId, openOrJoin]);

  /**
   * Recover from a dropped socket — including the server restarting under us.
   *
   * The session id we are holding may mean nothing any more: after a deploy it
   * certainly does not, because the workers that held the board were terminated. But
   * this client cannot tell a two-second blip from a restart, and it does not have to.
   * Forget the session and re-run the resume path; the server is the one that knows.
   *
   *   brief blip      → join() resolves the room's session, we land back in our seat
   *   server restart  → nothing to resume, so the host opens a fresh game
   *
   * Without this the board stays on screen looking perfectly normal while every click
   * is silently dropped, because the grant recorded at join time belonged to a socket
   * that no longer exists.
   */
  const wasJoinedRef = useRef(false);
  useEffect(() => {
    if (isJoined) {
      wasJoinedRef.current = true;
      return;
    }
    if (!wasJoinedRef.current) return;

    wasJoinedRef.current = false;
    openedRef.current = false;
    joiningRef.current = null;
    // Local-only: a `leave` emitted now would be buffered and delivered after we
    // reconnect, ending the session we are about to rejoin.
    session.reset();
  }, [isJoined, session]);

  /**
   * Play another one after the session has ended.
   *
   * Deliberately a new session rather than a rewind of the old one: the game that
   * just ended produced a real result, which has already been reported and stored.
   * Rewinding would either discard that or file two different games under one id.
   *
   * Clearing the session id re-arms the resume effect above, so this needs no request
   * of its own — that effect is the only place a session is opened, and it finds the
   * room's game if someone else got there first.
   */
  const playAgain = useCallback(() => {
    openedRef.current = false;
    joiningRef.current = null;
    session.reset();
  }, [session]);

  // Join whatever somebody else announced.
  //
  // `session` is a fresh object on every state change, so this effect re-runs while a
  // join is still in flight — and `join` itself changes state by setting the phase.
  // Without a latch that is an unbounded loop of join requests.
  useEffect(() => {
    const offered = session.available;
    if (!offered) return;

    // Holding a session id is normally a reason to ignore an announcement — but not
    // when that session has ended. The winner of a forfeit sits on a final board whose
    // id refers to a game the server has already closed; without this they ignore the
    // fresh game their opponent just opened and the two of them wait on each other,
    // one reading "you win" and the other "waiting for an opponent".
    //
    // They have seen the result by now — it is on screen, and this only fires once
    // somebody actually opens the next game.
    if (session.sessionId && session.phase !== "ended") return;

    if (joiningRef.current === offered.sessionId) return;

    // One attempt per announced session, for the same reason as above.
    joiningRef.current = offered.sessionId;
    void session.join(offered.sessionId, { gameId: offered.gameId });
  }, [session]);

  /**
   * Leaving the game for good.
   *
   * Both halves are required and they are not interchangeable. `session.leave()` tells
   * the runtime this player is gone — it evicts the participant, and closes the session
   * once the last one goes (session-manager.ts: everyone.length === 0 -> finish). Only
   * then is the room free to open a different game, because `start` on a room that is
   * already playing is turned into a join of what is already running. `removeActivity()`
   * drops the playlist entry, which is what returns the video surface here and for
   * every guest.
   *
   * Doing only the second — which is what this did at first — leaves the session alive
   * on the server with nobody watching it. The next game picked in this room then
   * resumes that one instead, so choosing a different game reopened the old one.
   */
  const handleExitGame = useCallback(() => {
    session.leave();
    removeActivity();
  }, [session, removeActivity]);

  /**
   * Release the seat when this surface goes away for any other reason — most
   * importantly on a guest's screen, where the host removing the activity entry
   * unmounts this without anyone pressing anything. Without it the guest stays a
   * participant of a session nobody can see, which keeps it open and makes the host's
   * next pick resume the old game.
   *
   * Unmount only, and only while a session is actually held. A dropped socket does not
   * unmount this component (it flips `isJoined`), which is why this cannot fire on the
   * reconnect path the effect above is careful about.
   */
  const leaveOnUnmountRef = useRef<() => void>(() => {});
  leaveOnUnmountRef.current = () => {
    if (session.sessionId) session.leave();
  };
  useEffect(() => () => leaveOnUnmountRef.current(), []);

  /**
   * The room's own controls, under the board rather than over it.
   *
   * Chat is mobile-only: above md the panel is a column beside the game and is always
   * there, so a button to summon it would do nothing. Exit is host-only — the playlist is
   * shared state, so returning the surface is not a guest's call.
   *
   * Rendered even when the board is not up yet (choosing a game, waiting on a session), or
   * a host who opened the wrong game would have no way out of it.
   */
  const activityBar = (
    <div className={roomActivityBarClass}>
      {isHost ? (
        <button type="button" onClick={handleExitGame} className={roomExitActivityClass}>
          <LuArrowLeft className="text-[13px]" />
          {t("room.exitGame")}
        </button>
      ) : (
        <span />
      )}

      {panelCollapsed ? (
        <button
          type="button"
          onClick={() => dispatch(setPanelCollapsed({ panelCollapsed: false }))}
          className={`${roomActivityBarButtonClass} md:hidden`}
        >
          <LuMessageCircle className="text-[14px]" />
          {t("room.openPanel")}
        </button>
      ) : null}
    </div>
  );

  if (!gameId) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="relative min-h-0 flex-1">
          <Centered>
            <p className="text-sm text-white/50">{t("room.chooseGame")}</p>
          </Centered>
        </div>
        {activityBar}
      </div>
    );
  }

  if (!session.sessionId) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="relative min-h-0 flex-1">
        <Centered>
        {session.error ? (
          <p className="max-w-xs text-center text-sm text-rose-300">
            {session.error.message || t("room.unavailable")}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-white/40">
            <ImSpinner2 className="animate-spin" />
            {t("room.waiting")}
          </p>
        )}
        </Centered>
        </div>
        {activityBar}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* min-h-0 so the board is bounded by what is left after the bar, rather than
          overflowing it — a flex child defaults to its content's height. */}
      <div className="relative min-h-0 flex-1">
      {/*
        The session is over — a forfeit, or whatever else the game calls terminal.
        The final board stays on screen underneath, because the result is the point;
        this only adds the way out of it.

        Rendered here rather than by the game: starting a session is a platform act,
        so every game gets this without writing it. A game's own "rematch" is a
        different thing — same session, running score — and games that offer one keep
        it, because a rematch never ends the session.
      */}
      {session.phase === "ended" ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-5">
          <button
            type="button"
            onClick={playAgain}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {t("room.playAgain")}
          </button>
        </div>
      ) : null}

      <ActivitySurface
        session={session}
        me={me}
        tokens={activityDesignTokens}
        locale={locale}
        fallback={
          <Centered>
            <p className="flex items-center gap-2 text-sm text-white/40">
              <ImSpinner2 className="animate-spin" />
              {t("room.loadingBoard")}
            </p>
          </Centered>
        }
        renderError={(message) => (
          <Centered>
            <p className="max-w-xs text-center text-sm text-rose-300">{message}</p>
          </Centered>
        )}
      />
      </div>
      {activityBar}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center px-6">{children}</div>;
}

export default ActivityRoomSurface;
