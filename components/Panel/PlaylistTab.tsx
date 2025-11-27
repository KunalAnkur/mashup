"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { useVideoSelection } from "@/context/VideoSelectionContext";
import { LuPlay, LuFilm, LuLock, LuCrown } from "react-icons/lu";

const PlaylistTab = () => {
    const roomState = useSelector((state: RootState) => state.room);
    const { files } = useFileContext();
    const { selectVideo, isHost } = useVideoSelection();

    const isFileMode = roomState.sourceType === "file";
    const urls = roomState.urls;
    const selectedIndex = roomState.selectedFileIndex;

    // Handle video selection (only host can select)
    const handleSelectVideo = (index: number) => {
        if (!isHost) return;
        selectVideo(index);
    };

    // Get video name from URL or file
    const getVideoName = (index: number): string => {
        if (isFileMode && files[index]) {
            return files[index].name;
        }
        
        if (urls[index]) {
            try {
                const url = new URL(urls[index]);
                // Try to extract a meaningful name from the URL
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    const lastPart = pathParts[pathParts.length - 1];
                    // Decode and clean up the name
                    return decodeURIComponent(lastPart).replace(/[-_]/g, ' ').slice(0, 40);
                }
                return url.hostname;
            } catch {
                return `Video ${index + 1}`;
            }
        }
        
        return `Video ${index + 1}`;
    };

    // Get thumbnail or placeholder for video
    const getVideoThumbnail = (index: number): string | null => {
        // For YouTube URLs, we can generate a thumbnail
        const url = urls[index];
        if (url) {
            try {
                const urlObj = new URL(url);
                if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                    let videoId = '';
                    if (urlObj.hostname.includes('youtu.be')) {
                        videoId = urlObj.pathname.slice(1);
                    } else {
                        videoId = urlObj.searchParams.get('v') || '';
                    }
                    if (videoId) {
                        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }
                }
            } catch {
                return null;
            }
        }
        return null;
    };

    // Determine what items to show
    const getPlaylistItems = () => {
        if (isFileMode) {
            // For file mode, use files array
            return files.map((_, index) => index);
        }
        // For URL mode, use urls array
        return urls.map((_, index) => index);
    };

    const playlistItems = getPlaylistItems();

    // Empty state
    if (playlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                    <LuFilm className="text-gray-500" size={32} />
                </div>
                <h3 className="text-white font-semibold mb-2">No videos</h3>
                <p className="text-gray-500 text-sm">
                    {isFileMode 
                        ? "No video files have been added to this party yet."
                        : "No video URLs have been added to this party yet."
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">
                        Playlist
                    </h3>
                    <span className="text-gray-500 text-xs">
                        ({playlistItems.length} {playlistItems.length === 1 ? 'video' : 'videos'})
                    </span>
                </div>
                {!isHost && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <LuLock size={12} />
                        <span>Host controls</span>
                    </div>
                )}
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {playlistItems.map((index) => {
                    const isSelected = selectedIndex === index;
                    const thumbnail = getVideoThumbnail(index);
                    const videoName = getVideoName(index);

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelectVideo(index)}
                            disabled={!isHost}
                            className={`
                                w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                                ${isSelected 
                                    ? 'bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30' 
                                    : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                                }
                                ${!isHost ? 'cursor-default' : 'cursor-pointer'}
                                group
                            `}
                        >
                            {/* Thumbnail */}
                            <div className={`
                                relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0
                                ${isSelected ? 'ring-2 ring-pink-500/50' : ''}
                            `}>
                                {thumbnail ? (
                                    <img 
                                        src={thumbnail} 
                                        alt={videoName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                        <LuFilm className="text-gray-500" size={16} />
                                    </div>
                                )}
                                
                                {/* Play indicator overlay */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                            <LuPlay className="text-white ml-0.5" size={12} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Video Info */}
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                    <p className={`
                                        text-sm font-medium truncate
                                        ${isSelected ? 'text-pink-400' : 'text-white'}
                                    `}>
                                        {videoName}
                                    </p>
                                    {isSelected && (
                                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                            Playing
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {isFileMode 
                                        ? (files[index] ? formatFileSize(files[index].size) : 'Local file')
                                        : (urls[index] ? new URL(urls[index]).hostname : 'URL')
                                    }
                                </p>
                            </div>

                            {/* Index number */}
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                                ${isSelected 
                                    ? 'bg-pink-500/20 text-pink-400' 
                                    : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                                }
                            `}>
                                {index + 1}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Host indicator */}
            {isHost && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <LuCrown className="text-amber-500" size={14} />
                        <span>You're the host. Click a video to switch.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default PlaylistTab;

