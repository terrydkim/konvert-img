import { TriangleAlert, X } from "lucide-react";
import type { ToastType } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast = ({ toast, onRemove }: ToastProps) => {
  return (
    <div className="bg-red-500 text-white rounded-lg shadow-lg p-4 min-w-80 max-w-md transition-all duration-300 ease-out">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-2">{toast.message}</p>
            <ul className="text-sm space-y-1 opacity-90">
              {toast.files.map((file, index) => (
                <li key={index} className="truncate">
                  {file.name} - {file.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white hover:text-gray-200 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
