import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '../components/Navbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useVehicles, useCreateVehicle } from '../features/vehicles/hooks';
import { Car, Plus, Search, Info } from 'lucide-react';

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

export const Vehicles: FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vehicles, isLoading, refetch } = useVehicles();
  const createVehicleMutation = useCreateVehicle();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plateNumber: '',
      type: 'CAR',
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    createVehicleMutation.mutate(
      {
        plateNumber: data.plateNumber,
        type: data.type,
        ownerId: user?.id || null,
      },
      {
        onSuccess: () => {
          setIsRegisterOpen(false);
          reset();
          setError(null);
          refetch();
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
  const filteredVehicles = (vehicles || []).filter(vehicle => {
    const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (user?.role === 'CUSTOMER') {
      return matchesSearch && vehicle.ownerId === user.id;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Vehicle Registry</h1>
            <p className="text-neutral-secondary text-sm font-medium mt-1">
              {user?.role === 'CUSTOMER'
                ? 'Manage and register your personal vehicles.'
                : 'View and manage all registered vehicles in the system.'}
            </p>
          </div>
          <Button onClick={() => setIsRegisterOpen(true)} variant="primary" className="gap-2">
            <Plus className="w-4 h-4 stroke-[2]" />
            Register Vehicle
          </Button>
        </div>

        <Card className="p-0 overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-neutral-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-secondary" />
              <input
                type="text"
                placeholder="Search plate number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-sans"
              />
            </div>
            <Badge variant="neutral">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </Badge>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Plate</TableHead>
                <TableHead>Type</TableHead>
                {user?.role !== 'CUSTOMER' && <TableHead>Owner ID</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    {user?.role !== 'CUSTOMER' && (
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.role === 'CUSTOMER' ? 3 : 4}
                    className="text-center text-neutral-secondary font-medium py-12"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Car className="w-8 h-8 text-neutral-secondary stroke-[1.5]" />
                      <span>No vehicles found matching the search criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map(vehicle => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                      {vehicle.plateNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{vehicle.type}</Badge>
                    </TableCell>
                    {user?.role !== 'CUSTOMER' && (
                      <TableCell className="font-mono text-xs text-neutral-secondary">
                        {vehicle.ownerId || 'Guest User / Anonymous'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="secondary" className="px-3 py-1.5 text-xs font-semibold">
                        <Info className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Plate Number"
              placeholder="e.g. MH12AB1234"
              mono
              error={errors.plateNumber?.message}
              {...register('plateNumber')}
            />
            <Select label="Vehicle Type" error={errors.type?.message} {...register('type')}>
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
      </main>
    </div>
  );
};
