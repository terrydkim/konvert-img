import { useCallback, useState } from "react";
import type { FileItem, ImageSettings } from "../types/types";
import { createThumbnail } from "../utils/createThumbnail";

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
  const addFiles = useCallback(async (newFiles: File[]) => {
    // 각 파일에 대해 썸네일 생성
    const fileItemsPromises = newFiles.map(async (file) => {
      try {
        // 썸네일 생성 (최대 200px, 품질 0.7)
        const thumbnailUrl = await createThumbnail(file, 200, 0.7);
        return {
          id: crypto.randomUUID(),
          file,
          preview: thumbnailUrl,
          targetExtension: "webp" as const,
          status: "pending" as const,
        };
      } catch (error) {
        // 썸네일 생성 실패 시 원본 사용 (폴백)
        console.warn(`썸네일 생성 실패 (${file.name}):`, error);
        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          targetExtension: "webp" as const,
          status: "pending" as const,
        };
      }
    });

    const fileItems = await Promise.all(fileItemsPromises);
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
