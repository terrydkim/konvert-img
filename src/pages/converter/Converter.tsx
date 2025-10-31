import { useCallback, useRef, useState } from "react";
import ImageUploadIcon from "../../components/icons/ImageUploadIcon";
import useFileDrop from "../../hooks/useFileDrop";

import { Download, ImageIcon, Sliders } from "lucide-react";
import SEO from "../../components/SEO";
import Toast from "../../components/Toast";
import useConversionHandler from "../../hooks/useConversionHandler";
import useDownload from "../../hooks/useDownload";
import useFileManager from "../../hooks/useFileManager";
import useImageConverter from "../../hooks/useImageConverter";
import useToast from "../../hooks/useToast";
import validateFiles from "../../hooks/validateFiles";
import type { ImageSettings } from "../../types/types";
import { isMobile } from "../../utils";
import {
  MAX_SIZE_TOOLTIP_DESKTOP,
  MAX_SIZE_TOOLTIP_MOBILE,
} from "../../utils/const";
import DropOverlay from "./DropOverlay";
import FileTable from "./FileTable";
import ImageSettingsModal from "./ImageSettingsModal";

const maxSizeToolTip = isMobile()
  ? MAX_SIZE_TOOLTIP_MOBILE
  : MAX_SIZE_TOOLTIP_DESKTOP;

const Converter = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();

  // 파일 관리 훅
  const {
    files: selectedFiles,
    addFiles,
    removeFile,
    updateFile,
    updateFileSettings,
    updateFileExtension,
    resetAll: resetAllFiles,
    findFile,
    successCount,
    convertibleCount,
  } = useFileManager();

  const { isConverting, startConversion } = useImageConverter();
  const { downloadSingle, downloadZip } = useDownload();

  // 모달 상태 관리
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileImageDimensions, setEditingFileImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const { valid, invalid } = validateFiles(
        files,
        selectedFiles.map((f) => f.file)
      );

      if (valid.length > 0) {
        addFiles(valid);
      }

      if (invalid.length > 0) {
        const details = invalid.map(
          (item) => `${item.file.name} - ${item.reason}`
        );
        showToast(`${invalid.length}개 파일 업로드 실패`, "error", details);
      }
    },
    [selectedFiles, addFiles, showToast]
  );

  const resetAll = useCallback(() => {
    const confirmed = window.confirm(
      `정말로 ${selectedFiles.length}개의 파일을 모두 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    resetAllFiles();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedFiles.length, resetAllFiles]);

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

  // 에러 핸들러
  const handleConversionError = useCallback(
    (fileName: string | undefined, errorMessage: string) => {
      showToast(
        `${fileName ? `"${fileName}" ` : ""}변환 실패: ${errorMessage}`,
        "error"
      );
    },
    [showToast]
  );

  // 변환 진행 상황 처리
  const { handleProgress } = useConversionHandler({
    onUpdateFile: updateFile,
    onError: handleConversionError,
    findFile,
  });

  const handleConvert = useCallback(() => {
    const filesToConvert = selectedFiles
      .filter((f) => f.status === "pending" || f.status === "error")
      .map((f) => ({
        id: f.id,
        file: f.file,
        options: {
          targetExtension: f.targetExtension,
          settings: f.settings,
        },
      }));

    startConversion(filesToConvert, handleProgress);
  }, [selectedFiles, startConversion, handleProgress]);

  const handleDownloadZip = async () => {
    const result = await downloadZip(selectedFiles);
    if (result.success) {
      showToast(`${result.count}개 파일 다운로드 완료`, "success");
      return;
    }

    showToast(
      result.error || "다운로드 실패",
      result.error === "다운로드할 파일이 없습니다." ? "warning" : "error"
    );
  };

  // 설정 버튼 클릭 핸들러
  const handleOpenSettings = (fileId: string) => {
    const file = selectedFiles.find((f) => f.id === fileId);
    if (!file) return;

    // 이미지 실제 크기를 가져오기 위해 Image 객체 사용
    const img = new Image();
    img.onload = () => {
      setEditingFileImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setEditingFileId(fileId);
      setIsSettingsModalOpen(true);
    };
    img.src = file.preview;
  };

  // 설정 저장 핸들러
  const handleSaveSettings = useCallback(
    (settings: ImageSettings) => {
      if (!editingFileId) return;

      updateFileSettings(editingFileId, settings);
      setEditingFileId(null);
      setEditingFileImageDimensions(null);
    },
    [editingFileId, updateFileSettings]
  );

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsSettingsModalOpen(false);
    setEditingFileId(null);
    setEditingFileImageDimensions(null);
  };

  // 현재 편집 중인 파일 찾기
  const editingFile = editingFileId
    ? selectedFiles.find((f) => f.id === editingFileId)
    : null;

  // 확장자 변경 핸들러
  const handleExtensionChange = useCallback(
    (fileId: string, extension: string) => {
      updateFileExtension(fileId, extension);
    },
    [updateFileExtension]
  );

  const converterJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "konvert-img 이미지 변환기",
    "url": "https://konvert-img.com/",
    "description": "무료 온라인 이미지 변환 도구. PNG, WEBP, JPG 형식으로 이미지를 빠르고 안전하게 변환하세요.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "featureList": [
      "PNG 이미지 변환",
      "WEBP 이미지 변환",
      "JPG 이미지 변환",
      "일괄 이미지 변환",
      "이미지 크기 조정",
      "이미지 품질 설정"
    ]
  };

  return (
    <>
      <SEO
        title="무료 이미지 변환기 | PNG, WEBP, JPG 변환 - konvert-img"
        description="이미지를 PNG, WEBP, JPG 형식으로 무료 변환하세요. 브라우저에서 빠르고 안전하게 일괄 변환 가능. 업로드 불필요, 100% 개인정보 보호."
        keywords="이미지 변환, PNG 변환, WEBP 변환, JPG 변환, 무료 이미지 컨버터, 온라인 이미지 변환, 일괄 이미지 변환"
        canonical="https://konvert-img.com/"
        jsonLd={converterJsonLd}
      />
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
            <p className="text-gray-600 text-sm">또는</p>
            <div>파일을 업로드하세요.</div>
            <p className="mt-1 text-xs text-gray-600">
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
            onSettings={handleOpenSettings}
            onExtensionChange={handleExtensionChange}
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
                onClick={handleDownloadZip}
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

      {/* 이미지 설정 모달 */}
      {editingFile && editingFileImageDimensions && (
        <ImageSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveSettings}
          currentSettings={editingFile.settings}
          originalWidth={editingFileImageDimensions.width}
          originalHeight={editingFileImageDimensions.height}
        />
      )}
      </div>
    </div>
    </>
  );
};

export default Converter;
