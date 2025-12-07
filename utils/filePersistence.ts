import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types for File System Access API
interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile(): Promise<File>;
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: FileSystemWriteChunkType): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
}

type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams;

interface WriteParams {
    type: 'write' | 'seek' | 'truncate';
    data?: FileSystemWriteChunkType;
    position?: number;
    size?: number;
}

// Database schema
interface FilePersistenceDB extends DBSchema {
    files: {
        key: string;
        value: {
            id: string;
            handle: FileSystemFileHandle;
            name: string;
            type: string;
            size: number;
            lastModified: number;
        };
        indexes: { 'by-name': string };
    };
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'showOpenFilePicker' in window &&
        'FileSystemHandle' in window
    );
}

// Database instance
let dbInstance: IDBPDatabase<FilePersistenceDB> | null = null;
let dbOpeningPromise: Promise<IDBPDatabase<FilePersistenceDB> | null> | null = null;

// Initialize database
async function getDB(): Promise<IDBPDatabase<FilePersistenceDB> | null> {
    if (!isFileSystemAccessSupported()) {
        return null;
    }

    // Check if database is still open and valid
    if (dbInstance) {
        try {
            // Check if database is still open by trying to access objectStoreNames
            // This will throw if the database is closed
            const _ = dbInstance.objectStoreNames;
            return dbInstance;
        } catch (error) {
            // Database is closed, reset instance
            console.warn('Database connection was closed, reopening...');
            dbInstance = null;
        }
    }

    // If already opening, wait for that promise
    if (dbOpeningPromise) {
        return dbOpeningPromise;
    }

    // Open new database connection
    dbOpeningPromise = (async () => {
    try {
        dbInstance = await openDB<FilePersistenceDB>('video-files-db', 3, {
            upgrade(db, oldVersion) {
                if (!db.objectStoreNames.contains('files')) {
                    const store = db.createObjectStore('files', { keyPath: 'id' });
                    store.createIndex('by-name', 'name');
                }
                
            },
        });
            dbOpeningPromise = null;
            return dbInstance;
        } catch (error) {
            console.error('Failed to open IndexedDB:', error);
            dbInstance = null;
            dbOpeningPromise = null;
            return null;
        }
    })();

    return dbOpeningPromise;
}

// Request permission for a file handle
export async function requestFilePermission(
    handle: FileSystemFileHandle,
    showPrompt: boolean = false
): Promise<PermissionState> {
    if (!isFileSystemAccessSupported()) {
        return 'denied';
    }

    try {
        // Check current permission
        let permission = await handle.queryPermission({ mode: 'read' });
        
        // Request permission if not granted
        if (permission !== 'granted') {
            if (showPrompt) {
                // Show a helpful message before requesting
                console.log('Requesting file access permission...');
            }
            permission = await handle.requestPermission({ mode: 'read' });
            
            if (permission !== 'granted' && showPrompt) {
                console.warn('File access permission was denied');
            }
        }
        
        return permission;
    } catch (error) {
        console.error('Error requesting file permission:', error);
        return 'denied';
    }
}

// Save file handles to IndexedDB
export async function saveFileHandles(files: File[]): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    const db = await getDB();
    if (!db) {
        return false;
    }

    try {
        // Get file handles using showOpenFilePicker
        // Note: This requires user interaction, so we'll need to handle this differently
        // We'll store metadata and try to restore handles on load
        return true;
    } catch (error) {
        console.error('Error saving file handles:', error);
        return false;
    }
}

