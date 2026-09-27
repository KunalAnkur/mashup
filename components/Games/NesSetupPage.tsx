"use client";

/**
 * Pick a cartridge, get a room.
 *
 * The same shape as `/stream` and `/sync`: choose the thing first, and the room opens
 * already playing it. Games used to be the exception — the room opened empty and asked
 * inside it — which for a game needing a file of your own meant whoever you invited
 * sat watching a file picker.
 *
 * The cartridge never leaves this machine. It is handed to the room through
 * `lib/activity/handoff.ts`, in memory, for the moment between this page and that one.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { LuUpload, LuX } from "react-icons/lu";

import { RootState } from "@/lib/store";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import type { Playlist } from "@/types/storeTypes";
import { useTranslations } from "@/i18n/I18nProvider";
import { clearHandoff, putHandoff } from "@/lib/activity/handoff";
import {
  appEntryPrimaryButtonClass,
  appSectionTitleTextClass,
  dashPageContentWrapClass,
  dashPageTitleWrapClass,
  zincGlassLgPanelSurfaceClass,
} from "@/components/UI/classTokens";

/** iNES and NES 2.0 both start with "NES\x1a". */
const CARTRIDGE = [0x4e, 0x45, 0x53, 0x1a];

/** "PK" — every zip starts with it, whatever the rest of the header says. */
const ZIP = [0x50, 0x4b];

/**
 * Archives the game cannot open, checked so the message can say which one it is.
 *
 * ROM downloads are almost always archives, so "that is not a cartridge" would be
 * technically true and useless — the file is fine, it just has the wrong wrapper on
 * it. The game unwraps zip and nothing else, using the browser's own
 * `DecompressionStream`; rar and 7z would each be a library.
 */
const OTHER_ARCHIVES: readonly (readonly number[])[] = [
  [0x52, 0x61, 0x72, 0x21], // rar
  [0x37, 0x7a, 0xbc, 0xaf], // 7z
  [0x1f, 0x8b], // gzip
];

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * 4 MB covers every licensed cartridge ever made several times over, and the largest
 * homebrew by a wide margin. The point is not to be exact — it is to reject a DVD rip
 * someone dragged in by mistake before it is read into memory.
 */
const MAX_BYTES = 4 * 1024 * 1024;

interface Chosen {
  name: string;
  bytes: Uint8Array;
  /** A zip, still wrapped. The game opens it; see `accept`. */
  archive: boolean;
}

