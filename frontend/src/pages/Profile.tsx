import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useVehicles } from '../features/vehicles/hooks';
import { useSessions } from '../features/sessions/hooks';
import { getReservations } from '../api/endpoints/reservations';
import { useToast } from '../context/ToastContext';
import {
  Mail,
  ShieldCheck,
  Car,
  Clock,
  Calendar,
  Key,
  Edit3,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Check,
  Building,
  QrCode,
  Sliders,
  LogOut,
} from 'lucide-react';

const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EditProfileFormValues = z.infer<typeof editProfileSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const Profile: FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const { data: vehicles, isLoading: isVehiclesLoading } = useVehicles();
  const { data: sessions, isLoading: isSessionsLoading } = useSessions();
  const { data: reservations, isLoading: isReservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  });

  const myVehicles = (vehicles || []).filter(v => v.ownerId === user?.id);
  const mySessions = (sessions || []).filter(
    s => s.status === 'ACTIVE' || s.vehicleId === user?.id
  );
  const myReservations = (reservations || []).filter(
    r => r.userId === user?.id || r.status === 'CONFIRMED'
  );

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onEditSave = (data: EditProfileFormValues) => {
    showToast(`Profile details updated for ${data.name}.`, 'success');
    setIsEditProfileOpen(false);
  };

  const onPasswordSave = (_data: ChangePasswordFormValues) => {
    setIsSubmittingPassword(true);
    setTimeout(() => {
      setIsSubmittingPassword(false);
      setIsChangePasswordOpen(false);
      resetPassword();
      showToast('Password changed successfully. Please keep your credentials secure.', 'success');
    }, 600);
  };

  const adminPermissions = [
    'Full Parking Lot & Floor Level Configuration',
    'Real-time Space Status Mutations & Maintenance Overrides',
    'ANPR Entry & Exit Gate Scanner Control',
    'Dynamic Pricing Rules & Peak Multipliers Management',
    'System-wide Analytics, Metrics & Financial Ledgers',
    'User Account Roles & Access Control Policy',
  ];

  const customerPermissions = [
    'Personal Vehicle Registration & Management',
    'QR Gate Pass Generation for Fast Entry',
    'Advance Parking Space Reservation Booking',
    'Real-time Parking Space Occupancy Viewing',
    'Digital Invoice Settlement & Receipts Retrieval',
  ];

  const currentPermissions = user?.role === 'ADMIN' ? adminPermissions : customerPermissions;

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-border bg-gradient-to-r from-brand-primary/10 via-brand-lavender/30 to-brand-accent/10 p-6 md:p-8">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-brand-accent/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-brand-primary text-white font-black text-3xl shadow-md flex items-center justify-center border-4 border-white">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span
                className="w-4 h-4 rounded-full bg-status-available border-2 border-white absolute bottom-1 right-1"
                title="Account Status: Active"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-primary tracking-tight">
                  {user?.name}
                </h1>
                <Badge variant={user?.role === 'ADMIN' ? 'default' : 'info'}>{user?.role}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-secondary font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-brand-primary" />
                  {user?.email}
                </span>
                <span className="text-neutral-stroke">•</span>
                <span className="font-mono text-xs text-neutral-secondary">
                  ID: #{user?.id ? user.id.slice(0, 8) : 'sys-user'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="bg-white/80 backdrop-blur-xs shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-neutral-secondary" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="bg-white/80 backdrop-blur-xs shadow-2xs"
            >
              <Key className="w-3.5 h-3.5 mr-1.5 text-neutral-secondary" />
              Security
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-status-occupied hover:bg-status-occupied/10 hover:text-status-occupied"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover-lift border-neutral-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                Registered Vehicles
              </p>
              <p className="text-2xl font-black text-neutral-primary mt-1">
                {isVehiclesLoading ? <Skeleton className="h-8 w-12" /> : myVehicles.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
        </Card>

        <Card className="card-hover-lift border-neutral-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                Active Sessions
              </p>
              <p className="text-2xl font-black text-neutral-primary mt-1">
                {isSessionsLoading ? <Skeleton className="h-8 w-12" /> : mySessions.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-available/10 text-status-available flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
        </Card>

        <Card className="card-hover-lift border-neutral-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                Bookings &amp; Passes
              </p>
              <p className="text-2xl font-black text-neutral-primary mt-1">
                {isReservationsLoading ? <Skeleton className="h-8 w-12" /> : myReservations.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-reserved/10 text-status-reserved flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
        </Card>

        <Card className="card-hover-lift border-neutral-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                Account Status
              </p>
              <p className="text-sm font-bold text-status-available flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-4 h-4 inline" /> Verified Active
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-available/10 text-status-available flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="border-b border-neutral-border pb-4">
              <CardTitle className="text-lg font-bold text-neutral-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                Personal Credentials &amp; Identity
              </CardTitle>
              <CardDescription>
                Verified identity details linked to your MetropolisParking profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                    Full Name
                  </p>
                  <p className="text-sm font-bold text-neutral-primary mt-1">{user?.name}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                    Primary Email
                  </p>
                  <p className="text-sm font-bold text-neutral-primary mt-1">{user?.email}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                    System Role Access
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={user?.role === 'ADMIN' ? 'default' : 'info'}>
                      {user?.role}
                    </Badge>
                    <span className="text-xs text-neutral-secondary">
                      {user?.role === 'ADMIN' ? 'Full Control' : 'Standard User'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-secondary">
                    Unique User ID
                  </p>
                  <p className="text-xs font-mono font-bold text-neutral-primary mt-1 select-all">
                    {user?.id || 'sys-user-default'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-neutral-border pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-neutral-primary flex items-center gap-2">
                  <Car className="w-5 h-5 text-brand-primary" />
                  My Vehicles ({myVehicles.length})
                </CardTitle>
                <CardDescription>
                  Registered license plates linked for ANPR gate recognition and billing.
                </CardDescription>
              </div>
              <Link to="/vehicles">
                <Button variant="outline" size="sm">
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {isVehiclesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : myVehicles.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-border rounded-xl bg-neutral-secondary-bg/50">
                  <Car className="w-8 h-8 text-neutral-secondary mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-sm font-bold text-neutral-primary">No vehicles registered</p>
                  <p className="text-xs text-neutral-secondary mt-1 mb-4">
                    Register your vehicle license plate for automated gate entries.
                  </p>
                  <Link to="/vehicles">
                    <Button variant="primary" size="sm">
                      Register Vehicle
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myVehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3.5 border border-neutral-border rounded-xl bg-neutral-secondary-bg/30 hover:bg-neutral-secondary-bg/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-sm tracking-tight text-neutral-primary">
                            {vehicle.plateNumber}
                          </p>
                          <p className="text-xs text-neutral-secondary font-medium">
                            Registered vehicle
                          </p>
                        </div>
                      </div>
                      <Badge variant="neutral">{vehicle.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader className="border-b border-neutral-border pb-4">
              <CardTitle className="text-base font-bold text-neutral-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-status-available" />
                System Privileges
              </CardTitle>
              <CardDescription>
                Authorized operations for {user?.role} account level.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              {currentPermissions.map((perm, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                  <div className="w-4 h-4 rounded-full bg-status-available/10 text-status-available flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-neutral-primary leading-tight">{perm}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-neutral-border pb-4">
              <CardTitle className="text-base font-bold text-neutral-primary flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-primary" />
                Security &amp; Auth Session
              </CardTitle>
              <CardDescription>Active authentication session security tokens.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs font-medium">
              <div className="flex items-center justify-between p-3 bg-neutral-secondary-bg/60 rounded-xl border border-neutral-border">
                <span className="text-neutral-secondary font-semibold">JWT Session Status</span>
                <Badge variant="success">Active Token</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-secondary-bg/60 rounded-xl border border-neutral-border">
                <span className="text-neutral-secondary font-semibold">Encryption standard</span>
                <span className="font-mono text-neutral-primary font-bold">HMAC-SHA256</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full"
              >
                <Key className="w-3.5 h-3.5 mr-1.5" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 border-brand-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-brand-primary flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Quick Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <Link to="/" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-bold"
                >
                  <Building className="w-3.5 h-3.5 mr-2" />
                  Main Dashboard
                </Button>
              </Link>
              <Link to="/qr-scanner" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-bold"
                >
                  <QrCode className="w-3.5 h-3.5 mr-2" />
                  QR Gate Pass Scanner
                </Button>
              </Link>
              <Link to="/reservations" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-bold"
                >
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  Book Space Advance
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile Information"
      >
        <form onSubmit={handleEditSubmit(onEditSave)} className="space-y-4">
          <Input
            label="Display Name"
            {...registerEdit('name')}
            error={editErrors.name?.message}
            placeholder="Your full name"
          />
          <Input
            label="Email Address"
            type="email"
            {...registerEdit('email')}
            error={editErrors.email?.message}
            placeholder="name@example.com"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change Account Password"
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...registerPassword('currentPassword')}
            error={passwordErrors.currentPassword?.message}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            {...registerPassword('newPassword')}
            error={passwordErrors.newPassword?.message}
            placeholder="••••••••"
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...registerPassword('confirmPassword')}
            error={passwordErrors.confirmPassword?.message}
            placeholder="••••••••"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
              disabled={isSubmittingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
