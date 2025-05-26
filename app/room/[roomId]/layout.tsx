import type { Metadata } from "next";
import * as constants from "@/constants";
import { SocketProvider } from "@/context/SocketContext";

export const metadata: Metadata = {
    title: constants.seo.BRAND_NAME,
    description: constants.seo.BRAND_DESCRIPTION,
    icons: {
        icon: constants.seo.FAVICON_URL,
        shortcut: constants.seo.FAVICON_URL,
        apple: constants.seo.FAVICON_URL,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SocketProvider>
            {children}
        </SocketProvider>
    );
}