// Save file handle from showOpenFilePicker
export async function saveFileHandle(
    handle: FileSystemFileHandle
): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    try {
        let db = await getDB();
        if (!db) {
            return false;
        }

        // Check if database is still open
        try {
            const _ = db.objectStoreNames;
        } catch (error) {
            console.warn('Database connection closed, reopening...');
            // Force reopen
            dbInstance = null;
            db = await getDB();
            if (!db) {
                return false;
            }
        }

        const file = await handle.getFile();
        const id = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
        
        await db.put('files', {
            id,
            handle,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
        });

        return true;
    } catch (error: any) {
        // If error is about connection closing, try to reopen and retry once
        if (error.name === 'InvalidStateError' || error.message?.includes('closing')) {
            console.warn('Database connection was closing, retrying save...');
            try {
                dbInstance = null; // Force reopen
                const db = await getDB();
                if (db) {
                    const file = await handle.getFile();
                    const id = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
                    await db.put('files', {
                        id,
                        handle,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                    });
                    return true;
                }
            } catch (retryError) {
                console.error('Error saving file handle (retry failed):', retryError);
            }
        } else {
            console.error('Error saving file handle:', error);
        }
        return false;
    }
}

// Load all saved file handles
export async function loadFileHandles(): Promise<File[]> {
    if (!isFileSystemAccessSupported()) {
        return [];
    }

    try {
        let db = await getDB();
        if (!db) {
            return [];
        }

        // Check if database is still open
        try {
            const _ = db.objectStoreNames;
        } catch (error) {
            console.warn('Database connection closed, reopening...');
            dbInstance = null;
            db = await getDB();
            if (!db) {
                return [];
            }
        }

        const saved = await db.getAll('files');
        console.log(`loadFileHandles: Found ${saved.length} file handle(s) in IndexedDB`);
        const files: File[] = [];

        const permissionDeniedFiles: string[] = [];
        
        for (const item of saved) {
            try {
                // Check current permission first
                let permission = await item.handle.queryPermission({ mode: 'read' });
                console.log(`loadFileHandles: Permission for ${item.name}: ${permission}`);
                
                // If permission is not granted, try to request it once
                if (permission !== 'granted') {
                    console.log(`loadFileHandles: Requesting permission for ${item.name}...`);
                    permission = await item.handle.requestPermission({ mode: 'read' });
                    console.log(`loadFileHandles: Permission after request for ${item.name}: ${permission}`);
                }
                
                // Only load if permission is granted
                if (permission === 'granted') {
                    const file = await item.handle.getFile();
                    files.push(file);
                    console.log(`loadFileHandles: ✓ Successfully loaded file: ${file.name}`);
                } else {
                    // Permission denied even after request
                    permissionDeniedFiles.push(item.name);
                    console.warn(`loadFileHandles: Permission denied for ${item.name} after request, skipping`);
                }
            } catch (error: any) {
                console.error(`loadFileHandles: Error loading file ${item.name}:`, error);
                // Remove invalid handle from DB
                try {
                    // Re-check db connection before delete
                    if (!db || db.objectStoreNames.length === 0) {
                        dbInstance = null;
                        db = await getDB();
                    }
                    if (db) {
                        await db.delete('files', item.id);
                        console.log(`loadFileHandles: Removed invalid handle for ${item.name}`);
                    }
                } catch (deleteError) {
                    console.error('loadFileHandles: Error deleting invalid handle:', deleteError);
                }
            }
        }
        
        // Log permission denied files (but don't remove them - user might grant permission later)
        if (permissionDeniedFiles.length > 0) {
            console.warn(
                `loadFileHandles: ${permissionDeniedFiles.length} file(s) require permission: ${permissionDeniedFiles.join(', ')}. ` +
                `Please re-select them to grant access.`
            );
        }
        
        console.log(`loadFileHandles: Returning ${files.length} file(s)`);

        return files;
    } catch (error: any) {
        // If error is about connection closing, try to reopen and retry once
        if (error.name === 'InvalidStateError' || error.message?.includes('closing')) {
            console.warn('Database connection was closing, retrying load...');
            try {
                dbInstance = null; // Force reopen
                const db = await getDB();
                if (db) {
                    const saved = await db.getAll('files');
                    const files: File[] = [];
                    for (const item of saved) {
                        try {
                            const permission = await item.handle.queryPermission({ mode: 'read' });
                            if (permission === 'granted') {
                                const file = await item.handle.getFile();
                                files.push(file);
                            }
                        } catch (error) {
                            console.error(`Error loading file ${item.name}:`, error);
                        }
                    }
                    return files;
                }
            } catch (retryError) {
                console.error('Error loading file handles (retry failed):', retryError);
            }
        } else {
            console.error('Error loading file handles:', error);
        }
        return [];
    }
}

