import { createContext, useContext, useState, ReactNode } from "react";

type FileContextType = {
    files: File[];
    selectedFile: File | null;
    setFiles: (files: File[]) => void;
    setSelectedFile: (file: File | null) => void;
    removeFile: (index: number) => void;
};

const FileContext = createContext<FileContextType>({
    files: [],
    selectedFile: null,
    setFiles: () => { },
    setSelectedFile: () => { },
    removeFile: () => { },
});

export const FileProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const removeFile = (index: number) => {
        const newFiles = [...files];
        const removedFile = newFiles.splice(index, 1)[0];

        setFiles(newFiles);

        // If we're removing the selected file, update selection
        if (selectedFile === removedFile) {
            setSelectedFile(newFiles.length > 0 ? newFiles[0] : null);
        }
    };

    return (
        <FileContext.Provider
            value={{
                files,
                selectedFile,
                setFiles,
                setSelectedFile,
                removeFile,
            }}
        >
            {children}
        </FileContext.Provider>
    );
};

export const useFileContext = () => useContext(FileContext);