import React from "react";

export const useDragAndDrop = (
  fileInputRef: React.RefObject<HTMLInputElement>,
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const newFiles = e.dataTransfer.files;
      if (newFiles && newFiles.length > 0 && fileInputRef.current) {
        try {
          fileInputRef.current.files = newFiles;
          const event = new Event("change", { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
        } catch {
          const syntheticEvent = {
            target: { files: newFiles },
            currentTarget: { files: newFiles },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onFileSelect(syntheticEvent);
        }
      }
    },
    [fileInputRef, onFileSelect]
  );

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
};

