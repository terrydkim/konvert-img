import { useState } from "react";

export type FileStatus = "pending" | "converting" | "success" | "error";

export interface ConversionResult {
  blob: Blob;
  size: number;
  url: string;
}

export interface ConversionProgress {
  id: string;
  status: FileStatus;
  progress: number; // 0 - 100
  result?: ConversionResult;
  error?: string;
}

const PROGRESS = {
  START: 10,
  IMAGE_LOADED: 33,
  CANVAS_DRAWN: 66,
  BLOB_CREATING: 90,
  COMPLETE: 100,
} as const;

const QUALITY = 0.8;

const useImageConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertImages = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      onProgress(PROGRESS.START);

      img.onload = () => {
        onProgress(PROGRESS.IMAGE_LOADED);
        // canvas 만들기
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        // 이미지 그리기
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context를 가져올 수 없습니다."));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        onProgress(PROGRESS.CANVAS_DRAWN);

        // WebP로 변환
        canvas.toBlob(
          (blob) => {
            onProgress(PROGRESS.BLOB_CREATING);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("이미지 변환에 실패했습니다."));
            }
          },
          "image/webp",
          QUALITY
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("이미지 로드에 실패했습니다."));
      };

      img.src = url;
    });
  };

  // 전체 파일 변환하기
  const startConversion = async (
    files: { id: string; file: File }[],
    onProgress: (progress: ConversionProgress) => void
  ) => {
    setIsConverting(true);

    for (const { id, file } of files) {
      onProgress({ id, status: "converting", progress: 0 });
      try {
        const blob = await convertImages(file, (progress) => {
          onProgress({ id, status: "converting", progress });
        });

        const url = URL.createObjectURL(blob);
        onProgress({
          id,
          status: "success",
          progress: 100,
          result: {
            blob,
            url,
            size: blob.size,
          },
        });
      } catch (error) {
        onProgress({
          id,
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    setIsConverting(false);
  };

  return {
    isConverting,
    startConversion,
  };
};

export default useImageConverter;
