import { useRef, useState } from "react";
import ImageUploadIcon from "../../components/icons/ImageUploadIcon";
import useFileDrop from "../../hooks/useFileDrop";

import { Download, ImageIcon, Sliders } from "lucide-react";
import Toast from "../../components/Toast";
import useDownload from "../../hooks/useDownload";
import useImageConverter, {
  type ConversionProgress,
} from "../../hooks/useImageConverter";
import useToast from "../../hooks/useToast";
import validateFiles from "../../hooks/validateFiles";
import type { FileItem } from "../../types/types";
import { isMobile } from "../../utils";
import {
  MAX_SIZE_TOOLTIP_DESKTOP,
  MAX_SIZE_TOOLTIP_MOBILE,
} from "../../utils/const";
import DropOverlay from "./DropOverlay";
import FileTable from "./FileTable";

const maxSizeToolTip = isMobile()
  ? MAX_SIZE_TOOLTIP_MOBILE
  : MAX_SIZE_TOOLTIP_DESKTOP;

const Converter = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();

  const { isConverting, startConversion } = useImageConverter();

  const { downloadSingle, downloadZip } = useDownload();

  const successCount = selectedFiles.filter(
    (f) => f.status === "success"
  ).length;

  const convertibleCount = selectedFiles.filter(
    (f) => f.status === "pending" || f.status === "error"
  ).length;

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

  const resetAll = () => {
    const confirmed = window.confirm(
      `정말로 ${selectedFiles.length}개의 파일을 모두 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    selectedFiles.forEach((file) => {
      URL.revokeObjectURL(file.preview);
      if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
    });
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 xl:p-10">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-center">이미지 변환기</h1>
      <section className="mb-4 md:mb-6 text-center bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 sm:p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors group"
          onClick={handleUploadClick}
        >
          <div className="justify-center flex mb-3 md:mb-4">
            <ImageUploadIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="gap-2 flex flex-col items-center">
            <div>이미지를 드래그하세요.</div>
            <p className="text-gray-400 text-sm">또는</p>
            <div>파일을 업로드하세요.</div>
            <p className="mt-1 text-xs text-gray-400">
              최대 {maxSizeToolTip} (개당 100MB)
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
      {selectedFiles.length > 0 ? (
        <section className="mb-4 md:mb-6 text-left bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-700">
              파일 목록 ({selectedFiles.length}개)
            </h2>
            <button
              onClick={resetAll}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              전체 초기화
            </button>
          </div>
          <FileTable
            files={selectedFiles}
            onRemove={removeFile}
            onDownload={downloadSingle}
          />
          {/* 변환 버튼 */}
          <div className="mt-3 md:mt-4">
            <button
              onClick={handleConvert}
              disabled={isConverting || convertibleCount === 0}
              className={`w-full py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium text-white transition-colors ${
                isConverting || convertibleCount === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600  cursor-pointer"
              }`}
            >
              {isConverting
                ? `변환 중... `
                : convertibleCount === 0
                ? "변환할 파일 없음"
                : `${convertibleCount}개 파일 변환하기`}
            </button>
            {successCount > 0 && (
              <button
                onClick={() => downloadZip(selectedFiles)}
                disabled={isConverting}
                className="flex items-center justify-center gap-2 w-full my-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors
                cursor-pointer bg-green-500 hover:bg-green-600 text-white"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                <div>전체 다운로드 (ZIP) {successCount}개</div>
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="mb-4 md:mb-6 bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-6 md:mb-8">
              이미지 변환기 사용법
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                  확장자 변환
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  이미지 확장자를
                  <br />
                  간편하게 변경해보세요
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Sliders className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                  크기 및 용량 설정
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  이미지 크기와 용량을
                  <br />
                  자유롭게 조절할 수 있습니다
                </p>
              </div>
            </div>

            {/* 시작 안내 */}
            <div className="mt-6 md:mt-8 text-center">
              <p className="text-gray-500 text-xs md:text-sm">
                위에서 이미지를 업로드하여 시작하세요
              </p>
            </div>
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
    </div>
  );
};

export default Converter;
