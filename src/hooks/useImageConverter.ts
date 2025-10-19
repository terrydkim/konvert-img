import { useState } from "react";
import type { ImageSettings } from "../types/types";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { encode as encodeWebp } from "@jsquash/webp";
import { encode as encodePng } from "@jsquash/png";
import { optimise as optimisePng } from "@jsquash/oxipng";

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

const DEFAULT_QUALITY = 0.8;

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

          // 설정에서 크기와 품질 가져오기
          const quality = options.settings?.quality ?? DEFAULT_QUALITY; // 1-100 범위
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

          // 확장자별로 적절한 인코더 사용
          let resultBlob: Blob;

          if (options.targetExtension === 'jpg') {
            // JPEG 인코딩 (MozJPEG)
            const encoded = await encodeJpeg(imageData, { quality });
            resultBlob = new Blob([encoded], { type: 'image/jpeg' });
          } else if (options.targetExtension === 'webp') {
            // WebP 인코딩
            const encoded = await encodeWebp(imageData, { quality });
            resultBlob = new Blob([encoded], { type: 'image/webp' });
          } else if (options.targetExtension === 'png') {
            // PNG 인코딩 후 OxiPNG로 최적화
            const encoded = await encodePng(imageData);
            const optimised = await optimisePng(encoded, { level: 2 }); // level 0-6, 2는 균형잡힌 옵션
            resultBlob = new Blob([optimised], { type: 'image/png' });
          } else {
            reject(new Error(`지원하지 않는 확장자입니다: ${options.targetExtension}`));
            return;
          }

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
