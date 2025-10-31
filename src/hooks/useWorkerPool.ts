import { useCallback, useEffect, useRef } from "react";

interface WorkerTask<TMessage, TResponse> {
  id: string;
  message: TMessage;
  resolve: (value: TResponse) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
  assigned: boolean;  // 워커에 할당되었는지 여부
}

interface WorkerWithState {
  worker: Worker;
  busy: boolean;
}

// 워커 응답에 공통으로 포함되는 필드 타입
interface WorkerResponseBase {
  id: string;
  type: "success" | "error" | "progress";
  error?: string;
  progress?: number;
}

/**
 * 웹워커 풀을 관리하는 훅
 * @param workerSource - 워커 파일 경로(string) 또는 Worker 생성자
 * @param poolSize - 워커 풀 크기 (기본값: navigator.hardwareConcurrency 또는 4)
 */
export const useWorkerPool = <TMessage, TResponse>(
  workerSource: string | (new () => Worker),
  poolSize?: number
) => {
  const workersRef = useRef<WorkerWithState[]>([]);
  const queueRef = useRef<WorkerTask<TMessage, TResponse>[]>([]);
  const processQueueRef = useRef<(() => void) | undefined>(undefined);

  // 워커 개수 제한: 최대 2개 (메모리 사용량 고려)
  // WASM 인코딩이 메모리를 많이 사용하므로 2개로 제한
  const MAX_WORKERS = 2;
  const hardwareConcurrency = typeof navigator !== "undefined"
    ? navigator.hardwareConcurrency || 2
    : 2;
  const size = poolSize ?? Math.min(hardwareConcurrency, MAX_WORKERS);

  // 큐에서 다음 태스크 처리 (모든 가능한 워커에 할당)
  const processQueue = useCallback(() => {
    // 대기 중인 모든 워커 처리
    while (true) {
      // 1. 사용 가능한 워커 찾기
      const availableWorker = workersRef.current.find((ws) => !ws.busy);
      if (!availableWorker) {
        return; // 모든 워커가 바쁨
      }

      // 2. 큐에서 할당되지 않은 태스크 찾기
      const nextTask = queueRef.current.find((task) => !task.assigned);
      if (!nextTask) {
        return; // 처리할 태스크가 없음
      }

      // 3. 워커에 태스크 할당
      nextTask.assigned = true;
      availableWorker.busy = true;
      availableWorker.worker.postMessage(nextTask.message);
    }
  }, []);

  // processQueue ref 업데이트
  processQueueRef.current = processQueue;

  // 워커로부터 메시지 처리
  const handleWorkerMessage = useCallback(
    (workerState: WorkerWithState, response: TResponse) => {
      // response가 WorkerResponseBase를 확장한다고 가정
      const responseWithId = response as TResponse & WorkerResponseBase;
      const taskId = responseWithId.id;

      if (!taskId) {
        console.warn("[워커 풀] 응답에 id가 없습니다.", response);
        return;
      }

      // 해당 태스크 찾기
      const taskIndex = queueRef.current.findIndex(
        (task) => task.id === taskId
      );
      if (taskIndex === -1) {
        console.warn(`[워커 풀] 태스크를 찾을 수 없습니다: ${taskId}`);
        return;
      }

      const task = queueRef.current[taskIndex];

      // 진행률 업데이트인 경우
      if (responseWithId.type === "progress" && task.onProgress) {
        task.onProgress(responseWithId.progress ?? 0);
        return; // 진행률 업데이트는 태스크를 완료하지 않음
      }

      // 성공 또는 에러 응답인 경우
      if (responseWithId.type === "success") {
        task.resolve(response);
      } else if (responseWithId.type === "error") {
        task.reject(
          new Error(responseWithId.error || "워커에서 오류가 발생했습니다.")
        );
      }

      // 태스크 제거 및 워커 상태 업데이트
      queueRef.current.splice(taskIndex, 1);
      workerState.busy = false;

      // 다음 태스크 처리
      processQueueRef.current?.();
    },
    []
  );

  // 워커 풀 초기화
  useEffect(() => {
    // 워커 생성 - Worker 생성자 또는 URL 문자열 지원
    workersRef.current = Array.from({ length: size }, () => ({
      worker: typeof workerSource === "string"
        ? new Worker(new URL(workerSource, import.meta.url), {
            type: "module",
          })
        : new workerSource(),
      busy: false,
    }));

    // 각 워커에 메시지 핸들러 등록
    workersRef.current.forEach((workerState) => {
      workerState.worker.onmessage = (event: MessageEvent<TResponse>) => {
        handleWorkerMessage(workerState, event.data);
      };

      workerState.worker.onerror = (error) => {
        console.error("[워커 에러]", error);
        workerState.busy = false;
        processQueueRef.current?.();
      };
    });

    // 클린업: 워커 종료
    return () => {
      workersRef.current.forEach(({ worker }) => worker.terminate());
      workersRef.current = [];
      queueRef.current = [];
    };
  }, [workerSource, size, handleWorkerMessage]);

  // 태스크를 큐에 추가하고 처리
  const runTask = useCallback(
    (
      message: TMessage,
      onProgress?: (progress: number) => void
    ): Promise<TResponse> => {
      return new Promise((resolve, reject) => {
        const messageWithId = message as TMessage & { id?: string };
        const task: WorkerTask<TMessage, TResponse> = {
          id: messageWithId.id || crypto.randomUUID(),
          message,
          resolve,
          reject,
          onProgress,
          assigned: false,  // 초기값: 할당되지 않음
        };

        queueRef.current.push(task);
        processQueue();
      });
    },
    [processQueue]
  );

  // 워커 풀 상태
  const getPoolStatus = () => ({
    totalWorkers: workersRef.current.length,
    busyWorkers: workersRef.current.filter((ws) => ws.busy).length,
    queueLength: queueRef.current.length,
  });

  return {
    runTask,
    getPoolStatus,
  };
};
