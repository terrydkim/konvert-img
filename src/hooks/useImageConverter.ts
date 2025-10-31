import { useState } from "react";
import type { ImageSettings } from "../types/types";
import { useWorkerPool } from "./useWorkerPool";
import type {
  WorkerMessage,
  WorkerResponse,
} from "../workers/imageConversion.worker";
// Vite가 빌드 시점에 워커를 감지할 수 있도록 명시적으로 import
import ImageConversionWorker from "../workers/imageConversion.worker.ts?worker";

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

const useImageConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  // 워커 풀 초기화 - Worker 생성자를 직접 전달
  const { runTask } = useWorkerPool<WorkerMessage, WorkerResponse>(
    ImageConversionWorker
  );

  const convertImages = async (
    file: File,
    id: string,
    options: ConversionOptions,
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    // File을 ArrayBuffer로 변환
    const buffer = await file.arrayBuffer();

    // 워커에 전달할 메시지 생성
    const message: WorkerMessage = {
      type: "convert",
      buffer,
      fileName: file.name,
      fileType: file.type,
      id,
      targetExtension: options.targetExtension,
      settings: options.settings,
    };

    // 워커 풀에서 작업 실행
    const response = await runTask(message, onProgress);

    if (response.type === "error") {
      throw new Error(response.error || "이미지 변환에 실패했습니다.");
    }

    if (!response.buffer) {
      throw new Error("변환 결과를 받지 못했습니다.");
    }

    // ArrayBuffer를 Blob으로 변환
    return new Blob([response.buffer], {
      type: `image/${options.targetExtension}`,
    });
  };

  // 전체 파일 변환하기 (병렬 처리)
  const startConversion = async (
    files: { id: string; file: File; options: ConversionOptions }[],
    onProgress: (progress: ConversionProgress) => void
  ) => {
    setIsConverting(true);

    // Promise.all로 모든 파일을 동시에 워커 풀에 전달
    // 워커 풀이 자동으로 사용 가능한 워커에 작업 분배
    await Promise.all(
      files.map(async ({ id, file, options }) => {
        onProgress({ id, status: "converting", progress: 0 });
        try {
          const blob = await convertImages(
            file,
            id,
            options,
            (progress: number) => {
              onProgress({ id, status: "converting", progress });
            }
          );

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
          console.error("[이미지 변환 실패]", { id, file: file.name, error });
          onProgress({
            id,
            status: "error",
            progress: 0,
            error: error instanceof Error ? error.message : "알 수 없는 오류",
          });
        }
      })
    );

    setIsConverting(false);
  };

  return {
    isConverting,
    startConversion,
  };
};

export default useImageConverter;
