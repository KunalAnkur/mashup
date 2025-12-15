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

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const data = await response.json();

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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = authState.token;
      const rawUrl = sourceUrlInput.trim();

      // Detect if this is a YouTube playlist/mix (has list=)
      const isPlaylist =
        /youtube\.com/i.test(rawUrl) && rawUrl.includes("list=");

      if (isPlaylist) {
        // Call playlist endpoint to get all videos
        const response = await fetch(
          `${baseUrl}/api/v1/url/youtube-playlist`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ url: rawUrl }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch playlist: ${response.statusText}`
          );
        }

        const data = await response.json();
        const items = (data.data as Array<{ url: string; metadata: any }>) || [];

        if (items.length === 0) {
          // Fallback: treat as single URL if playlist fetch returned nothing
          const detectedPlatform = detectPlatform(rawUrl);
          const newIndex = addedUrls.length;
          setAddedUrls((prev) => [
            ...prev,
            { url: rawUrl, platformId: detectedPlatform },
          ]);
          setSourceUrlInput("");

          setLoadingMetadata((prev) => new Set(prev).add(newIndex));
          const metadata = await fetchUrlMetadata(rawUrl);
          setAddedUrls((prev) => {
            const updated = [...prev];
            if (updated[newIndex]) {
              updated[newIndex] = { ...updated[newIndex], metadata };
            }
            localStorage.setItem("addedUrls", JSON.stringify(updated));
            return updated;
          });
          setLoadingMetadata((prev) => {
            const newSet = new Set(prev);
            newSet.delete(newIndex);
            return newSet;
          });
        } else {
          // Add all playlist items at once, with ready metadata
          const playlistEntries: AddedUrl[] = items.map((item) => ({
            url: item.url,
            platformId: detectPlatform(item.url),
            metadata: {
              title: item.metadata?.title,
              description: item.metadata?.description,
              thumbnail: item.metadata?.thumbnail,
              author:
                item.metadata?.author || item.metadata?.siteName,
            },
          }));

          setAddedUrls((prev) => {
            const updated = [...prev, ...playlistEntries];
            localStorage.setItem("addedUrls", JSON.stringify(updated));
            return updated;
          });

          setSourceUrlInput("");
        }
      } else {
        // Single URL flow (existing behavior)
        const detectedPlatform = detectPlatform(rawUrl);

        // Add URL immediately with empty metadata
        const newIndex = addedUrls.length;
        setAddedUrls((prev) => [
          ...prev,
          { url: rawUrl, platformId: detectedPlatform },
        ]);
        setSourceUrlInput("");

        // Fetch metadata asynchronously
        setLoadingMetadata((prev) => new Set(prev).add(newIndex));
        const metadata = await fetchUrlMetadata(rawUrl);
        setAddedUrls((prev) => {
          const updated = [...prev];
          if (updated[newIndex]) {
            updated[newIndex] = { ...updated[newIndex], metadata };
          }
          localStorage.setItem("addedUrls", JSON.stringify(updated));
          return updated;
        });
        setLoadingMetadata((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newIndex);
          return newSet;
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setAddedUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
    localStorage.setItem("addedUrls", JSON.stringify(addedUrls));
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
