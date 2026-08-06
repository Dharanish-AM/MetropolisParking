import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-status-available/10 text-status-available border-status-available/20',
  },
  error: {
    icon: XCircle,
    className: 'bg-status-occupied/10 text-status-occupied border-status-occupied/20',
  },
  info: {
    icon: Info,
    className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  },
};

const AUTO_DISMISS_MS = 5000;

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(current => current.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      setToasts(current => [...current, { id, message, variant }]);
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => {
          const { icon: Icon, className } = VARIANT_STYLES[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-4 shadow-lg animate-slide-in-right bg-white ${className}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-primary flex-1">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-neutral-secondary hover:text-neutral-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