export function NesSetupPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const t = useTranslations("nesSetup");
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const inputRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [starting, setStarting] = useState(false);

  /**
   * Leaving *without* starting must not leave a cartridge waiting for the next room.
   *
   * The distinction is the whole point, and missing it made this page not work at all.
   * Starting navigates, which unmounts this component — so an unconditional cleanup
   * threw away the cartridge a few milliseconds after handing it over, every single
   * time. The room then opened and asked for a file you had already chosen, which
   * looks exactly like the handover never being wired up.
   *
   * A ref rather than the `starting` state: cleanup runs with the values from the last
   * committed render, and the navigation can win that race.
   */
  const handedOver = useRef(false);
  useEffect(
    () => () => {
      if (!handedOver.current) clearHandoff();
    },
    [],
  );

  const accept = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setError(null);

      if (file.size > MAX_BYTES) {
        setError(t("tooBig"));
        return;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      /*
       * Enough of a check to catch a holiday video, and no more.
       *
       * A zip is passed through exactly as it arrived: the game already unwraps one —
       * finding the cartridge inside, skipping the `__MACOSX` junk, rejecting an
       * encrypted entry — and that code runs on this file either way. Repeating any of
       * it here would mean a second zip reader in a second package, free to disagree
       * with the first about what is in the archive.
       *
       * The trade is that "this zip has no cartridge in it" is discovered one screen
       * later, on the picker, with the game's own explanation. That is the same place
       * and the same sentence as dropping a bad zip into a room today.
       */
      if (startsWith(bytes, ZIP)) {
        setChosen({ name: file.name, bytes, archive: true });
        return;
      }

      if (OTHER_ARCHIVES.some((signature) => startsWith(bytes, signature))) {
        setError(t("unsupportedArchive"));
        return;
      }

      if (bytes.length < 16 || !startsWith(bytes, CARTRIDGE)) {
        setError(t("notACartridge"));
        return;
      }

      setChosen({ name: file.name, bytes, archive: false });
    },
    [t],
  );

  const start = useCallback(() => {
    if (!chosen || starting) return;
    setStarting(true);

    // Taken by the game exactly once. See `lib/activity/handoff.ts`.
    handedOver.current = true;
    putHandoff({ kind: "nes-rom", name: chosen.name, bytes: chosen.bytes });

    // The same two dispatches every other entry point makes: one synthetic playlist
    // entry describing what the room is for, and the flag that tells `AuthGuard` to
    // create the room and navigate. `link` carries the game id.
    const entry: Playlist = {
      id: crypto.randomUUID(),
      type: "activity",
      source: "game",
      link: "nes",
      selected: true,
      onlyAudio: false,
      metadata: {},
    };
    dispatch(setPlaylist([entry]));
    dispatch(setRefers({ refer: true }));

    if (!isAuthenticated) router.push("/login");
  }, [chosen, starting, dispatch, isAuthenticated, router]);

  /**
   * Give up waiting, and say so.
   *
   * Creating the room happens somewhere else — `AuthGuard` watches for the flag above
   * and navigates — so nothing here is told when it fails. The shape of that failure
   * is documented in `AuthGuard` itself: the page dispatches, nothing happens, and the
   * button sits in a loading state forever with no error to show. It is exactly what
   * this page did when its own route was missing from that file's list.
   *
   * A spinner that never resolves is the worst version of a failure, because there is
   * nothing to try. This turns it back into a button and a sentence.
   */
  useEffect(() => {
    if (!starting) return;
    const timer = setTimeout(() => {
      setStarting(false);
      setError(t("couldNotStart"));
    }, 12_000);
    return () => clearTimeout(timer);
  }, [starting, t]);

  return (
    <div className={dashPageContentWrapClass}>
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className={dashPageTitleWrapClass}>
          <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-white/55">{t("subtitle")}</p>

        <input
          ref={inputRef}
          type="file"
          accept=".nes,.zip"
          className="hidden"
          onChange={(event) => {
            void accept(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {chosen ? (
          <div
            className={`${zincGlassLgPanelSurfaceClass} flex items-center gap-3 rounded-2xl p-4`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 text-pink-200">
              <CartridgeGlyph />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {chosen.name}
              </span>
              <span className="block text-xs text-white/45">
                {chosen.archive
                  ? t("readyArchive", {
                      size: `${Math.round(chosen.bytes.length / 1024)} KB`,
                    })
                  : t("ready", { size: `${Math.round(chosen.bytes.length / 1024)} KB` })}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setChosen(null)}
              aria-label={t("remove")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <LuX className="text-[15px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void accept(event.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed px-6 py-12 transition-colors duration-150 ${
              dragging
                ? "border-pink-400/60 bg-pink-500/[0.06]"
                : "border-zinc-600/35 bg-white/[0.02] hover:border-zinc-500/50 hover:bg-white/[0.035]"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.05] text-white/55">
              <LuUpload className="text-[19px]" />
            </span>
            <span className="text-sm font-semibold text-white/85">{t("dropHeading")}</span>
            <span className="text-xs text-white/45">{t("dropHint")}</span>
          </button>
        )}

        {error ? (
          <p className="mt-3 text-xs font-medium text-amber-300/90">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={start}
          disabled={!chosen || starting}
          className={`${appEntryPrimaryButtonClass} mt-6 flex w-full items-center`}
        >
          {starting ? t("starting") : t("start")}
        </button>

        <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
          {t("privacy")}
        </p>
      </div>
    </div>
  );
}

/** The same cartridge the game draws on its own picker, so the two screens rhyme. */
function CartridgeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 2.5h10.2a1 1 0 0 1 .7.3l2.6 2.6a1 1 0 0 1 .3.7V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect x="7.5" y="6.5" width="9" height="6" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="7.5" y="16.5" width="2" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
      <rect x="11" y="16.5" width="2" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
      <rect x="14.5" y="16.5" width="2" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
