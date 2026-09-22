"use client";
import { PlayerWrapper } from "@/components";
import { useSelector } from "react-redux";
import { useRef, useEffect } from "react";
import { RootState } from "@/lib/store";
import { Panel } from "@/components/Panel";
import ReactionsContainer from "@/components/Panel/ReactionsContainer";
import { useRoomContext } from "@/context/RoomContext";
import { useDispatch } from "react-redux";
import { updateRoomInfo, setUpgradeSubscriptionModal, setContentModal } from "@/lib/store/slices/roomSlice";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { useFileContext } from "@/context/FileContext";
// AFFILIATE GIFT (disabled) — the product sheet. Its only opener was the "see more"
// toggle inside ProductCarousel (the empty-state shelf), so with that gone nothing can
// set room.settings.bottomSheet and this could never be shown.
// import ProductBottomSheet from "@/components/Product/ProductBottomSheet";
import UpgradeSubscriptionModal from "@/components/Modals/UpgradeSubscriptionModal";
import PlaybackBlockedModal from "@/components/Modals/PlaybackBlockedModal";
import { isMobile } from "react-device-detect";
import { LuChevronDown } from "react-icons/lu";
import { RoomContentModal } from "@/components/Room/RoomContentModal";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import { setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appFixedViewportPageClass,
  roomPanelSheetClass,
  roomPanelSheetGripClass,
  roomPanelSheetHandleClass,
} from "@/components/UI/classTokens";
import FloatingCallOverlay from "@/components/VideoCall/FloatingCallOverlay";
import ActivityRoomSurface from "@/components/Activity/ActivityRoomSurface";
import ReconnectingBanner from "@/components/Party/ReconnectingBanner";
const Page = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isJoined, isHost } = useRoomContext();

  // Warn before tab close while user is in room
  useEffect(() => {
    if (!isJoined) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages and show their own generic warning
      // But we still need to set returnValue or return a string to trigger the dialog
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
      return ''; // Required for some other browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isJoined]);

  // * This code block is for cleaning up the orphaned screen share data from the playlist
  const { stream } = useMediaStreamContext();
  useEffect(() => {
    if (!stream && isHost) {
      const playlist = roomState.playlist;
      const hasScreenShare = playlist.some((item) => item.source === "screen");
      if (hasScreenShare) {
        console.log("Host has no stream - showing modal to prompt screen share");
        const newPlaylist = playlist
          .filter((item) => item.source !== "screen")
          .map((item, index) => ({ ...item, selected: index === 0 }));
        dispatch(updateRoomInfo({ playlist: newPlaylist }));
        // * We will not going to update in the database so we can keep those data in case we require to debugg it
        // updateRoomByRoomId({ roomId: roomState.roomId!, body: { playlist: newPlaylist } }).unwrap();  
      }
    }
  }, [stream, isHost, roomState.playlist, dispatch, roomState.roomId]);

  /**
   * * The below code block is responsible for cleaning i.e when there is a playlist in the database for local file streaming
   * * existed but it is not saved at all in the local storage access. So in that case because there is no reference of the actual files 
   * * which are stored then we gonna remove those all unneccessary files present in the playlist tabs
   * 
   * !The above assumption was wrong because while creating the room for screenshare the old file data was already stored in 
   * !playlist state so i just need to clean that up before creating a new room for screensharing so anymore below code block
   * !we will going to comment it out
   * 
   * * [Update]: Bringing this bottom code block again because it is usefull during the time When user did not given a permission of file editing
   * * so in that case when user reload on room page. The empty orphaned playlist appears which need to be cleaned
   */
  
  const { files, isInitialFilesLoaded } = useFileContext()
  useEffect(() => {
    if (!isHost || !isInitialFilesLoaded) return;
    console.log("------- This is file stream checker -----");
    const playlist = roomState.playlist;
    const fileContents = playlist.filter(content => content.source === 'file');
    if (!fileContents.length) return;
    // * This is basically a subset this prove whether all the file content are accessible in local storage or not.
    // const isAllPlaylistFileSaved = fileContents.every(content => files.some(file => file.id === content.id));
    const savedFileIds = new Set(files.map((file) => file.id));
    const isAllPlaylistFileSaved = fileContents.every((content) => savedFileIds.has(content.id));
    console.log('FileContext ===== Files & FilesContents ======', { files, fileContents, isAllPlaylistFileSaved })
    if (!isAllPlaylistFileSaved) {
      const existedFileContents = playlist.filter(content => (content.source === 'file' && savedFileIds.has(content.id)));
      const restContents = playlist.filter(content => content.source !== 'file');
      const newPlaylist = [...restContents, ...existedFileContents].map((content) => ({
          ...content,
          // selected: index === 0
      }));
      dispatch(updateRoomInfo({ playlist: newPlaylist }));
    }

  }, [files, isHost, isInitialFilesLoaded, roomState.playlist, dispatch])

  /**
   * Activity rooms put a game where the player goes. Everything else about the room —
   * the panel, the layout, chat, invites, participant limits — is unchanged, which is
   * why this is one flag rather than a second kind of room.
   */
  const isActivityRoom = roomState.playlist.some((item) => item.type === "activity");

  // `playerActive` is only ever set by the stream player's empty state, which never
  // mounts here — so an activity room would inherit whatever the last media room left
  // behind. A game always fills its surface, so treat it as active.
  const surfaceIsActive = isActivityRoom || roomState.settings.playerActive;

  const tRoom = useTranslations("room");
  const panelCollapsed = roomState.settings.panelCollapsed;
  const { addPlaylistContent, handleScreenShareStopped } = usePlaylistActions();
  const contentModalOpen = roomState.settings.contentModal;

  /**
   * A game room on a phone starts with the panel down, and leaving puts it back.
   *
   * Sharing the column, the board got roughly a quarter of the screen — the panel is a
   * chat log and takes what it is given. Collapsing on arrival hands the game the whole
   * viewport, and the bar under the board brings the panel back over it.
   *
   * The collapse is borrowed, not imposed: whatever the panel was before the game is
   * remembered and restored on the way out. Without that, exiting dropped you into a
   * video room with no panel and no obvious way back to it — the control that restores it
   * elsewhere lives in the player's overlay, which the empty state does not mount.
   *
   * Runs once per entry rather than on every render of one, so reopening the panel mid-game
   * and then rotating the phone does not shut it again. `isMobile` is a device check, which
   * is what this wants: the sheet only exists below md.
   */
  const panelBeforeGameRef = useRef<boolean | null>(null);
  // Read through a ref so capturing the pre-game value does not make this effect depend on
  // it — depending on it would re-run the effect the moment it collapses the panel.
  const panelCollapsedRef = useRef(panelCollapsed);
  panelCollapsedRef.current = panelCollapsed;

  useEffect(() => {
    if (isActivityRoom) {
      if (!isMobile || panelBeforeGameRef.current !== null) return;

      panelBeforeGameRef.current = panelCollapsedRef.current;
      dispatch(setPanelCollapsed({ panelCollapsed: true }));
      return;
    }

    // Out of the game — only our own collapse is undone. A null ref means we never
    // touched it (desktop, or the room was never a game), so nothing is restored.
    const before = panelBeforeGameRef.current;
    if (before === null) return;

    panelBeforeGameRef.current = null;
    dispatch(setPanelCollapsed({ panelCollapsed: before }));
  }, [isActivityRoom, dispatch]);

  const mobilePanelHeightClass = roomState.settings.bottomSheet
    ? "h-[40vh]"
    : surfaceIsActive
      ? "h-[75vh]"
      : "h-[60vh]";

  // While real video is playing, size the mobile player box to the video's 16:9 shape
  // instead of a fixed 40vh — that fixed box letterboxed the picture with black bars above
  // and below. The freed height goes to the panel below it. Not for games (they fill their
  // own surface) or the empty state (it needs the taller box for its content + shelf).
  const mobilePlayerFitsVideo = roomState.settings.playerActive && !isActivityRoom;

  const handleCloseUpgradeModal = () => {
    dispatch(setUpgradeSubscriptionModal({ open: false }));
  };

  return (
    <>
      {/* Upgrade Subscription Modal */}
      <UpgradeSubscriptionModal
        isOpen={roomState.settings.upgradeSubscriptionModal}
        onClose={handleCloseUpgradeModal}
        message={roomState.settings.upgradeSubscriptionMessage}
        // Only "games" is forwarded. The store also records "watch_time_session", which
        // the modal has no copy for — it keeps falling back to the room_full wording it
        // has always shown for that case, and still reports its own value to analytics.
        context={
          roomState.settings.upgradeSubscriptionContext === "games" ? "games" : "room_full"
        }
      />

      {/* Daily watch-limit block — non-dismissable, unlike the modal above */}
      <PlaybackBlockedModal
        isOpen={roomState.settings.isPlaybackBlocked}
        limit={roomState.settings.playbackBlockedInfo?.limit ?? 0}
        planName={roomState.settings.playbackBlockedInfo?.planName ?? "Free"}
      />

      <RoomContentModal
        open={contentModalOpen}
        onClose={() => dispatch(setContentModal({ open: false }))}
        onAddContent={addPlaylistContent}
        onScreenShareStopped={handleScreenShareStopped}
      />

      <div ref={containerRef} className={`${appFixedViewportPageClass} relative h-[100dvh] overflow-hidden flex flex-col md:flex-row`}>
        <div
          className={`
            relative z-10 w-full bg-transparent transition-all duration-300
            ${panelCollapsed
              ? "flex-1 h-full"
              : isActivityRoom
                // The panel is a sheet over this on a phone, so the game keeps the whole
                // viewport whether it is up or down. Above md it is a side column and the
                // surface shares the row as usual.
                ? "flex-1 h-full md:h-full"
                : mobilePlayerFitsVideo
                  ? "max-md:aspect-video max-md:shrink-0 md:h-full md:flex-1"
                  : "flex-1 h-[40vh] md:h-full"
            }
          `}
        >
          {isActivityRoom ? (
            // The exit control lives inside the surface, not here: leaving has to tell
            // the activity runtime as well as rewrite the playlist, and the session it
            // has to speak to only exists in there.
            <ActivityRoomSurface />
          ) : (
            <PlayerWrapper fullscreenTargetRef={containerRef} />
          )}
          {/* Socket recovery status — inside this container so it stays visible in fullscreen */}
          <ReconnectingBanner />
          {/* Flying Emoji Animations - Inside fullscreen container to work in fullscreen mode */}
          <ReactionsContainer />
          {/* AFFILIATE GIFT (disabled) */}
          {/* <ProductBottomSheet /> */}
          <FloatingCallOverlay />
        </div>
        <div
          className={`
            z-10 overflow-hidden bg-transparent transition-all duration-300 ease-in-out
            ${panelCollapsed
              ? "hidden"
              : `flex flex-col ${
                  isActivityRoom
                    ? roomPanelSheetClass
                    : mobilePlayerFitsVideo
                      ? "max-md:min-h-0 max-md:flex-1"
                      : mobilePanelHeightClass
                } md:h-full md:w-[25%] md:min-w-[320px] md:max-w-[420px] w-full z-40 md:z-auto shadow-2xl md:shadow-none md:relative`
            }
          `}
        >
          {isActivityRoom ? (
            <button
              type="button"
              onClick={() => dispatch(setPanelCollapsed({ panelCollapsed: true }))}
              className={roomPanelSheetHandleClass}
              aria-label={tRoom("closePanel")}
            >
              <span className={roomPanelSheetGripClass} />
              <LuChevronDown className="text-[14px]" />
            </button>
          ) : null}
          <Panel />
        </div>
      </div>
    </>
  );
};

export default Page;
