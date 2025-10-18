import { removeBackground } from "@imgly/background-removal";

export interface WorkerMessage {
  type: "remove";
  buffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  id: string;
}

export interface WorkerResponse {
  type: "success" | "error";
  id: string;
  buffer?: ArrayBuffer;
  error?: string;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, buffer, fileName, fileType, id } = event.data;

  if (type !== "remove") {
    return;
  }

  try {
    // ArrayBuffer를 File 객체로 변환
    const file = new File([buffer], fileName, { type: fileType });

    // 배경 제거 실행 (progress 콜백 없이)
    const blob = await removeBackground(file);

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
