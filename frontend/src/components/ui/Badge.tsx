import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'AVAILABLE'
    | 'OCCUPIED'
    | 'RESERVED'
    | 'OUT_OF_SERVICE';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';

    const variants = {
      default: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
      success: 'bg-status-available/10 text-status-available border-status-available/20',
      AVAILABLE: 'bg-status-available/10 text-status-available border-status-available/20',
      warning: 'bg-status-reserved/10 text-status-reserved border-status-reserved/20',
      RESERVED: 'bg-status-reserved/10 text-status-reserved border-status-reserved/20',
      danger: 'bg-status-occupied/10 text-status-occupied border-status-occupied/20',
      OCCUPIED: 'bg-status-occupied/10 text-status-occupied border-status-occupied/20',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
      neutral: 'bg-neutral-border/20 text-neutral-secondary border-neutral-border',
      OUT_OF_SERVICE:
        'bg-status-out-of-service/10 text-status-out-of-service border-status-out-of-service/20',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
