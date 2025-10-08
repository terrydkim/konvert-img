import { Settings, Trash2 } from "lucide-react";
import { formatFileSize, getFileExtension } from "../../utils";

export interface FileItem {
  id: string;
  file: File;
  preview: string;
  targetExtension: string;
}

interface FileTableProps {
  files: FileItem[];
  onRemove: (id: string) => void;
}

const FileTable = ({ files, onRemove }: FileTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              미리보기
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              이름
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              파일 크기
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              현재 확장자
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              목표 확장자
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              설정
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              제거
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {files.map((fileItem) => (
            <tr key={fileItem.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 flex justify-center">
                <img
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  className="w-8 h-8 object-cover rounded"
                />
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-xs text-center ">
                {fileItem.file.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 text-center">
                {formatFileSize(fileItem.file.size)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 text-center">
                .{getFileExtension(fileItem.file.name)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-blue-600 text-center">
                .{fileItem.targetExtension}
              </td>
              <td className="px-4 py-3 text-center">
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onRemove(fileItem.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
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
