import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

type UrlMetadataResponseItem = {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
    siteName?: string;
};

export const usePlaylistMetadata = (urls: string[], isFileStreaming: boolean) => {
    const authState = useSelector((state: RootState) => state.auth);

    // Track which URLs are currently being fetched
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
    // Track failed URLs to prevent retries
    const failedUrlsRef = useRef<Set<string>>(new Set());

    // Fetch metadata for URLs that aren't cached yet
    useEffect(() => {
        if (isFileStreaming || urls.length === 0) return;

        const urlsToFetch = urls.filter(
            (url) => !loadingUrls.has(url) && !failedUrlsRef.current.has(url)
        );

        if (urlsToFetch.length === 0) return;

        // Mark URLs as loading
        setLoadingUrls((prev) => {
            const newSet = new Set(prev);
            urlsToFetch.forEach((url) => newSet.add(url));
            return newSet;
        });

        // Fetch metadata for each URL
        const fetchMetadata = async () => {
            console.log("[PlaylistMetadata] Fetching metadata for URLs:", urlsToFetch);
            for (const url of urlsToFetch) {
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                    const token = authState.token;

                    const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` }),
                        },
                        body: JSON.stringify({ url }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const metadataItems = Array.isArray(data.data)
                            ? (data.data as UrlMetadataResponseItem[])
                            : [];
                        console.log("[PlaylistMetadata] Metadata fetched for URL:", url, metadataItems[0]);
                        // Remove from failed set if it was there (in case of manual retry)
                        failedUrlsRef.current.delete(url);
                    } else {
                        // Mark as failed if response is not OK
                        console.warn(`[PlaylistMetadata] Failed to fetch metadata for ${url}: ${response.status}`);
                        failedUrlsRef.current.add(url);
                    }
                } catch (error) {
                    console.error("Error fetching metadata for URL:", url, error);
                    // Mark as failed on error to prevent retries
                    failedUrlsRef.current.add(url);
                }

                // Remove from loading set
                setLoadingUrls((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(url);
                    return newSet;
                });
            }
        };

        fetchMetadata();
    }, [urls, isFileStreaming, authState.token, loadingUrls]);

    const isUrlLoading = (url: string): boolean => loadingUrls.has(url);

    return { isUrlLoading };
};
