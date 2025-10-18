import { useState, useEffect, useRef } from "react";
import type {
  WorkerMessage,
  WorkerResponse,
} from "../workers/backgroundRemoval.worker";

export type RemovalStatus = "pending" | "removing" | "success" | "error";

export interface RemovalResult {
  blob: Blob;
  size: number;
  url: string;
}

export interface RemovalProgress {
  id: string;
  status: RemovalStatus;
  progress: number; // 0 - 100
  result?: RemovalResult;
  error?: string;
}

const useBackgroundRemoval = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const progressCallbackRef = useRef<
    ((progress: RemovalProgress) => void) | null
  >(null);

  // Worker 초기화
  useEffect(() => {
    // Worker 생성
    workerRef.current = new Worker(
      new URL("../workers/backgroundRemoval.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Worker 메시지 핸들러
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, id, progress, buffer, error } = event.data;

      if (!progressCallbackRef.current) return;

      if (type === "progress" && progress !== undefined) {
        progressCallbackRef.current({
          id,
          status: "removing",
          progress,
        });
      } else if (type === "success" && buffer) {
        // ArrayBuffer를 Blob으로 변환
        const blob = new Blob([buffer], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        progressCallbackRef.current({
          id,
          status: "success",
          progress: 100,
          result: {
            blob,
            url,
            size: blob.size,
          },
        });
      } else if (type === "error") {
        progressCallbackRef.current({
          id,
          status: "error",
          progress: 0,
          error: error || "알 수 없는 오류",
        });
      }
    };

    // Worker 에러 핸들러
    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
    };

    // 정리
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 전체 파일 배경 제거하기
  const startBackgroundRemoval = async (
    files: { id: string; file: File }[],
    onProgress: (progress: RemovalProgress) => void
  ) => {
    if (!workerRef.current) {
      console.error("Worker is not initialized");
      return;
    }

    setIsRemoving(true);
    progressCallbackRef.current = onProgress;

    for (const { id, file } of files) {
      // 초기 상태 전송
      onProgress({ id, status: "removing", progress: 0 });

      // File을 ArrayBuffer로 변환
      const buffer = await file.arrayBuffer();

      // Worker에게 작업 전송 (ArrayBuffer를 transfer)
      const message: WorkerMessage = {
        type: "remove",
        buffer,
        fileName: file.name,
        fileType: file.type,
        id,
      };

      workerRef.current.postMessage(message, { transfer: [buffer] });

      // Worker가 비동기로 처리하므로, 완료를 기다림
      await new Promise<void>((resolve) => {
        const originalCallback = progressCallbackRef.current;
        progressCallbackRef.current = (progress) => {
          originalCallback?.(progress);
          if (
            progress.id === id &&
            (progress.status === "success" || progress.status === "error")
          ) {
            resolve();
          }
        };
      });
    }

    setIsRemoving(false);
    progressCallbackRef.current = null;
  };

  return {
    isRemoving,
    startBackgroundRemoval,
  };
};

export default useBackgroundRemoval;
