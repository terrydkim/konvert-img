import { useState } from "react";
import type { ImageSettings } from "../types/types";
import { encodeImage } from "./imageEncoders";

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

export interface ConversionOptions {
  targetExtension: string;
  settings?: ImageSettings;
}

const PROGRESS = {
  START: 10,
  IMAGE_LOADED: 33,
  CANVAS_DRAWN: 66,
  BLOB_CREATING: 90,
  COMPLETE: 100,
} as const;

const useImageConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertImages = async (
    file: File,
    options: ConversionOptions,
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      onProgress(PROGRESS.START);

      img.onload = async () => {
        try {
          onProgress(PROGRESS.IMAGE_LOADED);

          // 설정에서 크기 가져오기
          const targetWidth = options.settings?.width ?? img.width;
          const targetHeight = options.settings?.height ?? img.height;

          // canvas 만들기
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // 이미지 그리기
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("Canvas context를 가져올 수 없습니다."));
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          URL.revokeObjectURL(url);
          onProgress(PROGRESS.CANVAS_DRAWN);

          // Canvas에서 ImageData 추출
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          onProgress(PROGRESS.BLOB_CREATING);

          // 통합 인코더 사용 (네이티브 vs WASM 비교 후 작은 것 선택)
          const resultBlob = await encodeImage(
            imageData,
            options.targetExtension,
            options.settings
          );

          resolve(resultBlob);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error instanceof Error ? error : new Error("이미지 변환에 실패했습니다."));
        }
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
    files: { id: string; file: File; options: ConversionOptions }[],
    onProgress: (progress: ConversionProgress) => void
  ) => {
    setIsConverting(true);

    for (const { id, file, options } of files) {
      onProgress({ id, status: "converting", progress: 0 });
      try {
        const blob = await convertImages(file, options, (progress) => {
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
