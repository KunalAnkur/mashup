"use client";

import { appWhiteBorderClass } from "@/components/UI/classTokens";
import { LuFolderPlus, LuLink2, LuScreenShare } from "react-icons/lu";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { validateUrl } from "@/components/Modals/UrlModalComponents";
import { useFileContext } from "@/context/FileContext";
import { ExtendedFile } from "@/utils/filePersistence";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Playlist, UrlMetadata } from "@/types/storeTypes";
import { useTranslations } from "@/i18n/I18nProvider";
import { AddUrlModal } from "../AddUrlModal";
import { useScreenShareQualityControl, useScreenShareSupport } from "@/hooks";
import { ScreenShareQualityPicker } from "@/components/UI/ScreenShareQualityPicker";

type UrlMetadataResponseItem = {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
    siteName?: string;
    link?: string;
};

const contentSelectionToolbarGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3";
const contentSelectionToolbarButtonClass =
    `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl ${appWhiteBorderClass} px-2 py-2 text-center transition-all duration-200 hover:border-white/20 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50`;
const contentSelectionToolbarIconWrapClass =
    "flex h-5 w-5 items-center justify-center";
const contentSelectionToolbarLabelClass =
    "line-clamp-2 text-[10px] font-medium leading-tight text-white/90 md:text-[11px]";
// Sits under the toolbar grid, inset to match it. Local rather than a shared token: it is
// only this panel's spacing around a control that carries its own styling.
const contentSelectionQualityRowClass = "mt-2 justify-start";

