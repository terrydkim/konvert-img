import { useMemo, useRef, useState } from "react";
import ImageUploadIcon from "../../components/icons/ImageUploadIcon";
import useFileDrop from "../../hooks/useFileDrop";

import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";
import validateFiles from "../../hooks/validateFiles";
import { isMobile } from "../../utils";
import {
  MAX_SIZE_TOOLTIP_DESKTOP,
  MAX_SIZE_TOOLTIP_MOBILE,
} from "../../utils/const";
import DropOverlay from "./DropOverlay";

const Converter = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();

  const maxSize = useMemo(
    () => (isMobile() ? MAX_SIZE_TOOLTIP_MOBILE : MAX_SIZE_TOOLTIP_DESKTOP),
    []
  );

  const handleFilesAdded = (files: File[]) => {
    const { valid, invalid } = validateFiles(files, selectedFiles);

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
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
      <section className="mb-6 text-left bg-white p-6 rounded-lg shadow-md">
        {selectedFiles.length > 0 && (
          <div>
            <h3>Selected Files:</h3>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

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
