import type { FC } from 'react';
import { Link } from 'react-router-dom';

export const Unauthorized: FC = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-primary flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-4xl font-extrabold text-status-occupied mb-4 tracking-tight">
        403 - Access Denied
      </h1>
      <p className="text-neutral-secondary mb-8 text-center max-w-md font-semibold text-sm">
        You do not have the required permissions to access this page. Please contact your system
        administrator.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 w-full max-w-xs px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-primary hover:bg-brand-primary/95 shadow-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
      >
        Go Back to Home
      </Link>
    </div>
  );
};
