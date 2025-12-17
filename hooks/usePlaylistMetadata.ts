import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setUrlMetadata } from "@/lib/store/slices/roomSlice";

export const usePlaylistMetadata = (urls: string[], isFileStreaming: boolean) => {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const urlMetadataCache = useSelector((state: RootState) => state.room.urlMetadataCache);

    // Track which URLs are currently being fetched
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
    // Track failed URLs to prevent retries
    const failedUrlsRef = useRef<Set<string>>(new Set());

    // Fetch metadata for URLs that aren't cached yet
    useEffect(() => {
        if (isFileStreaming || urls.length === 0) return;

        // Find URLs that need metadata fetching (not cached, not loading, not failed)
        const urlsToFetch = urls.filter(
            (url) => !urlMetadataCache[url] && !loadingUrls.has(url) && !failedUrlsRef.current.has(url)
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
                        // Cache the metadata in Redux
                        dispatch(setUrlMetadata({
                            url,
                            metadata: {
                                title: data.data?.title || undefined,
                                description: data.data?.description || undefined,
                                thumbnail: data.data?.thumbnail || undefined,
                                author: data.data?.author || data.data?.siteName || undefined,
                            },
                        }));
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
    }, [urls, isFileStreaming, authState.token, urlMetadataCache, loadingUrls, dispatch]);

    const isUrlLoading = (url: string): boolean => loadingUrls.has(url);

    return { isUrlLoading };
};

