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
  result?: RemovalResult;
  error?: string;
}

const useBackgroundRemoval = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const progressCallbackRef = useRef<
    ((progress: RemovalProgress) => void) | null
  >(null);
  const completionResolversRef = useRef<Map<string, () => void>>(new Map());

  // Worker 초기화
  useEffect(() => {
    // Worker 생성
    workerRef.current = new Worker(
      new URL("../workers/backgroundRemoval.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Worker 메시지 핸들러
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, id, buffer, error } = event.data;

      if (!progressCallbackRef.current) return;

      if (type === "success" && buffer) {
        // ArrayBuffer를 Blob으로 변환
        const blob = new Blob([buffer], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        progressCallbackRef.current({
          id,
          status: "success",
          result: {
            blob,
            url,
            size: blob.size,
          },
        });
        // 완료 처리
        const resolver = completionResolversRef.current.get(id);
        if (resolver) {
          resolver();
          completionResolversRef.current.delete(id);
        }
      } else if (type === "error") {
        progressCallbackRef.current({
          id,
          status: "error",
          error: error || "알 수 없는 오류",
        });
        // 에러도 완료로 처리
        const resolver = completionResolversRef.current.get(id);
        if (resolver) {
          resolver();
          completionResolversRef.current.delete(id);
        }
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
      onProgress({ id, status: "removing" });

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

      // 완료를 기다리기 위한 Promise 등록
      const completionPromise = new Promise<void>((resolve) => {
        completionResolversRef.current.set(id, resolve);
      });

      workerRef.current.postMessage(message, { transfer: [buffer] });

      // 완료 대기
      await completionPromise;
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
