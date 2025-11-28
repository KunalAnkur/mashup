import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { generateVideoThumbnail } from "@/utils/videoThumbnail";

type FileContextType = {
    files: File[];
    selectedFile: File | null;
    thumbnails: Record<string, string>; // Map of file name to thumbnail data URL
    setFiles: (files: File[]) => void;
    setSelectedFile: (file: File | null) => void;
    removeFile: (index: number) => void;
    getThumbnail: (file: File) => string | null;
};

const FileContext = createContext<FileContextType>({
    files: [],
    selectedFile: null,
    thumbnails: {},
    setFiles: () => { },
    setSelectedFile: () => { },
    removeFile: () => { },
    getThumbnail: () => null,
});

export const FileProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
    const processingRef = useRef<Set<string>>(new Set());

    const removeFile = (index: number) => {
        const newFiles = [...files];
        const removedFile = newFiles.splice(index, 1)[0];

        setFiles(newFiles);

        // Remove thumbnail and processing flag
        if (removedFile) {
            if (thumbnails[removedFile.name]) {
                setThumbnails((prev) => {
                    const newThumbnails = { ...prev };
                    delete newThumbnails[removedFile.name];
                    return newThumbnails;
                });
            }
            processingRef.current.delete(removedFile.name);
        }

        // If we're removing the selected file, update selection
        if (selectedFile === removedFile) {
            setSelectedFile(newFiles.length > 0 ? newFiles[0] : null);
        }
    };

    // Generate thumbnails for new video files
    useEffect(() => {
        const generateThumbnailsForNewFiles = async () => {
            const newThumbnails: Record<string, string> = {};
            
            for (const file of files) {
                // Only generate thumbnail for video files that don't have one yet and aren't being processed
                if (
                    file.type.startsWith('video/') && 
                    !thumbnails[file.name] && 
                    !processingRef.current.has(file.name)
                ) {
                    processingRef.current.add(file.name);
                    
                    try {
                        const thumbnail = await generateVideoThumbnail(file);
                        if (thumbnail) {
                            newThumbnails[file.name] = thumbnail;
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

    return (
        <FileContext.Provider
            value={{
                files,
                selectedFile,
                thumbnails,
                setFiles,
                setSelectedFile,
                removeFile,
                getThumbnail,
            }}
        >
            {children}
        </FileContext.Provider>
    );
};

export const useFileContext = () => useContext(FileContext);