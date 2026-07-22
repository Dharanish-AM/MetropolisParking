import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`animate-pulse rounded-lg bg-neutral-border/50 ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