// Remove a file handle from storage by matching file properties
export async function removeFileHandle(
    fileName: string,
    fileSize: number,
    lastModified?: number
): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    const db = await getDB();
    if (!db) {
        return false;
    }

    try {
        const allFiles = await db.getAll('files');
        // Match by name and size (and lastModified if provided for better accuracy)
        const toDelete = allFiles.find((item) => {
            const nameMatch = item.name === fileName;
            const sizeMatch = item.size === fileSize;
            const timeMatch = lastModified ? item.lastModified === lastModified : true;
            return nameMatch && sizeMatch && timeMatch;
        });

        if (toDelete) {
            await db.delete('files', toDelete.id);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error removing file handle:', error);
        return false;
    }
}

// Remove a file handle by ID (more precise)
export async function removeFileHandleById(id: string): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    const db = await getDB();
    if (!db) {
        return false;
    }

    try {
        await db.delete('files', id);
        return true;
    } catch (error) {
        console.error('Error removing file handle by ID:', error);
        return false;
    }
}

// Clear all saved file handles
export async function clearFileHandles(): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    try {
        let db = await getDB();
        if (!db) {
            return false;
        }

        // Check if database is still open
        try {
            const _ = db.objectStoreNames;
        } catch (error) {
            console.warn('Database connection closed, reopening...');
            // Force reopen
            dbInstance = null;
            db = await getDB();
            if (!db) {
                return false;
            }
        }

        // Get count before clearing for logging
        const countBefore = await db.count('files');
        console.log(`clearFileHandles: Clearing ${countBefore} file handle(s) from IndexedDB`);
        
        // Clear all records
        await db.clear('files');
        
        // Verify clearing worked
        const countAfter = await db.count('files');
        if (countAfter === 0) {
            console.log(`clearFileHandles: ✓ Successfully cleared all file handles (${countBefore} removed)`);
            return true;
        } else {
            console.warn(`clearFileHandles: Warning - ${countAfter} file handle(s) still remain after clear`);
            // Try to delete remaining records individually
            const remaining = await db.getAll('files');
            for (const item of remaining) {
                try {
                    await db.delete('files', item.id);
                } catch (deleteError) {
                    console.error(`clearFileHandles: Error deleting remaining item ${item.id}:`, deleteError);
                }
            }
            return true;
        }
    } catch (error: any) {
        // If error is about connection closing, try to reopen and retry once
        if (error.name === 'InvalidStateError' || error.message?.includes('closing')) {
            console.warn('Database connection was closing, retrying clear...');
            try {
                dbInstance = null; // Force reopen
                const db = await getDB();
                if (db) {
                    const countBefore = await db.count('files');
                    await db.clear('files');
                    const countAfter = await db.count('files');
                    console.log(`clearFileHandles: ✓ Cleared ${countBefore} file handle(s) (retry)`);
                    return countAfter === 0;
                }
            } catch (retryError) {
                console.error('Error clearing file handles (retry failed):', retryError);
            }
        } else {
            console.error('Error clearing file handles:', error);
        }
        return false;
    }
}

