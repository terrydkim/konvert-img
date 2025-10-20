import { useCallback, useState } from "react";
import type { FileItem, ImageSettings } from "../types/types";

/**
 * 파일 목록 관리 커스텀 훅
 * - 파일 추가/삭제/업데이트
 * - URL 메모리 관리 (cleanup)
 */
const useFileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  /**
   * 새 파일 추가
   */
  const addFiles = useCallback((newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      targetExtension: "webp",
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...fileItems]);
  }, []);

  /**
   * 파일 제거 (URL cleanup 포함)
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
        if (file.convertedUrl) {
          URL.revokeObjectURL(file.convertedUrl);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /**
   * 파일 부분 업데이트
   */
  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
    );
  }, []);

  /**
   * 파일 설정 업데이트
   */
  const updateFileSettings = useCallback(
    (id: string, settings: ImageSettings) => {
      updateFile(id, { settings });
    },
    [updateFile]
  );

  /**
   * 파일 확장자 변경
   */
  const updateFileExtension = useCallback(
    (id: string, extension: string) => {
      updateFile(id, { targetExtension: extension });
    },
    [updateFile]
  );

  /**
   * 전체 파일 초기화 (URL cleanup 포함)
   */
  const resetAll = useCallback(() => {
    files.forEach((file) => {
      URL.revokeObjectURL(file.preview);
      if (file.convertedUrl) {
        URL.revokeObjectURL(file.convertedUrl);
      }
    });
    setFiles([]);
  }, [files]);

  /**
   * 파일 ID로 찾기
   */
  const findFile = useCallback(
    (id: string) => {
      return files.find((f) => f.id === id);
    },
    [files]
  );

  /**
   * 계산된 값들
   */
  const successCount = files.filter((f) => f.status === "success").length;
  const convertibleCount = files.filter(
    (f) => f.status === "pending" || f.status === "error"
  ).length;

  return {
    files,
    addFiles,
    removeFile,
    updateFile,
    updateFileSettings,
    updateFileExtension,
    resetAll,
    findFile,
    successCount,
    convertibleCount,
  };
};

export default useFileManager;
