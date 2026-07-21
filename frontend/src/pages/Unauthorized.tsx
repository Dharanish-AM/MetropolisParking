import type { FC } from "react";
import { Link } from "react-router-dom";

export const Unauthorized: FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Unauthorized</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        You do not have the required permissions to access this page. Please contact your administrator.
      </p>
      <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold">
        Go Back to Home
      </Link>
    </div>
  );
};
