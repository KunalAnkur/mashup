"use client";

import { LuShare2, LuX } from "react-icons/lu";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { useGetUrlMetadataMutation } from "@/lib/store/api/urlApi";
import { validateUrl } from "@/components/Modals/UrlModalComponents";
import { useFileContext } from "@/context/FileContext";
import { ExtendedFile } from "@/utils/filePersistence";
import { helper } from "@/utils";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Playlist, UrlMetadata } from "@/types/storeTypes";

interface Metadata {
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
    link?: string;
    siteName?: string;
}

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
    const { stream, setStream, setScreenType, handleStopScreenSharing } = useMediaStreamContext();

    const handleOpenAddUrlModal = () => {
        console.log("handleOpenAddUrlModal");
        if (!isHost || !roomState.roomId) return;
        setShowAddUrlModal(true);
        setUrlInput("");
        setUrlError("");
    }

    const handleCloseAddUrlModal = () => {
        console.log("handleCloseAddUrlModal");
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
        console.log("handleAddFiles");
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


    
    useEffect(() => {
        if (!stream) return;
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        const allTracks = [...videoTracks, ...audioTracks];
        // setStream(null);
        // setScreenType(null);
        allTracks.forEach(track => {
            track.addEventListener('ended', () => {
                console.log("hey there track ended");
                console.log("screen stream mediastream = [ContentSelection] track ended = ", stream);
                onScreenShareStopped(stream.id);
            });
        });
        console.log("stream", stream);
    }, [stream]);

    const handleShareScreen = async () => {
        console.log("handleShareScreen");
        if (!isHost || !roomState.roomId) return;
        setIsSharingScreen(true);
        try {
            if (stream) {
                console.log("screen stream mediastream = [ContentSelection] handle share screen = ", stream);
                handleStopScreenSharing();
            }
            const { mediaStream, screenType } = await helper.captureTabStream({
                audioOnly: false,
                preferredDisplaySurface: "tab",
            });
            setStream(mediaStream);
            setScreenType(screenType);
            if (!mediaStream) return;
            const screenItem: Playlist = {
                id: mediaStream.id,
                type: "stream",
                source: "screen",
                link: "Screen Share",
                selected: true,
                onlyAudio: false,
                metadata: {
                    title: "Screen Share",
                    description: "Live screen sharing session",
                    thumbnail: undefined,
                    author: authState.user?.name || authState.user?.username || "You",
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

    const [getUrlMetadata] = useGetUrlMetadataMutation();
    const handleAddUrl = async () => {
        if (!isHost || !roomState.roomId) return;
        const url = urlInput.trim();
        if (!url) {
            setUrlError("Please enter a URL");
            return;
        }
        const validation = validateUrl(url);
        if (!validation.valid) {
            setUrlError(validation.tooltip || "Invalid URL. Please enter a supported video URL.");
            return;
        }
        setIsAddingUrls(true);
        setUrlError("");
        try {
            const response = await getUrlMetadata(url).unwrap();
            console.log("response", response);
            const data = response.data as Metadata;
            const playList: Playlist = {
                id: crypto.randomUUID(),
                type: "sync",
                source: "url",
                link: data.link || url,
                selected: false,
                onlyAudio: false,
                metadata: {
                    ...(data.title && { title: data.title }),
                    ...(data.description && { description: data.description }),
                    ...(data.thumbnail && { thumbnail: data.thumbnail }),
                    ...(data.author && { author: data.author }),
                    ...(data.siteName && { siteName: data.siteName }),
                } as UrlMetadata,
            }
            // call the function here
            onAddContent([playList], "url");
        } catch (error) {
            console.error("error", error);
        } finally {
            setIsAddingUrls(false);
            handleCloseAddUrlModal();
        }
        console.log("handleAddUrl");
    }

    return (
        <>
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            {isHost && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={handleOpenAddUrlModal}
                        disabled={isAddingUrls}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAddingUrls ? (
                            <>
                                <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                                <span className="text-sm font-medium">Adding...</span>
                            </>
                        ) : (
                            <>
                                <LuPlus size={16} />
                                <span className="text-sm font-medium">Add URL</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleAddFiles}
                        disabled={isAddingFiles}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAddingFiles ? (
                            <>
                                <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                                <span className="text-sm font-medium">Adding...</span>
                            </>
                        ) : (
                            <>
                                <LuPlus size={16} />
                                <span className="text-sm font-medium">Add Files</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleShareScreen}
                        disabled={isSharingScreen}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSharingScreen ? (
                            <>
                                <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                                <span className="text-sm font-medium">Sharing...</span>
                            </>
                        ) : (
                            <>
                                <LuShare2 size={16} />
                                <span className="text-sm font-medium">Share Screen</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
            {showAddUrlModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={handleCloseAddUrlModal}
                >
                    <div
                        className="relative w-full max-w-md mx-4 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 shadow-xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
                                    <LuPlus className="text-white text-lg" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Add Video URL</h3>
                            </div>
                            <button
                                onClick={handleCloseAddUrlModal}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                                aria-label="Close"
                            >
                                <LuX size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Paste your video URL here"
                                    value={urlInput}
                                    onChange={handleUrlInputChange}
                                    onKeyDown={handleUrlInputKeyDown}
                                    className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
                                    disabled={isAddingUrls}
                                    autoFocus
                                />
                                {urlError && (
                                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                                        <span>⚠️</span>
                                        <span>{urlError}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCloseAddUrlModal}
                                    disabled={isAddingUrls}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddUrl}
                                    disabled={isAddingUrls || !urlInput.trim() || !!urlError}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAddingUrls ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LuPlus size={16} />
                                            <span>Add URL</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export { ContentSelection };
