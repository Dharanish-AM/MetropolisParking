import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '../api/client';
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
import { Calendar, Plus, XCircle, Info, AlertTriangle } from 'lucide-react';

const reservationSchema = z.object({
  lotId: z.string().min(1, 'Parking lot is required'),
  spaceId: z.string().min(1, 'Parking space is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationItem {
  id: string;
  userId: string;
  spaceId: string;
  spaceNumber: string;
  lotName: string;
  startTime: string;
  endTime: string;
  status: string;
  fee: number;
}

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

interface ParkingSpace {
  id: string;
  spaceNumber: string;
  status: string;
  type: string;
}

export const Reservations: FC = () => {
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: reservations,
    isLoading,
    refetch,
  } = useQuery<ReservationItem[]>({
    queryKey: ['reservations'],
    queryFn: async () => {
      const resp = await client.get('/reservations');
      return resp.data;
    },
  });

  const { data: lots } = useQuery<ParkingLot[]>({
    queryKey: ['parking-lots'],
    queryFn: async () => {
      const resp = await client.get('/parking-lots');
      return resp.data;
    },
    enabled: isBookOpen,
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: { spaceId: string; startTime: string; endTime: string }) => {
      const resp = await client.post('/reservations', data);
      return resp.data;
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const resp = await client.delete(`/reservations/${id}`);
      return resp.data;
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      lotId: '',
      spaceId: '',
      startTime: '',
      endTime: '',
    },
  });

  const selectedLotId = watch('lotId');

  const { data: spaces } = useQuery<ParkingSpace[]>({
    queryKey: ['spaces', selectedLotId],
    queryFn: async () => {
      const resp = await client.get(`/spaces?lotId=${selectedLotId}`);
      return resp.data;
    },
    enabled: isBookOpen && !!selectedLotId,
  });

  const onSubmit = (data: ReservationFormValues) => {
    const formattedData = {
      spaceId: data.spaceId,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };

    createReservationMutation.mutate(formattedData, {
      onSuccess: () => {
        setIsBookOpen(false);
        reset();
        setError(null);
        refetch();
      },
      onError: (err: any) => {
        setError(
          err.response?.data?.message ||
            'Failed to make a reservation. Space may already be booked.'
        );
      },
    });
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      cancelReservationMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'info';
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reservations</h1>
            <p className="text-neutral-secondary text-sm mt-1">
              Book and manage your parking spaces in advance
            </p>
          </div>
          <Button onClick={() => setIsBookOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Book Space</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-neutral-secondary">
              <Calendar className="w-5 h-5 text-brand-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-neutral-primary">
                Active & Past Bookings
              </span>
            </div>
          </CardHeader>

          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !reservations || reservations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <Info className="w-12 h-12 text-neutral-border" />
              <span className="text-neutral-secondary font-medium">
                No reservations found. Click 'Book Space' to get started.
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot Name</TableHead>
                  <TableHead>Space Number</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map(res => (
                  <TableRow key={res.id}>
                    <TableCell className="font-bold">{res.lotName}</TableCell>
                    <TableCell>
                      <Badge variant="info" className="font-mono">
                        {res.spaceNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(res.startTime)}</TableCell>
                    <TableCell className="text-sm">{formatDate(res.endTime)}</TableCell>
                    <TableCell className="font-bold text-brand-primary">
                      ${res.fee.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(res.status)}>{res.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {res.status === 'CONFIRMED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancel(res.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>

      <Modal
        isOpen={isBookOpen}
        onClose={() => {
          setIsBookOpen(false);
          reset();
          setError(null);
        }}
        title="Book Parking Space"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-primary">Select Parking Lot</label>
            <Select {...register('lotId')} error={errors.lotId?.message}>
              <option value="">Choose a lot...</option>
              {lots?.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} ({lot.location})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-primary">Select Parking Space</label>
            <Select
              {...register('spaceId')}
              error={errors.spaceId?.message}
              disabled={!selectedLotId}
            >
              <option value="">Choose a space...</option>
              {spaces?.map(space => (
                <option key={space.id} value={space.id}>
                  Space {space.spaceNumber} ({space.type} - {space.status})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-primary">Start Date & Time</label>
              <Input
                type="datetime-local"
                {...register('startTime')}
                error={errors.startTime?.message}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-primary">End Date & Time</label>
              <Input
                type="datetime-local"
                {...register('endTime')}
                error={errors.endTime?.message}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsBookOpen(false);
                reset();
                setError(null);
              }}
              disabled={createReservationMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createReservationMutation.isPending}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
