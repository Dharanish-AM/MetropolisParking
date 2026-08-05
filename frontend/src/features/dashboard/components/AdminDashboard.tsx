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
import { useStartSession, useEndSession } from '../../sessions/hooks';
import { useToast } from '../../../context/ToastContext';
import { plateNumberSchema } from '../../../schemas/vehicle';
import { Activity, DollarSign, Plus, Key, TrendingUp, MapPin } from 'lucide-react';

interface RecentSession {
  id: string;
  plateNumber: string;
  spaceNumber: string;
  startTime: string;
  endTime: string | null;
  fee: number | null;
  status: string;
}

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
  plateNumber: plateNumberSchema,
  spaceId: z.string().min(1, 'Please select a space'),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

const checkOutSchema = z.object({
  plateNumber: z.string().min(1, 'Please select a vehicle to check out'),
});

type CheckOutFormValues = z.infer<typeof checkOutSchema>;

export const AdminDashboard: FC = () => {
  const { showToast } = useToast();

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
          showToast('Vehicle checked in successfully', 'success');
          resetCheckIn();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to check in', 'error');
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
          showToast(`Vehicle checked out successfully${feeMsg}`, 'success');
          resetCheckOut();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to check out', 'error');
        },
      }
    );
  };

  const activeSpaces = (spaces as ParkingSpace[])?.filter(s => s.status === 'OCCUPIED') || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-primary">
            Admin Dashboard
          </h1>
          <p className="text-sm text-neutral-secondary">
            Real-time occupancy rates, revenues, and quick vehicle check-in/out workflows.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <span className="text-sm font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-5 h-5 stroke-[1.5]" />
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="space-y-1">
              <div className="text-4xl font-extrabold tracking-tight">
                ${(stats?.financial?.totalRevenue ?? 0).toFixed(2)}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(stats?.financial?.revenueByMethod || {}).map(([method, amt]) => {
                  const parsedAmt = typeof amt === 'number' ? amt : parseFloat(amt as string);
                  return (
                    <Badge key={method} variant="neutral">
                      {method}: ${isNaN(parsedAmt) ? 0 : parsedAmt.toFixed(0)}
                    </Badge>
                  );
                })}
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
              {(lots as ParkingLot[])?.slice(0, 3).map((lot, idx) => (
                <div
                  key={lot.id}
                  className="flex items-center gap-1.5 text-xs text-neutral-secondary"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-primary/70" />
                  <span className="font-semibold">
                    {lot.name} {lot.location ? `(${lot.location})` : `#${idx + 1}`}
                  </span>
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
                <CardTitle>Recent Parking Activity</CardTitle>
                <CardDescription>
                  Latest registered vehicle check-ins and check-outs.
                </CardDescription>
              </div>
              <Badge variant="default">Live Polling</Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.recentSessions || stats.recentSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-neutral-secondary font-medium py-10"
                    >
                      {isLoading ? 'Loading activity...' : 'No recent parking sessions recorded'}
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentSessions.map((session: RecentSession) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                        {session.plateNumber}
                      </TableCell>
                      <TableCell>{session.spaceNumber}</TableCell>
                      <TableCell className="text-neutral-secondary text-xs">
                        {new Date(session.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'ACTIVE' ? 'AVAILABLE' : 'neutral'}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-neutral-primary">
                        {session.fee ? `$${session.fee.toFixed(2)}` : '—'}
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
              <CardDescription>Register a vehicle entry and assign a slot.</CardDescription>
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
              <CardDescription>Register exit and calculate outstanding fees.</CardDescription>
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
                    const session = (stats?.recentSessions as RecentSession[])?.find(
                      s => s.spaceNumber === space.spaceNumber && s.status === 'ACTIVE'
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
