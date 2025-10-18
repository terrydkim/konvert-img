export interface FileItem {
  id: string;
  file: File;
  preview: string;
  targetExtension: string;
  status: "pending" | "converting" | "removing" | "success" | "error";
  progress?: number;
  error?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
}