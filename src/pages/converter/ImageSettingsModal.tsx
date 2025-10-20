import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ImageSettings } from "../../types/types";

interface ImageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ImageSettings) => void;
  currentSettings?: ImageSettings;
  originalWidth: number;
  originalHeight: number;
}

const ImageSettingsModal = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
  originalWidth,
  originalHeight,
}: ImageSettingsModalProps) => {
  const [quality, setQuality] = useState(currentSettings?.quality ?? 80);
  const [width, setWidth] = useState(currentSettings?.width ?? originalWidth);
  const [height, setHeight] = useState(currentSettings?.height ?? originalHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(
    currentSettings?.maintainAspectRatio ?? true
  );

  // 비율 계산
  const aspectRatio = originalWidth / originalHeight;
  const DEFAULT_QUALITY = 80;
  // 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setQuality(currentSettings?.quality ?? DEFAULT_QUALITY);
      setWidth(currentSettings?.width ?? originalWidth);
      setHeight(currentSettings?.height ?? originalHeight);
      setMaintainAspectRatio(currentSettings?.maintainAspectRatio ?? true);
    }
  }, [isOpen, currentSettings, originalWidth, originalHeight]);

  // 너비 변경 시 비율 유지
  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  // 높이 변경 시 비율 유지
  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  // 비율 유지 토글
  const handleAspectRatioToggle = () => {
    const newValue = !maintainAspectRatio;
    setMaintainAspectRatio(newValue);

    // 비율 유지를 켤 때 현재 너비 기준으로 높이 재계산
    if (newValue) {
      setHeight(Math.round(width / aspectRatio));
    }
  };

  const handleSave = () => {
    const settings: ImageSettings = {
      quality,
      width,
      height,
      maintainAspectRatio,
    };
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            이미지 설정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-6">
          {/* 품질 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              품질: {quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>낮음 (1%)</span>
              <span>높음 (100%)</span>
            </div>
          </div>

          {/* 크기 설정 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                이미지 크기
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={handleAspectRatioToggle}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">비율 유지</span>
              </label>
            </div>

            <div className="space-y-3">
              {/* 너비와 높이 가로 배치 */}
              <div className="flex gap-3">
                {/* 너비 */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    너비 (px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 높이 */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    높이 (px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 원본 크기 정보 */}
              <p className="text-xs text-gray-500">
                원본 크기: {originalWidth} × {originalHeight} px
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSettingsModal;
