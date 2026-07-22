import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useDashboardStats } from '../hooks';
import { useLots } from '../../lots/hooks';
import { useSpaces } from '../../spaces/hooks';
import { useSessions, useStartSession, useEndSession } from '../../sessions/hooks';
import {
  Activity,
  Plus,
  Key,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Square,
  Clock,
} from 'lucide-react';

interface ParkingSpace {
  id: string;
  spaceNumber: string;
  type: string;
  status: string;
  lotId: string;
  levelId: string;
}

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

const checkInSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'Plate number is required')
    .transform(val => val.toUpperCase().replace(/\s/g, ''))
    .refine(val => /^[A-Z0-9-]{4,15}$/.test(val), {
      message:
        'Plate number must be alphanumeric (optionally with hyphens) and 4 to 15 characters long.',
    }),
  spaceId: z.string().min(1, 'Please select a space'),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

const checkOutSchema = z.object({
  plateNumber: z.string().min(1, 'Please select a vehicle to check out'),
});

type CheckOutFormValues = z.infer<typeof checkOutSchema>;

export const OperatorDashboard: FC = () => {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const {
    register: registerCheckIn,
    handleSubmit: handleCheckInSubmit,
    reset: resetCheckIn,
    formState: { errors: checkInErrors },
  } = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      plateNumber: '',
      spaceId: '',
    },
  });

  const {
    register: registerCheckOut,
    handleSubmit: handleCheckOutSubmit,
    reset: resetCheckOut,
    formState: { errors: checkOutErrors },
  } = useForm<CheckOutFormValues>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: {
      plateNumber: '',
    },
  });

  const { data: stats, isLoading } = useDashboardStats();
  const { data: lots } = useLots();
  const { data: spaces } = useSpaces();
  const {
    data: activeSessionsList,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useSessions(true);

  const checkInMutation = useStartSession();
  const checkOutMutation = useEndSession();

  const onCheckInSubmit = (data: CheckInFormValues) => {
    checkInMutation.mutate(
      {
        plateNumber: data.plateNumber,
        spaceId: data.spaceId,
      },
      {
        onSuccess: () => {
          setNotification({ message: 'Vehicle checked in successfully', type: 'success' });
          resetCheckIn();
          refetchSessions();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to check in',
            type: 'error',
          });
        },
      }
    );
  };

  const onCheckOutSubmit = (data: CheckOutFormValues) => {
    checkOutMutation.mutate(
      {
        plateNumber: data.plateNumber,
      },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: $${res.fee})` : '';
          setNotification({
            message: `Vehicle checked out successfully${feeMsg}`,
            type: 'success',
          });
          resetCheckOut();
          refetchSessions();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to check out',
            type: 'error',
          });
        },
      }
    );
  };

  const handleQuickCheckOut = (plateNumber: string) => {
    if (!window.confirm(`End session and check out vehicle ${plateNumber}?`)) return;
    checkOutMutation.mutate(
      { plateNumber },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: $${res.fee})` : '';
          setNotification({
            message: `Vehicle ${plateNumber} checked out successfully${feeMsg}`,
            type: 'success',
          });
          refetchSessions();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to check out',
            type: 'error',
          });
        },
      }
    );
  };

  const activeSpaces = (spaces as ParkingSpace[])?.filter(s => s.status === 'OCCUPIED') || [];

  return (
    <div className="space-y-8">
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-100 text-green-800'
              : 'bg-red-50 border-red-100 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="text-sm font-semibold">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex justify-between items-center text-neutral-secondary">
            <span className="text-sm font-bold uppercase tracking-wider">Occupancy Rate</span>
            <Activity className="w-5 h-5 stroke-[1.5]" />
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="space-y-2">
              <div className="text-4xl font-extrabold tracking-tight">
                {(stats?.occupancy?.occupancyRate ?? 0).toFixed(1)}%
              </div>
              <p className="text-xs text-neutral-secondary font-semibold">
                {stats?.occupancy?.occupiedSpaces ?? 0} of {stats?.occupancy?.totalSpaces ?? 0}{' '}
                spaces filled
              </p>
              <div className="w-full bg-brand-primary/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats?.occupancy?.occupancyRate ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex justify-between items-center text-neutral-secondary">
            <span className="text-sm font-bold uppercase tracking-wider">Active Lots</span>
            <TrendingUp className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-extrabold tracking-tight">
              {(lots as ParkingLot[])?.length || 0}
            </div>
            <div className="flex flex-col gap-1">
              {(lots as ParkingLot[])?.slice(0, 2).map(lot => (
                <div
                  key={lot.id}
                  className="flex items-center gap-1.5 text-xs text-neutral-secondary"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{lot.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-neutral-border flex flex-row justify-between items-center space-y-0">
              <div>
                <CardTitle>Active Parking Sessions</CardTitle>
                <CardDescription>List of vehicles currently parked in your lots.</CardDescription>
              </div>
              <Badge variant="default">Operational View</Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSessionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Skeleton className="h-5 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !activeSessionsList || activeSessionsList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-neutral-secondary font-medium py-12"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-8 h-8 text-neutral-secondary stroke-[1.5]" />
                        <span>No active parking sessions found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeSessionsList.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                        {session.plateNumber}
                      </TableCell>
                      <TableCell className="font-semibold">{session.spaceNumber}</TableCell>
                      <TableCell className="text-neutral-secondary text-xs">
                        {new Date(session.entryTime).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          onClick={() => handleQuickCheckOut(session.plateNumber!)}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 font-bold inline-flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-red-600 text-red-600" />
                          Check Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Check In Vehicle</CardTitle>
              <CardDescription>Register entry & assign slot</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckInSubmit(onCheckInSubmit)} className="space-y-4">
                <Input
                  label="Plate Number"
                  placeholder="e.g. MH12AB1234"
                  mono
                  error={checkInErrors.plateNumber?.message}
                  {...registerCheckIn('plateNumber')}
                />
                <Select
                  label="Available Parking Space"
                  error={checkInErrors.spaceId?.message}
                  {...registerCheckIn('spaceId')}
                >
                  <option value="">Select a space</option>
                  {(spaces as ParkingSpace[])
                    ?.filter(s => s.status === 'AVAILABLE')
                    .map(space => (
                      <option key={space.id} value={space.id}>
                        {space.spaceNumber} ({space.type})
                      </option>
                    ))}
                </Select>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={checkInMutation.status === 'pending'}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                  Check In Entry
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check Out Vehicle</CardTitle>
              <CardDescription>Register exit & billing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckOutSubmit(onCheckOutSubmit)} className="space-y-4">
                <Select
                  label="Active Plate Number"
                  error={checkOutErrors.plateNumber?.message}
                  {...registerCheckOut('plateNumber')}
                >
                  <option value="">Select parked vehicle</option>
                  {activeSpaces.map(space => {
                    const session = (activeSessionsList || [])?.find(
                      s => s.spaceNumber === space.spaceNumber
                    );
                    return session ? (
                      <option key={session.id} value={session.plateNumber}>
                        {session.plateNumber} (Space: {space.spaceNumber})
                      </option>
                    ) : null;
                  })}
                </Select>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={checkOutMutation.status === 'pending'}
                  className="w-full"
                >
                  <Key className="w-4 h-4 stroke-[1.5]" />
                  Process Checkout
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
