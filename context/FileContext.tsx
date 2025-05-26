import { createContext, useContext, useState, ReactNode } from "react";

const FileContext = createContext<{ files: File[]; setFiles: (f: File[]) => void }>({ files: [], setFiles: () => { } });

export const FileProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<File[]>([]);
    return <FileContext.Provider value={{ files, setFiles }}>{children}</FileContext.Provider>;
};

export const useFileContext = () => useContext(FileContext);