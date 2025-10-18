import { Download, Loader2, Settings, Trash2 } from "lucide-react";
import type { FileItem } from "../../types/types";
import { formatFileSize, getFileExtension } from "../../utils";

interface FileTableProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onDownload: (fileItem: FileItem) => void;
  showCurrentExtension?: boolean;
  showTargetExtension?: boolean;
  showSettings?: boolean;
}

const FileTable = ({
  files,
  onRemove,
  onDownload,
  showCurrentExtension = true,
  showTargetExtension = true,
  showSettings = true
}: FileTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
              미리보기
            </th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
              이름
            </th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
              파일 크기
            </th>
            {showCurrentExtension && (
              <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                현재 확장자
              </th>
            )}
            {showTargetExtension && (
              <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
                목표 확장자
              </th>
            )}
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
              진행 상황
            </th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
              다운로드
            </th>
            {showSettings && (
              <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                설정
              </th>
            )}
            <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
              제거
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {files.map((fileItem) => (
            <tr key={fileItem.id} className="hover:bg-gray-50">
              <td className="px-2 md:px-4 py-2 md:py-3 flex justify-center">
                <img
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  className="w-6 h-6 md:w-8 md:h-8 object-cover rounded"
                />
              </td>
              <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 truncate max-w-xs text-center">
                {fileItem.file.name}
              </td>
              <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 text-center hidden md:table-cell">
                {formatFileSize(fileItem.file.size)}
              </td>
              {showCurrentExtension && (
                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 text-center hidden lg:table-cell">
                  .{getFileExtension(fileItem.file.name)}
                </td>
              )}
              {showTargetExtension && (
                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium text-blue-600 text-center">
                  .{fileItem.targetExtension}
                </td>
              )}
              <td className="px-2 md:px-4 py-2 md:py-3">
                <div className="flex items-center gap-2 justify-center">
                  {(fileItem.status === "converting" || fileItem.status === "removing") && (
                    <div className="flex-1">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-blue-600 animate-spin flex-shrink-0" />
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                            <div
                              className="bg-blue-600 h-1.5 md:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileItem.progress || 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {fileItem.progress || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {fileItem.status === "success" && (
                    <span className="text-green-600 text-xs md:text-sm font-medium">✓ 완료</span>
                  )}
                  {fileItem.status === "error" && (
                    <span
                      className="text-red-600 text-xs md:text-sm"
                      title={fileItem.error}
                    >
                      ✗ 실패
                    </span>
                  )}
                  {fileItem.status === "pending" && (
                    <span className="text-gray-400 text-xs md:text-sm">대기 중</span>
                  )}
                </div>
              </td>
              <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                <button
                  onClick={() => onDownload(fileItem)}
                  disabled={
                    fileItem.status !== "success" || !fileItem.convertedUrl
                  }
                  className="cursor-pointer text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                  title={
                    fileItem.status === "success"
                      ? "다운로드"
                      : "변환 완료 후 다운로드 가능"
                  }
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </td>
              {showSettings && (
                <td className="px-2 md:px-4 py-2 md:py-3 text-center hidden lg:table-cell">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </td>
              )}
              <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                <button
                  onClick={() => onRemove(fileItem.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
