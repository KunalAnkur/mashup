import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { validateUrl, detectPlatform } from "../../types/ModalTypes/urlUtils";

export const useUrlManagement = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const [sourceUrlInput, setSourceUrlInput] = useState<string>("");
  const [addedUrls, setAddedUrls] = useState<AddedUrl[]>([]);
  const [isAddDisabled, setAddDisabled] = useState<boolean>(true);
  const [tooltipMessage, setTooltipMessage] = useState<string>("");
  const [loadingMetadata, setLoadingMetadata] = useState<Set<number>>(
    new Set()
  );
  const [isAdding, setIsAdding] = useState<boolean>(false);

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

  const fetchUrlMetadata = async (
    url: string
  ): Promise<AddedUrl["metadata"]> => {
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
  };

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

      // Fetch metadata asynchronously
      setLoadingMetadata((prev) => new Set(prev).add(newIndex));
      const metadata = await fetchUrlMetadata(url);
      setAddedUrls((prev) => {
        const updated = [...prev];
        if (updated[newIndex]) {
          updated[newIndex] = { ...updated[newIndex], metadata };
        }
        return updated;
      });
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
    setAddedUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
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
