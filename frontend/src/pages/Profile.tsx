import { useState } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useVehicles } from '../features/vehicles/hooks';
import { useToast } from '../context/ToastContext';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Car,
  RefreshCw,
  LayoutDashboard,
  ParkingSquare,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const Profile: FC = () => {
  const { user, checkAuth, loading: isAuthLoading } = useAuth();
  const { data: vehicles, isLoading: isVehiclesLoading } = useVehicles();
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const myVehicles = (vehicles || []).filter(v => v.ownerId === user?.id);

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await checkAuth();
      showToast('Profile details synced with backend /me endpoint.', 'success');
    } catch {
      showToast('Failed to sync profile details.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            User credentials and authorization details synced directly from the backend.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} isLoading={isSyncing} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Sync Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 space-y-6">
          <CardHeader className="p-0 border-b border-neutral-border pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-primary">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user?.role === 'ADMIN' ? 'default' : 'info'}>{user?.role}</Badge>
                  <span className="text-xs text-status-available font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Synchronized
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                  Full Name
                </p>
                <p className="text-sm font-bold text-neutral-primary">
                  {isAuthLoading ? <Skeleton className="h-5 w-32" /> : user?.name}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                  Email Address
                </p>
                <p className="text-sm font-bold text-neutral-primary flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-neutral-secondary" />
                  {isAuthLoading ? <Skeleton className="h-5 w-48" /> : user?.email}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                  Role Privileges
                </p>
                <p className="text-sm font-bold text-neutral-primary">
                  {user?.role === 'ADMIN'
                    ? 'System Administrator (Full Control)'
                    : 'Parking Customer (Standard Access)'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                  User ID (UUID)
                </p>
                <p className="text-xs font-mono font-bold text-neutral-primary select-all">
                  {user?.id || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {user?.role === 'CUSTOMER' ? (
            <Card>
              <CardHeader className="p-0 border-b border-neutral-border pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Car className="w-4 h-4 text-brand-primary" /> My Vehicles
                  </CardTitle>
                  <CardDescription>Registered license plates</CardDescription>
                </div>
                <Link to="/vehicles">
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                {isVehiclesLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : myVehicles.length === 0 ? (
                  <p className="text-xs text-neutral-secondary font-medium">
                    No vehicles registered yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myVehicles.map(v => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2.5 border border-neutral-border rounded-lg bg-neutral-secondary-bg/50"
                      >
                        <span className="font-mono text-xs font-bold text-neutral-primary">
                          {v.plateNumber}
                        </span>
                        <Badge variant="neutral">{v.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-brand-primary/5 border-brand-primary/15">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-brand-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Admin Shortcuts
                </CardTitle>
                <CardDescription>System management tools</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-2 pt-2">
                <Link to="/" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-bold bg-white"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Dashboard
                  </Button>
                </Link>
                <Link to="/parking-lots" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-bold bg-white"
                  >
                    <ParkingSquare className="w-3.5 h-3.5 mr-2" /> Parking Lots
                  </Button>
                </Link>
                <Link to="/sessions" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-bold bg-white"
                  >
                    <Clock className="w-3.5 h-3.5 mr-2" /> Sessions
                  </Button>
                </Link>
                <Link to="/analytics" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-bold bg-white"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-2" /> Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
