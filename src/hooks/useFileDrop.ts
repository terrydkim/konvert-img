import { useEffect, useState } from "react";

type FileDropHandler = (files: File[]) => void;

const useFileDrop = (onFilesDropped: FileDropHandler) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(true);

      const count = event.dataTransfer?.items.length || 0;
      setFileCount(count);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDragging(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      setFileCount(0);

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      onFilesDropped(fileArray);
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFilesDropped]);

  return { isDragging, fileCount };
};

export default useFileDrop;