// Show file picker and get handles
export async function showFilePicker(
    options?: {
        multiple?: boolean;
        types?: Array<{
            description: string;
            accept: Record<string, string[]>;
        }>;
    }
): Promise<FileSystemFileHandle[]> {
    if (!isFileSystemAccessSupported()) {
        throw new Error('File System Access API is not supported in this browser');
    }

    try {
        const handles = await(window as any).showOpenFilePicker({
          multiple: options?.multiple ?? true,
          types: options?.types ?? [
            {
              description: "Media files",
              accept: {
                "video/*": [
                  ".mp4",
                  ".mkv",
                  ".webm",
                  ".avi",
                  ".mov",
                  ".flv",
                  ".m3u8",
                ],
                "audio/*": [
                  ".mp3",
                  ".wav",
                  ".ogg",
                  ".aac",
                  ".m4a",
                  ".flac",
                  ".opus",
                  ".wma",
                ],
              },
            },
          ],
        });

        return handles;
    } catch (error: any) {
        // User cancelled the picker
        if (error.name === 'AbortError') {
            return [];
        }
        // Re-throw other errors (like SecurityError, etc.)
        throw error;
    }
}

// Check if there are files with denied permissions
export async function getPermissionDeniedFiles(): Promise<string[]> {
    if (!isFileSystemAccessSupported()) {
        return [];
    }

    const db = await getDB();
    if (!db) {
        return [];
    }

    try {
        const saved = await db.getAll('files');
        const deniedFiles: string[] = [];

        for (const item of saved) {
            try {
                const permission = await item.handle.queryPermission({ mode: 'read' });
                if (permission !== 'granted') {
                    deniedFiles.push(item.name);
                }
            } catch (error) {
                // If we can't check permission, assume it's denied
                deniedFiles.push(item.name);
            }
        }

        return deniedFiles;
    } catch (error) {
        console.error('Error checking permission denied files:', error);
        return [];
    }
}

// Note: Thumbnail storage functions removed - thumbnails are now stored as blob URLs in FileContext state
// This reduces IndexedDB usage and simplifies the code

// Get all file handles from IndexedDB (returns handles, not files)
export async function getAllFileHandles(): Promise<FileSystemFileHandle[]> {
    if (!isFileSystemAccessSupported()) {
        return [];
    }

    try {
        let db = await getDB();
        if (!db) {
            return [];
        }

        // Check if database is still open
        try {
            const _ = db.objectStoreNames;
        } catch (error) {
            console.warn('Database connection closed, reopening...');
            dbInstance = null;
            db = await getDB();
            if (!db) {
                return [];
            }
        }

        const saved = await db.getAll('files');
        const handles: FileSystemFileHandle[] = [];
        
        for (const item of saved) {
            try {
                // Check permission
                let permission = await item.handle.queryPermission({ mode: 'read' });
                if (permission !== 'granted') {
                    permission = await item.handle.requestPermission({ mode: 'read' });
                }
                
                if (permission === 'granted') {
                    handles.push(item.handle);
                }
            } catch (error) {
                console.error(`Error getting handle for ${item.name}:`, error);
            }
        }

        return handles;
    } catch (error) {
        console.error('Error getting file handles:', error);
        return [];
    }
}

// Append file handles to existing ones (for adding more files)
export async function appendFileHandles(newHandles: FileSystemFileHandle[]): Promise<boolean> {
    if (!isFileSystemAccessSupported() || newHandles.length === 0) {
        return false;
    }

    try {
        let db = await getDB();
        if (!db) {
            return false;
        }

        // Check if database is still open
        try {
            const _ = db.objectStoreNames;
        } catch (error) {
            console.warn('Database connection closed, reopening...');
            dbInstance = null;
            db = await getDB();
            if (!db) {
                return false;
            }
        }

        // Save each new handle
        for (const handle of newHandles) {
            try {
                const file = await handle.getFile();
                const id = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
                
                await db.put('files', {
                    id,
                    handle,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                });
                console.log(`appendFileHandles: ✓ Saved file handle: ${file.name}`);
            } catch (error) {
                console.error('Error saving file handle:', error);
            }
        }

        return true;
    } catch (error) {
        console.error('Error appending file handles:', error);
        return false;
    }
}

// Convert File objects to handles (if possible) and save them
// This is used when files are selected via traditional input
export async function saveFilesFromInput(files: File[]): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    // For files from input, we can't get handles directly
    // We need to use showOpenFilePicker to get handles
    // This function will be called after user selects files via showOpenFilePicker
    return true;
}

