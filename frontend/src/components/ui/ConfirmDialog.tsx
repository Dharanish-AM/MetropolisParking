import type { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3">
        {variant === 'danger' && (
          <div className="w-10 h-10 rounded-full bg-status-occupied/10 text-status-occupied flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
        <p className="text-sm text-neutral-secondary">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
