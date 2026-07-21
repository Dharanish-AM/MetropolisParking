import type { FC } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";

export const Dashboard: FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold">Metropolis Parking Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-600 px-3 py-1 rounded text-sm font-semibold uppercase">{user?.role}</span>
            <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold text-sm">
              Log Out
            </button>
          </div>
        </header>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.name}!</h2>
          <p className="text-gray-400 mb-6">You are authenticated. The dashboard modules will load here shortly.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-750 p-4 border border-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Status Overview</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-3 w-3 rounded-full bg-status-available animate-pulse"></span>
                <span className="text-sm font-semibold">System Online</span>
              </div>
            </div>
            <div className="bg-gray-750 p-4 border border-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-1">User Account</h3>
              <p className="text-sm font-semibold mt-2">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
