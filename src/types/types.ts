export interface FileItem {
  id: string;
  file: File;
  preview: string;
  targetExtension: string;
  status: "pending" | "converting" | "success" | "error";
  progress?: number;
  error?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
}