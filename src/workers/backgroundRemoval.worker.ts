import { removeBackground, type Config } from "@imgly/background-removal";

export interface WorkerMessage {
  type: "remove";
  buffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  id: string;
}

export interface WorkerResponse {
  type: "progress" | "success" | "error";
  id: string;
  progress?: number;
  buffer?: ArrayBuffer;
  error?: string;
}

const PROGRESS = {
  START: 10,
  PROCESSING: 50,
  CREATING_BLOB: 90,
  COMPLETE: 100,
} as const;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, buffer, fileName, fileType, id } = event.data;

  if (type !== "remove") {
    return;
  }

  try {
    // 시작 진행률 전송
    self.postMessage({
      type: "progress",
      id,
      progress: PROGRESS.START,
    } satisfies WorkerResponse);

    // ArrayBuffer를 File 객체로 변환
    const file = new File([buffer], fileName, { type: fileType });

    const config: Config = {
      progress: (_key, current, total) => {
        // 라이브러리의 진행률을 우리 진행률로 변환
        const libraryProgress = (current / total) * 100;
        const mappedProgress =
          PROGRESS.START +
          (libraryProgress / 100) * (PROGRESS.PROCESSING - PROGRESS.START);

        self.postMessage({
          type: "progress",
          id,
          progress: Math.round(mappedProgress),
        } satisfies WorkerResponse);
      },
    };

    // 배경 제거 실행
    const blob = await removeBackground(file, config);

    // Blob 생성 진행률
    self.postMessage({
      type: "progress",
      id,
      progress: PROGRESS.CREATING_BLOB,
    } satisfies WorkerResponse);

    // Blob이 아닌 경우 에러
    if (!(blob instanceof Blob)) {
      throw new Error("배경 제거 결과가 올바르지 않습니다.");
    }

    // Blob을 ArrayBuffer로 변환하여 transfer
    const resultBuffer = await blob.arrayBuffer();

    // 성공 응답 (ArrayBuffer를 transfer)
    self.postMessage(
      {
        type: "success",
        id,
        progress: PROGRESS.COMPLETE,
        buffer: resultBuffer,
      } satisfies WorkerResponse,
      { transfer: [resultBuffer] }
    );
  } catch (error) {
    // 에러 응답
    self.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : "배경 제거에 실패했습니다.",
    } satisfies WorkerResponse);
  }
};
