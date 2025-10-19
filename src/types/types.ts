export interface ImageSettings {
  quality: number; // 1-100
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

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
  settings?: ImageSettings;
}