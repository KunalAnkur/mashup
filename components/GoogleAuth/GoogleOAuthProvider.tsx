"use client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

const GoogleAuthProvider = ({ children }: Props) => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "150825594230-h8an9t7c5eu99etrhda4gtam7660g1tt.apps.googleusercontent.com";

    console.log("GoogleOAuthProvider initialized with Client ID:", googleClientId);
    console.log("Current origin:", typeof window !== 'undefined' ? window.location.origin : 'server');

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleAuthProvider;
