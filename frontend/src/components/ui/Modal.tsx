import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { FC, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      focusable?.[0]?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      if (isOpen) previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full bg-white rounded-2xl shadow-xl border border-neutral-border flex flex-col overflow-hidden animate-scale-up ${sizes[size]}`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-border">
          {title ? (
            <h3 id={titleId} className="text-lg font-bold text-neutral-primary">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-secondary hover:bg-neutral-border/20 hover:text-neutral-primary transition-all cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>,
    document.body
  );
};
