import { useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastType {
  id: string;
  message: string;
  variant: ToastVariant;
  details?: string[];
  duration?: number;
}

const useToast = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = (
    message: string,
    variant: ToastVariant = "info",
    details?: string[],
    duration: number = 5000
  ) => {
    const id = crypto.randomUUID();

    setToasts((prev) => [...prev, { id, message, variant, details, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export default useToast;
