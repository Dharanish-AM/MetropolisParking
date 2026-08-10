import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../../components/ui/Card';
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
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSessions, useStartSession, useEndSession } from '../hooks';
import { useSpaces } from '../../spaces/hooks';
import { useVehicles } from '../../vehicles/hooks';
import { Clock, Plus, Square, Search, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { plateNumberSchema } from '../../../schemas/vehicle';

const startSessionSchema = z.object({
  plateNumber: plateNumberSchema,
  spaceId: z.string().min(1, 'Available space is required'),
});

type StartSessionFormValues = z.infer<typeof startSessionSchema>;

export const SessionsFeature: FC = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [endSessionTarget, setEndSessionTarget] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: sessions, isLoading, refetch } = useSessions();
  const { data: spaces } = useSpaces();
  const { data: vehicles } = useVehicles();

  const startSessionMutation = useStartSession();
  const endSessionMutation = useEndSession();

  const vehicleMap = new Map<string, string>(
    (vehicles || []).map((v: any) => [v.id, v.plateNumber])
  );
  const spaceMap = new Map<string, string>((spaces || []).map((s: any) => [s.id, s.spaceNumber]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<StartSessionFormValues>({
    resolver: zodResolver(startSessionSchema),
    mode: 'onChange',
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
          showToast('Parking session started successfully.', 'success');
          refetch();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to start parking session.', 'error');
        },
      }
    );
  };

  const handleEndSession = (plateNumber: string) => {
    endSessionMutation.mutate(
      { plateNumber },
      {
        onSuccess: (res: any) => {
          const feeMsg = res.fee ? ` (Fee: ₹${res.fee})` : '';
          showToast(`Parking session ended successfully${feeMsg}.`, 'success');
          setEndSessionTarget(null);
          refetch();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to end parking session.', 'error');
          setEndSessionTarget(null);
        },
      }
    );
  };

  const filteredSessions = (sessions || []).filter(session => {
    const plate = session.plateNumber || vehicleMap.get(session.vehicleId) || '';
    const spaceNum = session.spaceNumber || spaceMap.get(session.spaceId) || '';
    const matchesPlate =
      plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spaceNum.toLowerCase().includes(searchTerm.toLowerCase());

    const isSessionActive = !session.exitTime && session.status === 'ACTIVE';

    if (filter === 'active') {
      return matchesPlate && isSessionActive;
    }
    if (filter === 'completed') {
      return matchesPlate && !isSessionActive;
    }
    return matchesPlate;
  });

  const availableSpaces = (spaces || []).filter((space: any) => space.status === 'AVAILABLE');

  const formatDuration = (session: any): string => {
    const mins = session.durationMinutes ?? session.duration;
    if (mins !== undefined && mins !== null) {
      if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `${hrs}h ${rem}m`;
    }
    if (session.entryTime && session.exitTime) {
      const diffMins = Math.max(
        1,
        Math.round(
          (new Date(session.exitTime).getTime() - new Date(session.entryTime).getTime()) / 60000
        )
      );
      return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
    }
    return '—';
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-primary">
            Parking Sessions
          </h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            Monitor active stays, record vehicle entry and exit times, and calculate fees.
          </p>
        </div>
        <Button onClick={() => setIsStartOpen(true)} variant="primary" className="gap-2">
          <Plus className="w-4 h-4 stroke-[2]" />
          Start Session
        </Button>
      </div>

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
                <TableCell colSpan={8} className="p-4 border-0">
                  <EmptyState
                    icon={Clock}
                    title="No parking sessions found"
                    description="There are currently no active or historical parking sessions matching your search or filters."
                    actionLabel="Start New Session"
                    onAction={() => setIsStartOpen(true)}
                    actionIcon={<Plus className="w-4 h-4" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map(session => {
                const isActive =
                  session.exitTime === null ||
                  session.exitTime === undefined ||
                  session.status === 'ACTIVE';
                const plate = session.plateNumber || vehicleMap.get(session.vehicleId) || '—';
                const spaceNum = session.spaceNumber || spaceMap.get(session.spaceId) || '—';
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono font-bold tracking-tight text-neutral-primary">
                      {plate}
                    </TableCell>
                    <TableCell className="font-semibold text-neutral-primary">{spaceNum}</TableCell>
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
                      {formatDuration(session)}
                    </TableCell>
                    <TableCell className="font-bold text-neutral-primary">
                      {session.fee !== null && session.fee !== undefined
                        ? `₹${session.fee.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? 'AVAILABLE' : 'neutral'}>
                        {isActive ? 'ACTIVE' : 'COMPLETED'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isActive && plate !== '—' ? (
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => setEndSessionTarget(plate)}
                        >
                          <Square className="w-3.5 h-3.5" />
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
              <AlertCircle className="w-4 h-4 text-status-occupied" /> No available parking spots
              left. Make a space available first.
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
              disabled={availableSpaces.length === 0 || !isValid}
            >
              Start
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={endSessionTarget !== null}
        title="End Parking Session"
        message={`Are you sure you want to end the session for vehicle ${endSessionTarget}?`}
        variant="primary"
        confirmLabel="End Session"
        isLoading={endSessionMutation.status === 'pending'}
        onConfirm={() => {
          if (endSessionTarget) {
            handleEndSession(endSessionTarget);
          }
        }}
        onCancel={() => setEndSessionTarget(null)}
      />
    </div>
  );
};
