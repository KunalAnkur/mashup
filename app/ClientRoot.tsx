// app/ClientRoot.tsx
"use client";

import { ReactNode } from "react";
import { SocketProvider } from "@/context/SocketContext"; // adjust the path
import { store, persistor } from '@/lib/store';
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import AuthGuard from "@/context/AuthGuard";
import { FileProvider } from "@/context/FileContext";
import { MediaStreamProvider } from "@/context/MediaStreamContext";
export default function ClientRoot({ children }: { children: ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <AuthGuard>
                    <FileProvider>
                        <MediaStreamProvider>
                            {/* <SocketProvider> */}
                                {children}
                            {/* </SocketProvider> */}
                        </MediaStreamProvider>
                    </FileProvider>
                </AuthGuard>
            </PersistGate>
        </Provider>
    );
}
