export const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
