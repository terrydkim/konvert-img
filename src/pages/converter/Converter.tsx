import { useMemo, useRef, useState } from "react";
import ImageUploadIcon from "../../components/icons/ImageUploadIcon";
import useFileDrop from "../../hooks/useFileDrop";

import Toast from "../../components/Toast";
import useImageConverter, {
  type ConversionProgress,
} from "../../hooks/useImageConverter";
import useToast from "../../hooks/useToast";
import validateFiles from "../../hooks/validateFiles";
import { isMobile } from "../../utils";
import {
  MAX_SIZE_TOOLTIP_DESKTOP,
  MAX_SIZE_TOOLTIP_MOBILE,
} from "../../utils/const";
import DropOverlay from "./DropOverlay";
import FileTable, { type FileItem } from "./FileTable";

const Converter = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();

  const maxSize = useMemo(
    () => (isMobile() ? MAX_SIZE_TOOLTIP_MOBILE : MAX_SIZE_TOOLTIP_DESKTOP),
    []
  );

  const handleFilesAdded = (files: File[]) => {
    const { valid, invalid } = validateFiles(
      files,
      selectedFiles.map((f) => f.file)
    );

    if (valid.length > 0) {
      const newFileItems: FileItem[] = valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        targetExtension: "webp",
        status: "pending",
      }));
      setSelectedFiles((prev) => [...prev, ...newFileItems]);
    }

    if (invalid.length > 0) {
      const rejectedFiles = invalid.map((item) => ({
        name: item.file.name,
        reason: item.reason,
      }));
      showToast(rejectedFiles);
      console.log("거부된 파일:", invalid);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((file) => file.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((file) => file.id !== id);
    });
  };

  const { isDragging, fileCount } = useFileDrop(handleFilesAdded);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    handleFilesAdded(fileArray);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const { isConverting, startConversion } = useImageConverter();

  const handleConvert = () => {
    const filesToConvert = selectedFiles
      .filter((f) => f.status === "pending" || f.status === "error")
      .map((f) => ({
        id: f.id,
        file: f.file,
      }));

    startConversion(filesToConvert, (progressData: ConversionProgress) => {
      setSelectedFiles((prev) =>
        prev.map((file) =>
          file.id === progressData.id
            ? {
                ...file,
                status: progressData.status,
                progress: progressData.progress,
                convertedBlob: progressData.result?.blob,
                convertedUrl: progressData.result?.url,
                convertedSize: progressData.result?.size,
                error: progressData.error,
              }
            : file
        )
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Image Converter</h1>
      <section className="mb-6 text-center bg-white p-6 rounded-lg shadow-md">
        <div
          className="rounded-lg border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors group"
          onClick={handleUploadClick}
        >
          <div className="justify-center flex mb-4">
            <ImageUploadIcon className="w-20 h-20 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="gap-2 flex flex-col items-center">
            <div>이미지를 드래그하세요.</div>
            <p className="text-gray-400 text-sm">또는</p>
            <div>파일을 업로드하세요.</div>
            <p className="mt-1 text-xs text-gray-400">
              최대 {maxSize} (개당 100MB)
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </section>
      {selectedFiles.length > 0 && (
        <section className="mb-6 text-left bg-white p-6 rounded-lg shadow-md">
          <FileTable files={selectedFiles} onRemove={removeFile} />
          {/* 변환 버튼 */}
          <div className="mt-4">
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                isConverting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isConverting
                ? `변환 중... `
                : `${selectedFiles.length}개 파일 변환하기`}
            </button>
          </div>
        </section>
      )}

      {isDragging && <DropOverlay fileCount={fileCount} />}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
};

export default Converter;
