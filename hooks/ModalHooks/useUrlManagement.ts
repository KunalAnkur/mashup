import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { validateUrl, detectPlatform } from "../../types/ModalTypes/urlUtils";

export const useUrlManagement = () => {
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
    if (!roomState.urls || roomState.urls.length === 0) {
      const addedUrls = localStorage.getItem("addedUrls");
      if (addedUrls) {
        setAddedUrls(JSON.parse(addedUrls));
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
      localStorage.setItem("addedUrls", JSON.stringify(results));
      setAddedUrls(results);
    };
    
    fetchMetadata();
  }, [roomState.urls, fetchUrlMetadata]);

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
    try {
      const detectedPlatform = detectPlatform(sourceUrlInput);
      const url = sourceUrlInput.trim();

      // Add URL immediately with empty metadata
      const newIndex = addedUrls.length;
      setAddedUrls((prev) => [...prev, { url, platformId: detectedPlatform }]);
      setSourceUrlInput("");
      setLoadingMetadata((prev) => new Set(prev).add(newIndex));

      // Fetch metadata (and possible playlist) from backend
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

          // Show friendly error text instead of throwing a runtime error
          setTooltipMessage(message);

          // Remove the temporary placeholder entry since adding failed
          setAddedUrls((prev) => {
            const updated = prev.filter((_, index) => index !== newIndex);
            localStorage.setItem("addedUrls", JSON.stringify(updated));
            return updated;
          });

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

        if (playlistItems && playlistItems.length > 0) {
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
            localStorage.setItem("addedUrls", JSON.stringify(updated));
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
            localStorage.setItem("addedUrls", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Could not add this URL. Please try a different one.";

        setTooltipMessage(message);

        // Remove the temporary placeholder entry since adding failed
        setAddedUrls((prev) => {
          const updated = prev.filter((_, index) => index !== newIndex);
          localStorage.setItem("addedUrls", JSON.stringify(updated));
          return updated;
        });
      }

      setLoadingMetadata((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newIndex);
        return newSet;
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setAddedUrls((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      localStorage.setItem("addedUrls", JSON.stringify(updated));
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
    handleAddUrl,
    handleRemoveUrl,
  };
};
