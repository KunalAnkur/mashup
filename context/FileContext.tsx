import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { generateVideoThumbnail } from "@/utils/videoThumbnail";
import {
    isFileSystemAccessSupported,
    loadFileHandles,
    saveFileHandle,
    removeFileHandle,
    showFilePicker,
    clearFileHandles,
    getAllFileHandles,
    appendFileHandles,
    ExtendedFile,
} from "@/utils/filePersistence";
import { showInfo } from "@/utils/toast";
import { nanoid } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";



type FileContextType = {
    files: ExtendedFile[];
    
    thumbnails: Record<string, string>; // Map of file name to thumbnail data URL
    setFiles: (files: ExtendedFile[]) => Promise<void>;
    
    removeFile: (id: string) => void;
    getThumbnail: (file: File) => string | null;
    isPersistenceSupported: boolean;
    requestFilePicker: (append?: boolean) => Promise<ExtendedFile[]>;
    showPermissionPrompt: () => void;
};

const FileContext = createContext<FileContextType>({
    files: [],
    thumbnails: {},
    setFiles: async () => { },
    removeFile: () => { },
    getThumbnail: () => null,
    isPersistenceSupported: false,
    requestFilePicker: async () => [],
    showPermissionPrompt: () => { },
});

export const FileProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<ExtendedFile[]>([]);
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({}); // Store blob URLs
    const thumbnailBlobsRef = useRef<Record<string, Blob>>({}); // Track Blobs for cleanup
    const processingRef = useRef<Set<string>>(new Set());
    const [isPersistenceSupported, setIsPersistenceSupported] = useState(false);
    const permissionPromptShownRef = useRef(false);
    const playlist = useSelector((state: RootState) => state.room.playlist);
    // Check if File System Access API is supported
    useEffect(() => {
        setIsPersistenceSupported(isFileSystemAccessSupported());
    }, []);

    // Track if files have been loaded initially
    const filesLoadedRef = useRef(false);

    useEffect(() => {
        if (!playlist.length) return;
        const selectedFile = playlist.find(file => file.selected);
        if (selectedFile?.source !== 'file') return;
        const file = files.find(file => file.id === selectedFile.id);
        if (!file) return;
        file.selected = true;
        setFiles(files);
    }, [playlist]);
    // Load persisted files on mount - always try to load on mount
    useEffect(() => {
        const loadPersistedFiles = async () => {
            if (!isFileSystemAccessSupported()) {
                filesLoadedRef.current = true;
                return;
            }

            // Always try to load persisted files on mount
            // This ensures files are loaded on page refresh
            try {
                console.log('FileContext: Attempting to load persisted files...');
                const persistedFiles = await loadFileHandles();
                console.log(`FileContext: Found ${persistedFiles.length} persisted file(s) in IndexedDB`);
                
                if (persistedFiles.length > 0) {
                    // Always set persisted files on mount (they're the source of truth)
                    persistedFiles[0].selected = true;
                    console.log('FileContext: Selected file:', persistedFiles);
                    setFiles(persistedFiles);
                    // * maybe in rudux also need to updated here
                    console.log(`FileContext: ✓ Loaded ${persistedFiles.length} persisted file(s)`);
                    // Thumbnails will be generated automatically in the useEffect below
                } else {
                    console.log('FileContext: No persisted files found in IndexedDB');
                }
            } catch (error) {
                console.error('FileContext: Error loading persisted files:', error);
            } finally {
                filesLoadedRef.current = true;
            }
        };

        // Always load on mount (page refresh scenario)
        loadPersistedFiles();
    }, []); // Only run on mount

    // Reload persisted files when page becomes visible (handles refresh scenarios)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isFileSystemAccessSupported()) {
                // Always check for persisted files when page becomes visible
                // This handles the case where files might have been cleared or page was refreshed
                try {
                    const persistedFiles = await loadFileHandles();
                    if (persistedFiles.length > 0) {
                        // Update files if they're different or if we have none
                        setFiles((currentFiles) => {
                            if (currentFiles.length === 0) {
                                return persistedFiles;
                            }
                            
                            // Check if files are different
                            const currentKeys = new Set(
                                currentFiles.map(f => `${f.name}-${f.size}-${f.lastModified}`)
                            );
                            const persistedKeys = new Set(
                                persistedFiles.map(f => `${f.name}-${f.size}-${f.lastModified}`)
                            );
                            
                            if (currentKeys.size !== persistedKeys.size ||
                                ![...persistedKeys].every(key => currentKeys.has(key))) {
                                return persistedFiles;
                            }
                            
                            return currentFiles;
                        });
                        
                        // Update selected file if needed
                        persistedFiles[0].selected = true;
                        setFiles(persistedFiles);
                        
                        console.log(`Reloaded ${persistedFiles.length} persisted file(s) on visibility change`);
                        // Thumbnails will be generated automatically in the useEffect below
                    }
                } catch (error) {
                    console.error('Error reloading persisted files on visibility change:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isPersistenceSupported]);

    // Request file picker using File System Access API
    const requestFilePicker = async (append: boolean = false): Promise<ExtendedFile[]> => {
        if (!isFileSystemAccessSupported()) {
            throw new Error('File System Access API is not supported');
        }

        try {
            const handles = await showFilePicker();

            // If appending, preserve existing handles; otherwise clear all
            if (!append && handles.length > 0) {
                try {
                    console.log(`requestFilePicker: Clearing old file handle(s) before saving ${handles.length} new one(s)`);
                    const cleared = await clearFileHandles();
                    if (cleared) {
                        console.log('requestFilePicker: ✓ Successfully cleared all previously stored files');
                        // Small delay to ensure database operations complete and space is reclaimed
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } else {
                        console.warn('requestFilePicker: Warning - clearFileHandles returned false');
                    }
                } catch (error) {
                    console.error('requestFilePicker: Error clearing previous files:', error);
                }
            }

            const newFiles: ExtendedFile[] = [];
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                try {
                    const file = await handle.getFile();
                    const idx = crypto.randomUUID();
                    newFiles.push({
                        id: idx,
                        selected: false,
                        file: file,
                    } as ExtendedFile);
                    // Save handle for persistence
                    if (append) {
                        // Append mode: just save the new handle
                        await saveFileHandle(handle, idx);
                    } else {
                        // Replace mode: save handle (already cleared above)
                        await saveFileHandle(handle, idx);
                    }
                    console.log(`requestFilePicker: ✓ Saved file ${i + 1}/${handles.length}: ${file.name}`);
                } catch (error) {
                    console.error(`requestFilePicker: Error getting/saving file from handle ${i + 1}:`, error);
                }
            }
            
            console.log(`requestFilePicker: ✓ Successfully processed ${newFiles.length} file(s)${append ? ' (appended)' : ''}`);

            // Mark that files came from API to avoid double-clearing in setFilesWithPersistence
            filesFromAPIRef.current = true;

            return newFiles;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled
                return [];
            }
            throw error;
        }
    };

    // Show permission prompt
    const showPermissionPrompt = () => {
        if (permissionPromptShownRef.current) {
            return;
        }

        permissionPromptShownRef.current = true;
        
        const message = `📁 Allow file access to keep your videos after refresh`;

        // Show toast notification instead of alert
        showInfo(message, 5000);
        
        // Reset after 5 seconds to allow showing again if needed
        setTimeout(() => {
            permissionPromptShownRef.current = false;
        }, 5000);
    };

    const removeFile = async (id: string) => {
        // Find the file to remove by id
        const removedFile = files.find((file) => file.id === id);
        if (!removedFile) {
            return;
        }

        // Update local files state (remove the file)
        const updatedFiles = files.filter((file) => file.id !== id);
        setFiles(updatedFiles);

        const fileName = removedFile.file.name;

        // Revoke and remove thumbnail + processing refs, keyed by file name
        const thumbnailUrl = thumbnails[fileName];
        if (thumbnailUrl && thumbnailUrl.startsWith("blob:")) {
            URL.revokeObjectURL(thumbnailUrl);
        }

        setThumbnails((prev) => {
            const next = { ...prev };
            delete next[fileName];
            return next;
        });
        delete thumbnailBlobsRef.current[fileName];
        processingRef.current.delete(fileName);

        // Remove from persistence if supported
        if (isFileSystemAccessSupported()) {
            try {
                await removeFileHandle(removedFile.id);
            } catch (error) {
                console.error("Error removing file from persistence:", error);
            }
        }
    };

    // Helper to check if a file is a video (by MIME type or extension)
    const isVideoFile = (file: File): boolean => {
        // Check MIME type
        if (file.type.startsWith('video/')) {
            return true;
        }
        
        // Check file extension as fallback (for files with incorrect or missing MIME types)
        const videoExtensions = /\.(mp4|mkv|webm|avi|mov|mpeg|mpg|3gp|wmv|flv|m3u8|ogv|m4v)$/i;
        return videoExtensions.test(file.name);
    };

    // Generate thumbnails for new video files
    useEffect(() => {
        const generateThumbnailsForNewFiles = async () => {
            const newThumbnails: Record<string, string> = {};
            
            for (const extendedFile of files) {
                const file = extendedFile.file;
                // Only generate thumbnail for video files that don't have one yet and aren't being processed
                if (
                    isVideoFile(file) && 
                    !thumbnails[file.name] && 
                    !processingRef.current.has(file.name)
                ) {
                    processingRef.current.add(file.name);
                    
                    try {
                        // Always generate thumbnail (no IndexedDB lookup)
                        console.log(`Generating thumbnail for ${file.name} (type: ${file.type})`);
                        const thumbnailBlob = await generateVideoThumbnail(file);
                        
                        if (thumbnailBlob) {
                            // Create blob URL from the Blob
                            const blobUrl = URL.createObjectURL(thumbnailBlob);
                            newThumbnails[file.name] = blobUrl;
                            thumbnailBlobsRef.current[file.name] = thumbnailBlob;
                            console.log(`✓ Thumbnail generated and blob URL created for ${file.name}`);
                        } else {
                            console.warn(`✗ Failed to generate thumbnail for ${file.name}`);
                        }
                    } catch (error) {
                        console.error('Error generating thumbnail for', file.name, error);
                    } finally {
                        processingRef.current.delete(file.name);
                    }
                }
            }

            if (Object.keys(newThumbnails).length > 0) {
                setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
            }
        };

        generateThumbnailsForNewFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    // Helper to get thumbnail for a file
    const getThumbnail = (file: File): string | null => {
        return thumbnails[file.name] || null;
    };

    // Track if files were set via File System Access API (to avoid double-clearing)
    const filesFromAPIRef = useRef(false);

    // Enhanced setFiles that handles both persisted and non-persisted files
    const setFilesWithPersistence = async (newFiles: ExtendedFile[]) => {
        // Clear all previously stored files when new files are selected
        // This ensures we only keep the latest selection
        // Note: If files come from File System Access API, they're already cleared in requestFilePicker
        // So we only need to clear here for traditional input files
        if (isFileSystemAccessSupported() && newFiles.length > 0 && !filesFromAPIRef.current) {
            try {
                // Clear all persisted files from IndexedDB
                await clearFileHandles();
                console.log('Cleared all previously stored files before setting new ones (traditional input)');
            } catch (error) {
                console.error('Error clearing previous files:', error);
            }
        }

        // Reset the flag
        filesFromAPIRef.current = false;

        // Revoke all existing blob URLs before clearing thumbnails
        Object.values(thumbnails).forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        
        // Clear thumbnails state for old files (will be regenerated for new files)
        setThumbnails({});
        thumbnailBlobsRef.current = {};
        
        // Replace all files with new selection
        // Note: For files added via traditional input or drag-and-drop, we can't persist them
        // They need to be added via showOpenFilePicker to get handles
        // This is handled in the stream page component
        setFiles(newFiles as ExtendedFile[]);
        
    };

    return (
        <FileContext.Provider
            value={{
                files,
                thumbnails,
                setFiles: setFilesWithPersistence,
                removeFile,
                getThumbnail,
                isPersistenceSupported,
                requestFilePicker,
                showPermissionPrompt,
            }}
        >
            {children}
        </FileContext.Provider>
    );
};

export const useFileContext = () => useContext(FileContext);