"use client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

const GoogleAuthProvider = ({ children }: Props) => {
    // I will ask the user for this value later.
    const googleClientId = "150825594230-h8an9t7c5eu99etrhda4gtam7660g1tt.apps.googleusercontent.com";

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleAuthProvider;
