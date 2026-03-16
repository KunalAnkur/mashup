// app/ClientRoot.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { SocketProvider } from "@/context/SocketContext"; // adjust the path
import { store, persistor } from '@/lib/store';
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import AuthGuard from "@/context/AuthGuard";
import { FileProvider } from "@/context/FileContext";
import { MediaStreamProvider } from "@/context/MediaStreamContext";
import GoogleAuthProvider from "@/components/GoogleAuth/GoogleOAuthProvider";
import GoogleOneTap from "@/components/GoogleAuth/GoogleOneTap";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from 'react-hot-toast';
import LocalePersistence from "@/components/LanguageSelector/LocalePersistence";
import { setFocused } from "@/lib/store/slices/roomSlice";

export default function ClientRoot({ children }: { children: ReactNode }) {
    // useEffect(() => {
    //     if (store.getState().room.focused) return;

    //     const markFocused = () => {
    //         if (!store.getState().room.focused) {
    //             store.dispatch(setFocused(true));
    //         }
    //         window.removeEventListener("click", handleFirstInteraction);
    //         window.removeEventListener("keydown", handleFirstInteraction);
    //         window.removeEventListener("touchstart", handleFirstInteraction);
    //     };

    //     const handleFirstInteraction = () => {
    //         markFocused();
    //     };

    //     window.addEventListener("click", handleFirstInteraction);
    //     window.addEventListener("keydown", handleFirstInteraction);
    //     window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    //     return () => {
    //         window.removeEventListener("click", handleFirstInteraction);
    //         window.removeEventListener("keydown", handleFirstInteraction);
    //         window.removeEventListener("touchstart", handleFirstInteraction);
    //     };
    // }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <PostHogProvider>
                    {/* <LocalePersistence /> */}
                    <GoogleAuthProvider>
                        <GoogleOneTap />
                        <AuthGuard>
                            <FileProvider>
                                <MediaStreamProvider>
                                    {/* <SocketProvider> */}
                                    {children}
                                    {/* </SocketProvider> */}
                                </MediaStreamProvider>
                            </FileProvider>
                        </AuthGuard>
                    </GoogleAuthProvider>
                    <Toaster 
                        position="top-right"
                        toastOptions={{
                            className: '',
                            style: {
                                background: '#1f1f23',
                                color: '#fff',
                                borderRadius: '12px',
                            },
                        }}
                    />
                </PostHogProvider>
            </PersistGate>
        </Provider>
    );
}
