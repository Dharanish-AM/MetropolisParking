import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helperText, options = [], children, id, ...props }, ref) => {
    const borderClass = error 
      ? "border-status-occupied focus:ring-status-occupied/20 focus:border-status-occupied" 
      : "border-neutral-border focus:ring-brand-primary/20 focus:border-brand-primary";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-neutral-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={id}
            ref={ref}
            className={`block w-full px-3 py-2.5 bg-white border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:bg-neutral-border/10 appearance-none cursor-pointer pr-10 ${borderClass} ${className}`}
            {...props}
          >
            {children || options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-neutral-secondary">
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-xs font-medium text-status-occupied">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
