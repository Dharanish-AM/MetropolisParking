import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={`w-4 h-4 rounded border-neutral-border text-brand-primary focus:ring-brand-primary/20 focus:ring-2 accent-brand-primary transition-all disabled:opacity-50 cursor-pointer ${className}`}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-neutral-primary cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-xs font-medium text-status-occupied">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
