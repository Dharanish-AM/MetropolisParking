import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
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
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../auth/hooks/useAuth';
import { useVehicles, useCreateVehicle } from '../../vehicles/hooks';
import { useSpaces } from '../../spaces/hooks';
import { useSessions, useStartSession, useEndSession } from '../../sessions/hooks';
import { Car, Plus, Square, Clock, History, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

interface ParkingSpace {
  id: string;
  spaceNumber: string;
  type: string;
  status: string;
  lotId: string;
  levelId: string;
}

const vehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'Plate number is required')
    .transform(val => val.toUpperCase().replace(/\s/g, ''))
    .refine(val => /^[A-Z0-9-]{4,15}$/.test(val), {
      message:
        'Plate number must be alphanumeric (optionally with hyphens) and 4 to 15 characters long.',
    }),
  type: z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const checkInSchema = z.object({
  plateNumber: z.string().min(1, 'Please select a vehicle'),
  spaceId: z.string().min(1, 'Please select a space'),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

export const CustomerDashboard: FC = () => {
  const { user } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { data: vehicles, isLoading: isVehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { data: spaces } = useSpaces();
  const { data: sessions, isLoading: isSessionsLoading, refetch: refetchSessions } = useSessions();

  const createVehicleMutation = useCreateVehicle();
  const checkInMutation = useStartSession();
  const checkOutMutation = useEndSession();

  const {
    register: registerVehicle,
    handleSubmit: handleVehicleSubmit,
    reset: resetVehicle,
    formState: { errors: vehicleErrors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plateNumber: '',
      type: 'CAR',
    },
  });

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

  const myVehicles = (vehicles || []).filter(v => v.ownerId === user?.id);
  const myPlates = myVehicles.map(v => v.plateNumber);

  const activeStays = (sessions || []).filter(
    s => (s.status === 'ACTIVE' || !s.exitTime) && myPlates.includes(s.plateNumber || '')
  );

  const completedHistory = (sessions || []).filter(
    s => s.status !== 'ACTIVE' && s.exitTime && myPlates.includes(s.plateNumber || '')
  );

  const availableSpaces = (spaces as ParkingSpace[])?.filter(s => s.status === 'AVAILABLE') || [];

  const onRegisterVehicle = (data: VehicleFormValues) => {
    createVehicleMutation.mutate(
      {
        plateNumber: data.plateNumber,
        type: data.type,
        ownerId: user?.id || null,
      },
      {
        onSuccess: () => {
          setIsRegisterOpen(false);
          resetVehicle();
          setError(null);
          setNotification({ message: 'Vehicle registered successfully.', type: 'success' });
          refetchVehicles();
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              'Failed to register vehicle. License plate might be registered already.'
          );
        },
      }
    );
  };

  const onSelfCheckIn = (data: CheckInFormValues) => {
    checkInMutation.mutate(
      {
        plateNumber: data.plateNumber,
        spaceId: data.spaceId,
      },
      {
        onSuccess: () => {
          setIsCheckInOpen(false);
          resetCheckIn();
          setNotification({ message: 'Vehicle checked in successfully.', type: 'success' });
          refetchSessions();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to check in.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleCheckOut = (plateNumber: string) => {
    if (!window.confirm(`Check out vehicle ${plateNumber}?`)) return;
    checkOutMutation.mutate(
      { plateNumber },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: $${res.fee})` : '';
          setNotification({
            message: `Checked out successfully${feeMsg}. Please settle payments at the booth if required.`,
            type: 'success',
          });
          refetchSessions();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to check out.',
            type: 'error',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-primary">
            Welcome, {user?.name}
          </h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            Manage your registered vehicles, parkings and session history.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsRegisterOpen(true)}
            variant="secondary"
            className="gap-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
          <Button
            onClick={() => setIsCheckInOpen(true)}
            variant="primary"
            className="gap-2 text-xs font-bold"
            disabled={myVehicles.length === 0}
          >
            <MapPin className="w-4 h-4" />
            Park Vehicle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-0 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-neutral-border flex justify-between items-center">
              <div>
                <CardTitle>Active Stays</CardTitle>
                <CardDescription>Vehicles currently parked in the facility.</CardDescription>
              </div>
              <Badge variant="default">{activeStays.length} Parked</Badge>
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
                ) : activeStays.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-neutral-secondary font-medium"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-8 h-8 text-neutral-secondary" />
                        <span>None of your vehicles are currently parked.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeStays.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                        {session.plateNumber}
                      </TableCell>
                      <TableCell className="font-semibold">{session.spaceNumber}</TableCell>
                      <TableCell className="text-xs text-neutral-secondary">
                        {new Date(session.entryTime).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          onClick={() => handleCheckOut(session.plateNumber!)}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 font-bold inline-flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-red-600 text-red-600" />
                          Exit Parking
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-0 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-neutral-border">
              <CardTitle>Parking History</CardTitle>
              <CardDescription>Records of your past visits and transactions.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSessionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Skeleton className="h-5 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : completedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-neutral-secondary font-medium"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-neutral-secondary" />
                        <span>No completed parking history found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  completedHistory.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                        {session.plateNumber}
                      </TableCell>
                      <TableCell>{session.spaceNumber}</TableCell>
                      <TableCell className="text-sm font-semibold">
                        {session.duration ? `${session.duration} mins` : '—'}
                      </TableCell>
                      <TableCell className="font-bold text-neutral-primary">
                        {session.fee !== null && session.fee !== undefined
                          ? `$${session.fee.toFixed(2)}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">COMPLETED</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-secondary">
                My Registered Vehicles
              </h2>
              <Car className="w-5 h-5 text-neutral-secondary" />
            </div>
            {isVehiclesLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : myVehicles.length === 0 ? (
              <div className="text-center py-6 text-neutral-secondary text-sm">
                No vehicles registered yet. Add one to start parking!
              </div>
            ) : (
              <div className="divide-y divide-neutral-border">
                {myVehicles.map(vehicle => (
                  <div key={vehicle.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold tracking-tight text-neutral-primary">
                        {vehicle.plateNumber}
                      </div>
                      <div className="text-xs text-neutral-secondary mt-0.5">{vehicle.type}</div>
                    </div>
                    <Badge variant="neutral">Saved</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setError(null);
        }}
        title="Register New Vehicle"
      >
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-800 text-sm font-semibold rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleVehicleSubmit(onRegisterVehicle)} className="space-y-4">
          <Input
            label="Plate Number"
            placeholder="e.g. MH12AB1234"
            mono
            error={vehicleErrors.plateNumber?.message}
            {...registerVehicle('plateNumber')}
          />
          <Select
            label="Vehicle Type"
            error={vehicleErrors.type?.message}
            {...registerVehicle('type')}
          >
            <option value="CAR">Car</option>
            <option value="BIKE">Bike</option>
            <option value="SUV">SUV</option>
            <option value="TRUCK">Truck</option>
            <option value="EV">EV</option>
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsRegisterOpen(false);
                setError(null);
              }}
              className="w-auto px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createVehicleMutation.status === 'pending'}
              className="w-auto px-5"
            >
              Register
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Check In Vehicle"
      >
        <form onSubmit={handleCheckInSubmit(onSelfCheckIn)} className="space-y-4">
          <Select
            label="Select Registered Vehicle"
            error={checkInErrors.plateNumber?.message}
            {...registerCheckIn('plateNumber')}
          >
            <option value="">Choose vehicle...</option>
            {myVehicles.map(vehicle => {
              const isAlreadyParked = activeStays.some(s => s.plateNumber === vehicle.plateNumber);
              return (
                <option key={vehicle.id} value={vehicle.plateNumber} disabled={isAlreadyParked}>
                  {vehicle.plateNumber} ({vehicle.type}) {isAlreadyParked ? '— (Parked)' : ''}
                </option>
              );
            })}
          </Select>

          <Select
            label="Select Available Spot"
            error={checkInErrors.spaceId?.message}
            {...registerCheckIn('spaceId')}
          >
            <option value="">Choose spot...</option>
            {availableSpaces.map(space => (
              <option key={space.id} value={space.id}>
                {space.spaceNumber} ({space.type})
              </option>
            ))}
          </Select>

          {availableSpaces.length === 0 && (
            <p className="text-xs text-status-occupied font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" /> No available parking spots left.
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCheckInOpen(false)}
              className="w-auto px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={checkInMutation.status === 'pending'}
              className="w-auto px-5"
              disabled={availableSpaces.length === 0}
            >
              Start Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
