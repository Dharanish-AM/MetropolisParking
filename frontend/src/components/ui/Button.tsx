import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
    
    const variants = {
      primary: "bg-brand-primary text-white hover:bg-brand-primary/95 shadow-sm border border-transparent focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-brand-disabled",
      secondary: "bg-brand-lavender text-brand-primary border border-transparent hover:bg-brand-primary/10 shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary",
      outline: "bg-transparent text-neutral-primary border border-neutral-border hover:bg-neutral-border/10 focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary",
      ghost: "bg-transparent text-neutral-secondary hover:text-neutral-primary hover:bg-brand-border/20 focus:ring-2 focus:ring-brand-primary",
      danger: "bg-status-occupied text-white hover:bg-status-occupied/95 shadow-sm border border-transparent focus:ring-2 focus:ring-offset-2 focus:ring-status-occupied"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-5 py-3 text-base gap-2.5"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
