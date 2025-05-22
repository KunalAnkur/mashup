// app/ClientRoot.tsx
"use client";

import { ReactNode } from "react";
import { SocketProvider } from "@/context/SocketContext"; // adjust the path

export default function ClientRoot({ children }: { children: ReactNode }) {
    return (
        <SocketProvider>
            {children}
        </SocketProvider>
    );
}
