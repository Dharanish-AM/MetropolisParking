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
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../auth/hooks/useAuth';
import { useVehicles, useCreateVehicle } from '../../vehicles/hooks';
import { useSpaces } from '../../spaces/hooks';
import { useSessions, useStartSession, useEndSession } from '../../sessions/hooks';
import { Car, Plus, Square, Clock, History, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { vehicleSchema } from '../../../schemas/vehicle';
import type { VehicleFormValues } from '../../../schemas/vehicle';

interface ParkingSpace {
  id: string;
  spaceNumber: string;
  type: string;
  status: string;
  lotId: string;
  levelId: string;
}

const checkInSchema = z.object({
  plateNumber: z.string().min(1, 'Please select a vehicle'),
  spaceId: z.string().min(1, 'Please select a space'),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

export const CustomerDashboard: FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<string | null>(null);

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
  const myVehicleIds = myVehicles.map(v => v.id);
  const vehicleDetailsMap = new Map<string, { plateNumber: string; type: string }>(
    (vehicles || []).map((v: any) => [v.id, { plateNumber: v.plateNumber, type: v.type }])
  );
  const spaceMap = new Map<string, string>((spaces || []).map((s: any) => [s.id, s.spaceNumber]));

  const activeStays = (sessions || [])
    .filter((s: any) => s.status === 'ACTIVE' && !s.exitTime && myVehicleIds.includes(s.vehicleId))
    .map((s: any) => {
      const details = vehicleDetailsMap.get(s.vehicleId);
      return {
        ...s,
        plateNumber: details?.plateNumber || 'Unknown',
        vehicleType: details?.type || 'CAR',
        spaceNumber: spaceMap.get(s.spaceId) || 'Unknown',
      };
    });

  const completedHistory = (sessions || [])
    .filter((s: any) => s.status !== 'ACTIVE' && s.exitTime && myVehicleIds.includes(s.vehicleId))
    .map((s: any) => {
      const details = vehicleDetailsMap.get(s.vehicleId);
      return {
        ...s,
        plateNumber: details?.plateNumber || 'Unknown',
        vehicleType: details?.type || 'CAR',
        spaceNumber: spaceMap.get(s.spaceId) || 'Unknown',
        duration: s.durationMinutes ?? s.duration,
      };
    });

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
          showToast('Vehicle registered successfully.', 'success');
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
          showToast('Vehicle checked in successfully.', 'success');
          refetchSessions();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to check in.', 'error');
        },
      }
    );
  };

  const handleConfirmCheckOut = () => {
    if (!checkoutTarget) return;
    const plateNumber = checkoutTarget;
    checkOutMutation.mutate(
      { plateNumber },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: ₹${res.fee})` : '';
          showToast(
            `Checked out successfully${feeMsg}. Please settle payments at the booth if required.`,
            'success'
          );
          refetchSessions();
          setCheckoutTarget(null);
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to check out.', 'error');
          setCheckoutTarget(null);
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-primary">
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
            <CardHeader className="px-6 py-5 border-b border-neutral-border flex flex-row items-center justify-between space-y-0">
              <div className="text-left">
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
                        <div className="flex items-center gap-2">
                          <span>{session.plateNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-sans font-bold bg-neutral-subtle text-neutral-secondary border border-neutral-border">
                            {session.vehicleType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-brand-primary">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-brand-primary/5 border border-brand-primary/10 text-xs font-mono">
                          {session.spaceNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-secondary font-medium">
                        {new Date(session.entryTime).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => setCheckoutTarget(session.plateNumber!)}
                        >
                          <Square className="w-3.5 h-3.5" />
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
            <CardHeader className="px-6 py-5 border-b border-neutral-border text-left">
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
                          ? `₹${session.fee.toFixed(2)}`
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
              <div className="flex flex-col items-center gap-2 text-center py-6 text-neutral-secondary text-sm">
                <Car className="w-8 h-8 text-neutral-secondary" />
                <span>No vehicles registered yet. Add one to start parking!</span>
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
          <div className="mb-4 p-3.5 bg-status-occupied/10 border border-status-occupied/20 text-status-occupied text-sm font-semibold rounded-xl">
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
              <AlertCircle className="w-4 h-4 text-status-occupied" /> No available parking spots
              left.
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

      <ConfirmDialog
        isOpen={checkoutTarget !== null}
        title="Check Out Vehicle"
        message={`Check out vehicle ${checkoutTarget}?`}
        confirmLabel="Check Out"
        variant="primary"
        isLoading={checkOutMutation.status === 'pending'}
        onConfirm={handleConfirmCheckOut}
        onCancel={() => setCheckoutTarget(null)}
      />
    </div>
  );
};
