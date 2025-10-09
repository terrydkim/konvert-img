import { CheckCircle, Info, TriangleAlert, X, XCircle } from "lucide-react";
import type { ToastType, ToastVariant } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { bg: "bg-green-500", icon: CheckCircle },
  error: { bg: "bg-red-500", icon: XCircle },
  warning: { bg: "bg-yellow-500", icon: TriangleAlert },
  info: { bg: "bg-blue-500", icon: Info },
};

const Toast = ({ toast, onRemove }: ToastProps) => {
  const { bg, icon: Icon } = variantStyles[toast.variant];

  return (
    <div className={`${bg} text-white rounded-lg shadow-lg p-4 min-w-80 max-w-md transition-all duration-300 ease-out`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-2">{toast.message}</p>
            {toast.details && toast.details.length > 0 && (
              <ul className="text-sm space-y-1 opacity-90">
                {toast.details.map((detail, index) => (
                  <li key={index} className="truncate">
                    {detail}
                  </li>
                ))}
              </ul>
            )}
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
