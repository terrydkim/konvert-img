import { useCallback } from "react";
import type { ConversionProgress } from "./useImageConverter";

interface UseConversionHandlerProps {
  onUpdateFile: (id: string, updates: Record<string, unknown>) => void;
  onError: (fileName: string | undefined, errorMessage: string) => void;
  findFile: (id: string) => { file: { name: string } } | undefined;
}

/**
 * 변환 진행 상황 처리 커스텀 훅
 * - depth를 줄이기 위해 콜백 로직 분리
 */
const useConversionHandler = ({
  onUpdateFile,
  onError,
  findFile,
}: UseConversionHandlerProps) => {
  /**
   * 변환 진행 상황 업데이트
   */
  const handleProgress = useCallback(
    (progressData: ConversionProgress) => {
      // 파일 상태 업데이트
      onUpdateFile(progressData.id, {
        status: progressData.status,
        progress: progressData.progress,
        convertedBlob: progressData.result?.blob,
        convertedUrl: progressData.result?.url,
        convertedSize: progressData.result?.size,
        error: progressData.error,
      });

      // 에러 처리
      if (progressData.status === "error") {
        const file = findFile(progressData.id);
        const fileName = file?.file.name;
        const errorMessage = progressData.error || "알 수 없는 오류";
        onError(fileName, errorMessage);
      }
    },
    [onUpdateFile, onError, findFile]
  );

  return { handleProgress };
};

export default useConversionHandler;
