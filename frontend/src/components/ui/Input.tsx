import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, mono, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputFont = mono ? "font-mono" : "font-sans";
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
          {leftIcon && (
            <div className="absolute left-3.5 text-neutral-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={`block w-full px-3 py-2.5 bg-white border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:bg-neutral-border/10 ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${inputFont} ${borderClass} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-neutral-secondary pointer-events-none">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";