type ContentSelectionProps = {
    onAddContent: (content: Playlist[], source: "file" | "url" | "screen") => void;
    onScreenShareStopped: (streamId: string) => void;
}
const ContentSelection = ({ onAddContent, onScreenShareStopped }: ContentSelectionProps) => {
    const roomState = useSelector((state: RootState) => state.room);
    const isHost = roomState.host;
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isAddingFiles, setIsAddingFiles] = useState(false);
    const [isAddingUrls, setIsAddingUrls] = useState(false);
    const [showAddUrlModal, setShowAddUrlModal] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [urlError, setUrlError] = useState("");
    const authState = useSelector((state: RootState) => state.auth);
    const { stream, setStream, setScreenType } = useMediaStreamContext();
    const canScreenShare = useScreenShareSupport();
    const qualityControl = useScreenShareQualityControl(stream);
    const screenShareQuality = qualityControl.quality;

    // The picker earns its place in this panel only while something is actually being
    // shared — that is when a host watches the room stutter and wants a way down. With no
    // live video track it would be a third control in an already dense column, answering a
    // question nobody has yet; /stream/screen is where quality gets chosen up front.
    const hasLiveScreenVideo = !!stream?.getVideoTracks().some((t) => t.readyState === "live");
    const t = useTranslations("sync");
    const tCommon = useTranslations("common");
    const tToast = useTranslations("toast");
    const tStream = useTranslations("stream");

    const handleOpenAddUrlModal = () => {
        if (!isHost || !roomState.roomId) return;
        setShowAddUrlModal(true);
        setUrlInput("");
        setUrlError("");
    }

    const handleCloseAddUrlModal = () => {
        setShowAddUrlModal(false);
        setUrlInput("");
        setUrlError("");
    }

    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
        setUrlError("");
    }

    const handleUrlInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !urlError && urlInput.trim()) {
            handleAddUrl();
        } else if (e.key === "Escape") {
            handleCloseAddUrlModal();
        }
    }

    // Functions related to adding content

    const { files, isPersistenceSupported, requestFilePicker, getThumbnail, showPermissionPrompt, setFiles } = useFileContext();
    const handleAddFiles = async () => {
        if (!isHost || !roomState.roomId) return;
        setIsAddingFiles(true);
        try {
            let newFiles: ExtendedFile[] = [];
            if (isPersistenceSupported) {
                const selectedFiles = await requestFilePicker(true);
                if (selectedFiles.length > 0) {
                    newFiles = selectedFiles;
                }
            } else {
                showPermissionPrompt();
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = "video/*";
                await new Promise<void>((resolve, reject) => {
                    input.onchange = async (e) => {
                        try {
                            const target = e.target as HTMLInputElement;
                            const fileList = target.files ? Array.from(target.files) : [];
                            if (fileList.length > 0) {
                                newFiles = fileList.map((f) => ({
                                    id: crypto.randomUUID(),
                                    selected: false,
                                    onlyAudio: f.type.startsWith('audio/'),
                                    file: f,
                                })) as ExtendedFile[];
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        } finally {
                            input.remove();
                        }
                    };

                    input.oncancel = () => {
                        resolve();
                        input.remove();
                    };

                    input.click();
                });
            }
            if (newFiles.length > 0) {
                const combined = [...files, ...newFiles];
                await setFiles(combined);

                const playlistItems: Playlist[] = newFiles.map((file) => ({
                    id: file.id,
                    type: "stream",
                    source: "file",
                    link: file.file.name,
                    selected: false,
                    onlyAudio: file.onlyAudio,
                    metadata: {
                        title: file.file.name,
                        description: file.file.name,
                        thumbnail: getThumbnail(file.file) || null,
                        author: file.file.name,
                    },
                }));

                // call the function here from playlist tab
                onAddContent(playlistItems, "file");
            }
            console.log("newFiles", newFiles);
        } catch (error) {
            console.error("error", error);
        } finally {
            setIsAddingFiles(false);
        }
    }

    // Read through a ref so the listener registration below depends on the stream alone.
    // `onScreenShareStopped` is rebuilt on every playlist change, and having it in the deps meant
    // re-running the effect constantly — which, with no cleanup, is how the listeners piled up.
    const onScreenShareStoppedRef = useRef(onScreenShareStopped);
    useEffect(() => {
        onScreenShareStoppedRef.current = onScreenShareStopped;
    }, [onScreenShareStopped]);

    /**
     * Fold the browser ending the capture back into the playlist.
     *
     * Two things make one "Stop sharing" click look like several. The listeners used to
     * accumulate across effect runs with nothing removing them, and the browser ends *every*
     * track of the capture — video and tab audio — so even a single clean registration fires
     * once per track. Each surviving call replayed the whole playlist rewrite: a room-update
     * request and a broadcast to every guest.
     *
     * The cleanup fixes the pile-up; `notified` collapses the per-track burst into one.
     */
    useEffect(() => {
        if (!stream) return;

        const tracks = [...stream.getVideoTracks(), ...stream.getAudioTracks()];
        let notified = false;

        const handleTrackEnded = () => {
            if (notified) return;
            notified = true;
            console.log("screen stream mediastream = [ContentSelection] track ended = ", stream);
            onScreenShareStoppedRef.current(stream.id);
        };

        tracks.forEach((track) => track.addEventListener("ended", handleTrackEnded));

        return () => {
            tracks.forEach((track) => track.removeEventListener("ended", handleTrackEnded));
        };
    }, [stream]);

    const handleShareScreen = async () => {
        console.log("handleShareScreen");
        if (!isHost || !roomState.roomId) return;
        // The button is already hidden where this is false; the guard covers the paths that
        // don't go through it — a stale render, or a keyboard/programmatic trigger.
        if (!canScreenShare) {
            showError(tStream("screenShareUnsupportedTitle"), tStream("screenShareUnsupportedDescription"));
            return;
        }
        setIsSharingScreen(true);
        try {
            // Held so the capture being replaced can be released below. Releasing it up here — as
            // the previous version of this did — is what interrupted the live share: the old
            // capture died the moment the picker opened, so dismissing the dialog left the host
            // streaming nothing.
            const supersededStream = stream;

            const { mediaStream, screenType } = await helper.captureTabStream({
                audioOnly: false,
                preferredDisplaySurface: "tab",
                quality: screenShareQuality,
            });
            // Bail before touching the context: a dismissed picker must leave the share that is
            // already running exactly as it was. Writing the null through first would drop the
            // only handle to those tracks while they stayed live.
            if (!mediaStream) return;

            setStream(mediaStream);
            setScreenType(screenType);

            // A replacement exists now, so the old one is safely disposable. Without this its
            // tracks stay live with nothing referencing them — setStream has just overwritten the
            // only handle — leaving a capture nothing can ever stop.
            if (supersededStream && supersededStream !== mediaStream) {
                supersededStream.getTracks().forEach((track) => track.stop());
            }
            const screenItem: Playlist = {
                id: mediaStream.id,
                type: "stream",
                source: "screen",
                link: tStream("screenShare"),
                selected: true,
                onlyAudio: false,
                metadata: {
                    title: tStream("screenShare"),
                    description: screenType ? `${screenType}-${tStream("liveScreenSharingSession")}` : tStream("liveScreenSharingSession"),
                    thumbnail: undefined,
                    author: authState.user?.name || authState.user?.username || tCommon("you"),
                },
            }
            // call the function here
            onAddContent([screenItem], "screen");
        } catch (error) {
            console.error("error", error);
        }
        finally {
            setIsSharingScreen(false);
        }
    }

    const handleAddUrl = async () => {
        if (!isHost || !roomState.roomId) return;
        const rawUrl = urlInput.trim();
        if (!rawUrl) {
            setUrlError(tToast("pleaseEnterUrl"));
            return;
        }
        const validation = validateUrl(rawUrl);
        if (!validation.valid) {
            setUrlError(validation.tooltip || tToast("invalidUrl"));
            return;
        }
        setIsAddingUrls(true);
        setUrlError("");
        try {
            // Check if it's a YouTube Mix playlist (RD) - these should only add the first video
            let isMixPlaylist = false;
            try {
                const urlObj = new URL(rawUrl);
                const playlistId = urlObj.searchParams.get("list");
                if (playlistId && playlistId.startsWith("RD")) {
                    isMixPlaylist = true;
                }
            } catch {
                // Ignore URL parsing errors
            }

            // Fetch metadata (and possible playlist) from backend
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const token = authState.token;

            const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ url: rawUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error ||
                    `Failed to fetch metadata: ${response.statusText}`;
                setUrlError(message);
                return;
            }

            const metadataItems = Array.isArray(data.data)
                ? (data.data as UrlMetadataResponseItem[])
                : [];
            const primaryItem = metadataItems[0];

            // Determine URLs to add
            let urlsToAdd: string[] = [];
            
            if (metadataItems.length > 0 && !isMixPlaylist) {
                // If backend returned playlist items, add all of them.
                urlsToAdd = metadataItems.map((item) => item.url);
            } else {
                // For single URLs and Mix playlists, use the normalized backend URL if available.
                urlsToAdd = [primaryItem?.url || rawUrl];
            }

            // Create Playlist items for all URLs
            const playlistEntries: Playlist[] = urlsToAdd.map((url, index) => {
                let metadata: UrlMetadata = {};
                if (metadataItems.length > 0 && !isMixPlaylist && metadataItems[index]) {
                    const item = metadataItems[index];
                    metadata = {
                        ...(item.title && { title: item.title }),
                        ...(item.description && { description: item.description }),
                        thumbnail: item.thumbnail || null,
                        ...(item.author && { author: item.author }),
                    };
                } else {
                    // For single URL or Mix, use the first returned metadata item.
                    metadata = {
                        ...(primaryItem?.title && { title: primaryItem.title }),
                        ...(primaryItem?.description && { description: primaryItem.description }),
                        thumbnail: primaryItem?.thumbnail || null,
                        ...(primaryItem?.author && { author: primaryItem.author }),
                        ...(primaryItem?.siteName && !primaryItem?.author && { author: primaryItem.siteName }),
                    };
                }

                return {
                    id: crypto.randomUUID(),
                    type: "sync",
                    source: "url",
                    link: url,
                    selected: false,
                    onlyAudio: false,
                    metadata,
                };
            });

            // call the function here with all playlist items
            onAddContent(playlistEntries, "url");
            handleCloseAddUrlModal();
        } catch (error: unknown) {
            console.error("error", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : typeof error === "object" &&
                        error !== null &&
                        "error" in error &&
                        typeof (error as { error?: string }).error === "string"
                      ? (error as { error?: string }).error || tToast("failedToAddUrl")
                      : tToast("failedToAddUrl");
            setUrlError(errorMessage);
        } finally {
            setIsAddingUrls(false);
        }
    }

    const toolbarButtons = [
        ...[{
            key: "url",
            label: t("addUrl"),
            busyLabel: t("loading"),
            disabled: isAddingUrls,
            busy: isAddingUrls,
            onClick: handleOpenAddUrlModal,
            icon: <LuLink2 size={14} className="text-pink-400 md:w-4 md:h-4" />,
            spinnerClassName: "border-pink-300/30 border-t-pink-300",
        },
        {
            key: "files",
            label: t("addFiles"),
            busyLabel: t("loading"),
            disabled: isAddingFiles,
            busy: isAddingFiles,
            onClick: handleAddFiles,
            icon: <LuFolderPlus size={14} className="text-amber-300 md:w-4 md:h-4" />,
            spinnerClassName: "border-amber-200/30 border-t-amber-200",
        }],
        ...(canScreenShare ? [{
            key: "screen",
            label: t("shareScreen"),
            busyLabel: t("sharing"),
            disabled: isSharingScreen,
            busy: isSharingScreen,
            onClick: handleShareScreen,
            icon: <LuScreenShare size={14} className="text-cyan-300 md:w-4 md:h-4" />,
            spinnerClassName: "border-cyan-200/30 border-t-cyan-200",
        }]: []),
    ];

    return (
        <>
        {isHost && (
            <div className={contentSelectionToolbarGridClass}>
                {toolbarButtons.map((button) => (
                    <button
                        key={button.key}
                        onClick={button.onClick}
                        disabled={button.disabled}
                        className={contentSelectionToolbarButtonClass}
                    >
                        <span className={contentSelectionToolbarIconWrapClass}>
                            {button.busy ? (
                                <span className={`h-3.5 w-3.5 rounded-full border-2 animate-spin ${button.spinnerClassName}`} />
                            ) : (
                                button.icon
                            )}
                        </span>
                        <span className={contentSelectionToolbarLabelClass}>
                            {button.busy ? button.busyLabel : button.label}
                        </span>
                    </button>
                ))}
            </div>
        )}
        {isHost && hasLiveScreenVideo && (
            <ScreenShareQualityPicker
                control={qualityControl}
                compact
                className={contentSelectionQualityRowClass}
            />
        )}
            <AddUrlModal
                isOpen={showAddUrlModal}
                urlInput={urlInput}
                urlError={urlError}
                isAdding={isAddingUrls}
                onClose={handleCloseAddUrlModal}
                onUrlInputChange={handleUrlInputChange}
                onUrlInputKeyDown={handleUrlInputKeyDown}
                onAddUrl={handleAddUrl}
            />
        </>
    );
};

export { ContentSelection };
