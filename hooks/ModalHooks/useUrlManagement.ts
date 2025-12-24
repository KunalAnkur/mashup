import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import {
  validateUrl,
  detectPlatform,
  normalizeUrlForPlayer,
} from "../../types/ModalTypes/urlUtils";

interface UseUrlManagementOptions {
  /**
   * Optional callback when URLs are successfully added.
   * If provided, the hook will call this callback with the URLs to add instead of managing local state.
   * This is useful for API-based flows (e.g., updating room in database).
   */
  onUrlAdded?: (urls: string[]) => Promise<void>;
  /**
   * Whether to persist URLs to localStorage. Defaults to true.
   * Set to false when using onUrlAdded callback (API-based flow).
   */
  persistToLocalStorage?: boolean;
}

export const useUrlManagement = (options?: UseUrlManagementOptions) => {
  const { onUrlAdded, persistToLocalStorage = !options?.onUrlAdded } = options || {};
  const authState = useSelector((state: RootState) => state.auth);
  const roomState = useSelector((state: RootState) => state.room);
  const [sourceUrlInput, setSourceUrlInput] = useState<string>("");
  const [addedUrls, setAddedUrls] = useState<AddedUrl[]>([]);
  const [isAddDisabled, setAddDisabled] = useState<boolean>(true);
  const [tooltipMessage, setTooltipMessage] = useState<string>("");
  const [loadingMetadata, setLoadingMetadata] = useState<Set<number>>(
    new Set()
  );
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string>("");
  
  const fetchUrlMetadata = useCallback(
    async (url: string): Promise<AddedUrl["metadata"]> => {
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

        const data = await response.json();

        if (!response.ok) {
          const message =
            data?.message ||
            data?.error ||
            `Failed to fetch metadata: ${response.statusText}`;
          // Background metadata (existing URLs) should not crash the app; just log and return empty.
          console.warn("Background metadata fetch failed:", message);
          return {};
        }

        return {
          title: data.data?.title || undefined,
          description: data.data?.description || undefined,
          thumbnail: data.data?.thumbnail || undefined,
          author: data.data?.author || data.data?.siteName || undefined,
        };
      } catch (error) {
        console.error("Error fetching metadata:", error);
        return {};
      }
    },
    [authState.token]
  );

  useEffect(() => {
    // Only sync from roomState if not using API-based flow
    if (onUrlAdded) return;
    
    if (!roomState.urls || roomState.urls.length === 0) {
      if (persistToLocalStorage) {
        const addedUrls = localStorage.getItem("addedUrls");
        if (addedUrls) {
          setAddedUrls(JSON.parse(addedUrls));
        } else {
          setAddedUrls([]);
        }
      } else {
        setAddedUrls([]);
      }
      return;
    }

    const fetchMetadata = async () => {
      const promises = roomState.urls.map(async (url) => {
        const metadata = await fetchUrlMetadata(url);
        return { url, platformId: detectPlatform(url), metadata };
      });
      const results = await Promise.all(promises);
      if (persistToLocalStorage) {
        localStorage.setItem("addedUrls", JSON.stringify(results));
      }
      setAddedUrls(results);
    };
    
    fetchMetadata();
  }, [roomState.urls, fetchUrlMetadata, onUrlAdded, persistToLocalStorage]);

  // Validate URL input
  useEffect(() => {
    if (!sourceUrlInput.trim()) {
      setAddDisabled(true);
      setTooltipMessage("");
      return;
    }
    const { valid, tooltip } = validateUrl(sourceUrlInput);
    setAddDisabled(!valid);
    setTooltipMessage(tooltip);
  }, [sourceUrlInput]);

  

  const handleAddUrl = async () => {
    const validation = validateUrl(sourceUrlInput);
    if (!validation.valid || isAdding) return;

    setIsAdding(true);
    setUrlError("");
    setTooltipMessage("");
    
    try {
      const rawUrl = sourceUrlInput.trim();
      const url = normalizeUrlForPlayer(rawUrl);

      // Check if it's a YouTube Mix playlist (RD) - these should only add the first video
      let isMixPlaylist = false;
      try {
        const urlObj = new URL(rawUrl);
        const playlistId = urlObj.searchParams.get("list");
        if (playlistId && playlistId.startsWith("RD")) {
          isMixPlaylist = true;
        }
      } catch {
        // Ignore URL parsing errors
      }

      // Fetch metadata (and possible playlist) from backend
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

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          `Failed to fetch metadata: ${response.statusText}`;

        // Show error message
        if (onUrlAdded) {
          setUrlError(message);
        } else {
          setTooltipMessage(message);
        }
        return;
      }

      const serverData = data.data || {};
      const playlistItems = serverData.playlistItems as
        | {
            url: string;
            title?: string;
            description?: string;
            thumbnail?: string;
            author?: string;
          }[]
        | undefined;

      // Determine URLs to add
      let urlsToAdd: string[] = [];
      
      if (playlistItems && playlistItems.length > 0 && !isMixPlaylist) {
        // If backend returned a playlist (and it's not a Mix), add all playlist video URLs
        urlsToAdd = playlistItems.map((item) => item.url);
      } else {
        // Normal single URL behavior (including Mix playlists which only add the first video)
        urlsToAdd = [url];
      }

      // If onUrlAdded callback is provided, use API-based flow
      if (onUrlAdded) {
        try {
          await onUrlAdded(urlsToAdd);
          setSourceUrlInput(""); // Clear input on success
        } catch (error: any) {
          const errorMessage = 
            error?.message || 
            error?.error ||
            "Failed to add URLs. Please try again.";
          setUrlError(errorMessage);
          throw error; // Re-throw to prevent clearing input
        }
        return;
      }

      // Otherwise, use local state management flow (original behavior)
      const detectedPlatform = detectPlatform(url);
      const newIndex = addedUrls.length;
      
      // Add URL immediately with empty metadata
      setAddedUrls((prev) => [...prev, { url, platformId: detectedPlatform }]);
      setSourceUrlInput("");
      setLoadingMetadata((prev) => new Set(prev).add(newIndex));

      if (playlistItems && playlistItems.length > 0 && !isMixPlaylist) {
        // If backend returned a playlist, replace the single placeholder
        // with all playlist video URLs as separate entries.
        setAddedUrls((prev) => {
          const withoutPlaceholder = [...prev];
          if (withoutPlaceholder[newIndex]) {
            withoutPlaceholder.splice(newIndex, 1);
          }

          const playlistEntries: AddedUrl[] = playlistItems.map((item) => ({
            url: item.url,
            platformId: detectPlatform(item.url),
            metadata: {
              title: item.title,
              description: item.description,
              thumbnail: item.thumbnail,
              author: item.author,
            },
          }));

          const updated = [...withoutPlaceholder, ...playlistEntries];
          if (persistToLocalStorage) {
            localStorage.setItem("addedUrls", JSON.stringify(updated));
          }
          return updated;
        });
      } else {
        // Normal single URL behavior
        const metadata: AddedUrl["metadata"] = {
          title: serverData.title || undefined,
          description: serverData.description || undefined,
          thumbnail: serverData.thumbnail || undefined,
          author: serverData.author || serverData.siteName || undefined,
        };

        setAddedUrls((prev) => {
          const updated = [...prev];
          if (updated[newIndex]) {
            updated[newIndex] = { ...updated[newIndex], metadata };
          }
          if (persistToLocalStorage) {
            localStorage.setItem("addedUrls", JSON.stringify(updated));
          }
          return updated;
        });
      }

      setLoadingMetadata((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newIndex);
        return newSet;
      });
    } catch (error) {
      console.error("Error adding URL:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Could not add this URL. Please try a different one.";

      if (onUrlAdded) {
        setUrlError(message);
      } else {
        setTooltipMessage(message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setAddedUrls((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      if (persistToLocalStorage) {
        localStorage.setItem("addedUrls", JSON.stringify(updated));
      }
      return updated;
    });
  };

  return {
    sourceUrlInput,
    setSourceUrlInput,
    addedUrls,
    isAddDisabled,
    tooltipMessage,
    loadingMetadata,
    isAdding,
    urlError,
    setUrlError,
    handleAddUrl,
    handleRemoveUrl,
  };
};
