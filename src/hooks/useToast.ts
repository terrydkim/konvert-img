import { useState } from "react";
interface RejectedFile {
  name: string;
  reason: string;
}

export interface ToastType {
  id: string;
  message: string;
  files: RejectedFile[];
}

const useToast = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = (files: RejectedFile[]) => {
    const id = crypto.randomUUID();
    const message = `${files.length}개 파일 업로드 실패`;

    setToasts((prev) => [...prev, { id, message, files }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export default useToast;
