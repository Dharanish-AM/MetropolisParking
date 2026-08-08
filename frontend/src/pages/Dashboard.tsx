import type { FC } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { AdminDashboard } from '../features/dashboard/components/AdminDashboard';
import { CustomerDashboard } from '../features/dashboard/components/CustomerDashboard';

export const Dashboard: FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
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
