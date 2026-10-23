import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from '../context/toast';
import type { ToastType } from '../context/toast';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const styles: Record<ToastType, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: AlertCircle, className: 'bg-red-50 border-red-200 text-red-800' },
  info: { icon: Info, className: 'bg-blue-50 border-blue-200 text-blue-800' }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className } = styles[toast.type];
          return (
            <div key={toast.id} className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${className}`}>
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
