import type { ImageSettings } from "../types/types";
import { encodeImageInWorker } from "./imageEncoders.worker";

export interface WorkerMessage {
  type: "convert";
  buffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  id: string;
  targetExtension: string;
  settings?: ImageSettings;
}

export interface WorkerResponse {
  type: "success" | "error" | "progress";
  id: string;
  buffer?: ArrayBuffer;
  error?: string;
  progress?: number;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, buffer, fileName, fileType, id, targetExtension, settings } =
    event.data;

  if (type !== "convert") {
    return;
  }

  try {
    // 진행률 보고
    const reportProgress = (progress: number) => {
      self.postMessage({
        type: "progress",
        id,
        progress,
      } satisfies WorkerResponse);
    };

    reportProgress(10); // 시작

    // ArrayBuffer를 File 객체로 변환
    const file = new File([buffer], fileName, { type: fileType });

    // File을 이미지로 로드
    const img = await createImageBitmap(file);
    reportProgress(33); // 이미지 로드 완료

    // 설정에서 크기 가져오기
    const targetWidth = settings?.width ?? img.width;
    const targetHeight = settings?.height ?? img.height;

    // OffscreenCanvas 사용 (웹워커에서 사용 가능)
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context를 가져올 수 없습니다.");
    }

    // 이미지 그리기
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    reportProgress(66); // 캔버스 그리기 완료

    // Canvas에서 ImageData 추출
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    reportProgress(90); // ImageData 추출 완료

    // 워커 전용 인코더 사용 (WASM만)
    const resultBlob = await encodeImageInWorker(
      imageData,
      targetExtension,
      settings
    );

    // Blob을 ArrayBuffer로 변환하여 transfer
    const resultBuffer = await resultBlob.arrayBuffer();

    // 성공 응답 (ArrayBuffer를 transfer)
    self.postMessage(
      {
        type: "success",
        id,
        buffer: resultBuffer,
      } satisfies WorkerResponse,
      { transfer: [resultBuffer] }
    );
  } catch (error) {
    // 에러 응답
    self.postMessage({
      type: "error",
      id,
      error:
        error instanceof Error ? error.message : "이미지 변환에 실패했습니다.",
    } satisfies WorkerResponse);
  }
};
