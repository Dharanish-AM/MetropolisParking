import type { FC } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../features/auth/hooks/useAuth';
import { AdminDashboard } from '../features/dashboard/components/AdminDashboard';
import { OperatorDashboard } from '../features/dashboard/components/OperatorDashboard';
import { CustomerDashboard } from '../features/dashboard/components/CustomerDashboard';

export const Dashboard: FC = () => {
  const { user } = useAuth();

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'OPERATOR':
        return <OperatorDashboard />;
      case 'CUSTOMER':
        return <CustomerDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-neutral-secondary font-medium">
              Unauthorized role or session expired.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderDashboardContent()}
      </main>
    </div>
  );
};
