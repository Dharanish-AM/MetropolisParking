import type { FC } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useVehicles } from '../features/vehicles/hooks';
import { Mail, Shield, User as UserIcon, Car, CheckCircle2 } from 'lucide-react';

export const Profile: FC = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { data: vehicles, isLoading: isVehiclesLoading } = useVehicles();

  const myVehicles = (vehicles || []).filter(v => v.ownerId === user?.id);

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 animate-fade-in py-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-primary">My Profile</h1>
        <p className="text-neutral-secondary text-xs font-medium mt-1">
          Account identity and credentials.
        </p>
      </div>

      <Card className="p-6 md:p-8 space-y-6 border-neutral-border shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-border">
          <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-primary">{user?.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant={user?.role === 'ADMIN' ? 'default' : 'info'}>{user?.role}</Badge>
              <span className="text-xs text-status-available font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Account
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
              Full Name
            </p>
            <p className="font-bold text-neutral-primary">
              {isAuthLoading ? <Skeleton className="h-5 w-32" /> : user?.name}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
              Email Address
            </p>
            <p className="font-bold text-neutral-primary flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-neutral-secondary" />
              {isAuthLoading ? <Skeleton className="h-5 w-48" /> : user?.email}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
              Role Access Type
            </p>
            <p className="font-bold text-neutral-primary flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-neutral-secondary" />
              {user?.role === 'ADMIN' ? 'System Administrator' : 'Parking Customer'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
              User ID (UUID)
            </p>
            <p className="font-mono text-xs font-bold text-neutral-primary select-all">
              {user?.id || '—'}
            </p>
          </div>
        </div>

        {user?.role === 'CUSTOMER' && (
          <div className="pt-6 border-t border-neutral-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary flex items-center gap-1.5">
                <Car className="w-4 h-4 text-brand-primary" /> Registered Vehicles (
                {myVehicles.length})
              </span>
            </div>

            {isVehiclesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : myVehicles.length === 0 ? (
              <p className="text-xs text-neutral-secondary">
                No vehicles registered under your account.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {myVehicles.map(v => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-border bg-neutral-secondary-bg text-xs font-mono font-bold text-neutral-primary"
                  >
                    <span>{v.plateNumber}</span>
                    <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                      {v.type}
                    </Badge>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
