import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
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
import { useSessions, useStartSession, useEndSession } from '../features/sessions/hooks';
import { useSpaces } from '../features/spaces/hooks';
import { Clock, Plus, Square, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

const startSessionSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'Plate number is required')
    .transform(val => val.toUpperCase().replace(/\s/g, ''))
    .refine(val => /^[A-Z0-9-]{4,15}$/.test(val), {
      message:
        'Plate number must be alphanumeric (optionally with hyphens) and 4 to 15 characters long.',
    }),
  spaceId: z.string().min(1, 'Available space is required'),
});

type StartSessionFormValues = z.infer<typeof startSessionSchema>;

export const Sessions: FC = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { data: sessions, isLoading, refetch } = useSessions();
  const { data: spaces } = useSpaces();

  const startSessionMutation = useStartSession();
  const endSessionMutation = useEndSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StartSessionFormValues>({
    resolver: zodResolver(startSessionSchema),
    defaultValues: {
      plateNumber: '',
      spaceId: '',
    },
  });

  const onStartSubmit = (data: StartSessionFormValues) => {
    startSessionMutation.mutate(
      {
        plateNumber: data.plateNumber,
        spaceId: data.spaceId,
      },
      {
        onSuccess: () => {
          setIsStartOpen(false);
          reset();
          setNotification({ message: 'Parking session started successfully.', type: 'success' });
          refetch();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to start parking session.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleEndSession = (plateNumber: string) => {
    if (!window.confirm(`Are you sure you want to end the session for vehicle ${plateNumber}?`))
      return;

    endSessionMutation.mutate(
      { plateNumber },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: $${res.fee})` : '';
          setNotification({
            message: `Parking session ended successfully${feeMsg}.`,
            type: 'success',
          });
          refetch();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || 'Failed to end parking session.',
            type: 'error',
          });
        },
      }
    );
  };

  const filteredSessions = (sessions || []).filter(session => {
    const matchesPlate =
      (session.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.spaceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isSessionActive =
      session.exitTime === null || session.exitTime === undefined || session.status === 'ACTIVE';

    if (filter === 'active') {
      return matchesPlate && isSessionActive;
    }
    if (filter === 'completed') {
      return matchesPlate && !isSessionActive;
    }
    return matchesPlate;
  });

  const availableSpaces = (spaces || []).filter((space: any) => space.status === 'AVAILABLE');

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Parking Sessions</h1>
            <p className="text-neutral-secondary text-sm font-medium mt-1">
              Monitor active stays, record vehicle entry and exit times, and calculate fees.
            </p>
          </div>
          <Button onClick={() => setIsStartOpen(true)} variant="primary" className="gap-2">
            <Plus className="w-4 h-4 stroke-[2]" />
            Start Session
          </Button>
        </div>

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

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex p-1 bg-brand-primary/5 rounded-xl self-start gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-neutral-secondary hover:text-brand-primary'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === 'active'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-neutral-secondary hover:text-brand-primary'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === 'completed'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-neutral-secondary hover:text-brand-primary'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex-1 max-w-sm relative self-stretch sm:self-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-secondary" />
            <input
              type="text"
              placeholder="Search vehicle or space..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-sans"
            />
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Plate</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Exit Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
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
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-neutral-secondary font-medium py-12"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 text-neutral-secondary stroke-[1.5]" />
                      <span>No parking sessions found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map(session => {
                  const isActive =
                    session.exitTime === null ||
                    session.exitTime === undefined ||
                    session.status === 'ACTIVE';
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                        {session.plateNumber || '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-neutral-primary">
                        {session.spaceNumber || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-secondary">
                        {new Date(session.entryTime).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-secondary">
                        {session.exitTime
                          ? new Date(session.exitTime).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {session.duration ? `${session.duration} mins` : '—'}
                      </TableCell>
                      <TableCell className="font-bold text-neutral-primary">
                        {session.fee !== null && session.fee !== undefined
                          ? `$${session.fee.toFixed(2)}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'AVAILABLE' : 'neutral'}>
                          {isActive ? 'ACTIVE' : 'COMPLETED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isActive ? (
                          <Button
                            variant="secondary"
                            onClick={() => handleEndSession(session.plateNumber!)}
                            className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 font-bold"
                          >
                            <Square className="w-3 h-3 mr-1 fill-red-600 text-red-600" />
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-secondary font-semibold pr-3">
                            Completed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        <Modal
          isOpen={isStartOpen}
          onClose={() => setIsStartOpen(false)}
          title="Start Parking Session"
        >
          <form onSubmit={handleSubmit(onStartSubmit)} className="space-y-4">
            <Input
              label="Plate Number"
              placeholder="e.g. MH12AB1234"
              mono
              error={errors.plateNumber?.message}
              {...register('plateNumber')}
            />
            <Select
              label="Select Available Space"
              error={errors.spaceId?.message}
              {...register('spaceId')}
            >
              <option value="">Choose an available spot...</option>
              {availableSpaces.map((space: any) => (
                <option key={space.id} value={space.id}>
                  {space.spaceNumber} ({space.type})
                </option>
              ))}
            </Select>

            {availableSpaces.length === 0 && (
              <p className="text-xs text-status-occupied font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-500" /> No available parking spots left.
                Make a space available first.
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsStartOpen(false)}
                className="w-auto px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={startSessionMutation.status === 'pending'}
                className="w-auto px-5"
                disabled={availableSpaces.length === 0}
              >
                Start
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
