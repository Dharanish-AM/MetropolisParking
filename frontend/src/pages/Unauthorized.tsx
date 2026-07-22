import type { FC } from "react";
import { Link } from "react-router-dom";
import { theme } from "../styles/theme";

export const Unauthorized: FC = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-primary flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-4xl font-extrabold text-status-occupied mb-4 tracking-tight">403 - Access Denied</h1>
      <p className="text-neutral-secondary mb-8 text-center max-w-md font-semibold text-sm">
        You do not have the required permissions to access this page. Please contact your system administrator.
      </p>
      <Link to="/" className={`${theme.components.buttonPrimary} max-w-xs`}>
        Go Back to Home
      </Link>
    </div>
  );
};
