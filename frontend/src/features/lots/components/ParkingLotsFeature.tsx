import { useState } from 'react';
import type { FC } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import { LotForm } from './LotForm';
import type { LotFormValues } from './LotForm';
import { SpaceForm } from '../../spaces/components/SpaceForm';
import type { SpaceFormValues } from '../../spaces/components/SpaceForm';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLots, useCreateLot, useDeleteLot, useLevels, useCreateLevel } from '../hooks';
import {
  useSpaces,
  useCreateSpace,
  useUpdateSpaceStatus,
  useDeleteSpace,
  useSpaceDetails,
} from '../../spaces/hooks';
import { Building2, Layers, Car, Zap, Plus, Trash2, Bike } from 'lucide-react';

interface ParkingSpace {
  id: string;
  lotId: string;
  levelId: string;
  spaceNumber: string;
  type: string;
  status: string;
}

interface ParkingLevel {
  id: string;
  lotId: string;
  levelNumber: number;
}

interface ParkingLot {
  id: string;
  name: string;
  location: string;
}

const levelSchema = z.object({
  levelNumber: z.number().int('Floor must be an integer'),
});

type LevelFormValues = z.infer<typeof levelSchema>;

export const ParkingLotsFeature: FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('ALL');
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);

  const [isAddLotOpen, setIsAddLotOpen] = useState(false);
  const [isAddLevelOpen, setIsAddLevelOpen] = useState(false);
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const [isDeleteLotConfirmOpen, setIsDeleteLotConfirmOpen] = useState(false);
  const [isDeleteSpaceConfirmOpen, setIsDeleteSpaceConfirmOpen] = useState(false);

  const { data: lots, isLoading: loadingLots } = useLots();

  const activeLotId =
    selectedLotId ||
    (lots && (lots as ParkingLot[]).length > 0 ? (lots as ParkingLot[])[0].id : '');

  const { data: levels } = useLevels(activeLotId);
  const { data: spaces, isLoading: loadingSpaces } = useSpaces();
  const { data: spaceDetails, isLoading: loadingDetails } = useSpaceDetails(
    selectedSpace?.id || null
  );

  const {
    register: registerLevel,
    handleSubmit: handleLevelSubmit,
    reset: resetLevel,
    formState: { errors: levelErrors },
  } = useForm<LevelFormValues>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      levelNumber: 1,
    },
  });

  const updateSpaceStatusMutation = useUpdateSpaceStatus();
  const deleteSpaceMutation = useDeleteSpace();
  const createLotMutation = useCreateLot();
  const deleteLotMutation = useDeleteLot();
  const createLevelMutation = useCreateLevel(activeLotId);
  const createSpaceMutation = useCreateSpace();

  const filteredSpaces =
    (spaces as ParkingSpace[])?.filter(space => {
      if (space.lotId !== activeLotId) return false;
      if (selectedLevelId !== 'ALL' && space.levelId !== selectedLevelId) {
        return false;
      }
      return true;
    }) || [];

  const getSpaceIcon = (type: string) => {
    switch (type) {
      case 'EV':
        return <Zap className="w-3.5 h-3.5" />;
      case 'BIKE':
        return <Bike className="w-3.5 h-3.5" />;
      default:
        return <Car className="w-3.5 h-3.5" />;
    }
  };

  const handleAddLotSubmit = (data: LotFormValues) => {
    createLotMutation.mutate(
      {
        name: data.name,
        location: data.location,
      },
      {
        onSuccess: (res: any) => {
          showToast('Parking lot created successfully', 'success');
          setIsAddLotOpen(false);
          setSelectedLotId(res.id);
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to create lot', 'error');
        },
      }
    );
  };

  const handleAddLevelSubmit = (data: LevelFormValues) => {
    createLevelMutation.mutate(data.levelNumber, {
      onSuccess: () => {
        showToast('Level created successfully', 'success');
        setIsAddLevelOpen(false);
        resetLevel();
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Failed to create level', 'error');
      },
    });
  };

  const handleAddSpaceSubmit = (data: SpaceFormValues) => {
    if (!activeLotId || selectedLevelId === 'ALL') {
      showToast('Please select a specific level to add a space', 'error');
      return;
    }
    createSpaceMutation.mutate(
      {
        lotId: activeLotId,
        levelId: selectedLevelId,
        spaceNumber: data.spaceNumber,
        type: data.type,
      },
      {
        onSuccess: () => {
          showToast('Space created successfully', 'success');
          setIsAddSpaceOpen(false);
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to create space', 'error');
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-primary tracking-tight">
            Parking Lots &amp; Floor Layouts
          </h1>
          <p className="mt-1 text-sm text-neutral-secondary">
            Real-time slot occupancy visualization, level indices, and space management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsAddLotOpen(true)}>
            <Plus className="w-4 h-4" /> Add Lot
          </Button>
          {activeLotId && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAddLevelOpen(true)}>
                <Plus className="w-4 h-4" /> Add Level
              </Button>
              {selectedLevelId !== 'ALL' && (
                <Button variant="primary" size="sm" onClick={() => setIsAddSpaceOpen(true)}>
                  <Plus className="w-4 h-4" /> Add Space
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteLotConfirmOpen(true)}
                  isLoading={deleteLotMutation.status === 'pending'}
                >
                  <Trash2 className="w-4 h-4" /> Delete Lot
                </Button>
              )}
            </>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-border text-xs font-semibold bg-white text-neutral-secondary">
            <span className="w-2 h-2 rounded-full bg-status-available animate-pulse" />
            Live Updates
          </span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {loadingLots ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            (lots as ParkingLot[])?.map((lot, idx) => {
              const lotSpaces = (spaces as ParkingSpace[])?.filter(s => s.lotId === lot.id) || [];
              const capacity = lotSpaces.length;
              const occupiedCount = lotSpaces.filter(s => s.status === 'OCCUPIED').length;
              const sameNameCount =
                (lots as ParkingLot[])?.filter(l => l.name === lot.name).length || 0;
              const lotLabel =
                sameNameCount > 1
                  ? `${lot.name} (${lot.location || `Building ${idx + 1}`})`
                  : lot.name;
              return (
                <button
                  key={lot.id}
                  onClick={() => {
                    setSelectedLotId(lot.id);
                    setSelectedLevelId('ALL');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    activeLotId === lot.id
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'bg-white border border-neutral-border text-neutral-secondary hover:text-neutral-primary hover:bg-neutral-border/20'
                  }`}
                >
                  <Building2 className="w-4 h-4 stroke-[1.75]" />
                  <span>{lotLabel}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      activeLotId === lot.id
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-border/60 text-neutral-secondary'
                    }`}
                  >
                    {occupiedCount}/{capacity} filled
                  </span>
                </button>
              );
            })
          )}
        </div>

        {activeLotId && (
          <div className="flex items-center gap-3 bg-white p-4 border border-neutral-border rounded-2xl flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-secondary mr-2">
              <Layers className="w-4 h-4" />
              Levels:
            </div>
            <button
              onClick={() => setSelectedLevelId('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                selectedLevelId === 'ALL'
                  ? 'bg-neutral-primary text-white'
                  : 'bg-neutral-border/40 text-neutral-secondary hover:text-neutral-primary'
              }`}
            >
              All Floors
            </button>
            {(levels as ParkingLevel[])?.map(level => (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  selectedLevelId === level.id
                    ? 'bg-neutral-primary text-white'
                    : 'bg-neutral-border/40 text-neutral-secondary hover:text-neutral-primary'
                }`}
              >
                Floor {level.levelNumber}
              </button>
            ))}
          </div>
        )}
      </section>

      {activeLotId && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-primary">Interactive Slot Grid</h2>
              {loadingSpaces ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span className="text-xs text-neutral-secondary font-semibold">
                  ({filteredSpaces.length} slots loaded)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-available" />
                <span className="text-neutral-secondary">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-occupied" />
                <span className="text-neutral-secondary">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-reserved" />
                <span className="text-neutral-secondary">Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-out-of-service" />
                <span className="text-neutral-secondary">Out of Service</span>
              </div>
            </div>
          </div>

          {loadingSpaces ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="text-center py-12 text-neutral-secondary border border-dashed border-neutral-border rounded-xl">
              <Car className="w-10 h-10 mx-auto mb-3 text-brand-primary/40" />
              <h4 className="text-sm font-bold text-neutral-primary">No slots found</h4>
              <p className="text-xs mt-1">Select a floor and add space slots to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredSpaces.map(space => {
                const isRawHex = space.spaceNumber.startsWith('S-') && space.spaceNumber.length > 6;
                const spaceLabel = isRawHex
                  ? `Spot ${space.spaceNumber.replace('S-', '').slice(0, 4).toUpperCase()}`
                  : space.spaceNumber;
                return (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpace(space)}
                    className={`p-4 border rounded-2xl flex flex-col items-center justify-between gap-3 transition-all duration-150 hover:scale-[1.02] cursor-pointer text-center relative overflow-hidden bg-white border-neutral-border hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
                  >
                    <div className="flex items-center justify-between w-full text-xs font-semibold text-neutral-secondary">
                      <span className="font-mono font-bold text-neutral-primary">{spaceLabel}</span>
                      {getSpaceIcon(space.type)}
                    </div>
                    <Badge variant={space.status as any} className="w-full justify-center">
                      {space.status.replace(/_/g, ' ')}
                    </Badge>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-secondary">
                      {space.type}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={isAddLotOpen}
        onClose={() => setIsAddLotOpen(false)}
        title="Create New Parking Lot"
      >
        <LotForm onSubmit={handleAddLotSubmit} isLoading={createLotMutation.status === 'pending'} />
      </Modal>

      <Modal
        isOpen={isAddLevelOpen}
        onClose={() => setIsAddLevelOpen(false)}
        title="Add Parking Level"
      >
        <form onSubmit={handleLevelSubmit(handleAddLevelSubmit)} className="space-y-4">
          <Input
            type="number"
            label="Floor Number"
            error={levelErrors.levelNumber?.message}
            {...registerLevel('levelNumber', { valueAsNumber: true })}
          />
          <Button
            type="submit"
            isLoading={createLevelMutation.status === 'pending'}
            className="w-full"
          >
            Add Level
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isAddSpaceOpen}
        onClose={() => setIsAddSpaceOpen(false)}
        title="Add Parking Space"
      >
        <SpaceForm
          onSubmit={handleAddSpaceSubmit}
          isLoading={createSpaceMutation.status === 'pending'}
        />
      </Modal>

      <Modal
        isOpen={!!selectedSpace}
        onClose={() => setSelectedSpace(null)}
        title={selectedSpace ? `Manage Space ${selectedSpace.spaceNumber}` : ''}
      >
        {selectedSpace && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-secondary">
                Set New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'].map(statusOption => (
                  <button
                    key={statusOption}
                    onClick={() =>
                      updateSpaceStatusMutation.mutate(
                        { spaceId: selectedSpace.id, status: statusOption },
                        {
                          onSuccess: () => {
                            showToast('Space status updated successfully', 'success');
                            setSelectedSpace(null);
                          },
                          onError: (err: any) => {
                            showToast(
                              err.response?.data?.message || 'Failed to update status',
                              'error'
                            );
                          },
                        }
                      )
                    }
                    disabled={updateSpaceStatusMutation.status === 'pending'}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                      selectedSpace.status === statusOption
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-neutral-border bg-white text-neutral-secondary hover:text-neutral-primary hover:bg-neutral-border/20'
                    }`}
                  >
                    {statusOption.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {(selectedSpace.status === 'OCCUPIED' || selectedSpace.status === 'RESERVED') && (
              <div className="border-t border-neutral-border pt-4 space-y-4">
                {loadingDetails ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : spaceDetails ? (
                  <>
                    {selectedSpace.status === 'OCCUPIED' && spaceDetails.activeSession && (
                      <div className="bg-neutral-border/10 p-4 rounded-2xl border border-neutral-border space-y-3 text-left">
                        <h3 className="text-sm font-bold text-neutral-primary flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-brand-primary" /> Active Session Info
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-neutral-secondary block">Plate Number</span>
                            <span className="font-bold text-neutral-primary font-mono bg-white border border-neutral-border px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                              {spaceDetails.activeSession.plateNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-secondary block">Vehicle Type</span>
                            <span className="font-bold text-neutral-primary uppercase inline-block mt-0.5">
                              {spaceDetails.activeSession.vehicleType}
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-neutral-border/50 my-1 pt-1.5">
                            <span className="text-neutral-secondary block">Customer / Owner</span>
                            <span className="font-bold text-neutral-primary block mt-0.5">
                              {spaceDetails.activeSession.customerName || 'Walk-in / Unknown'}
                            </span>
                            {spaceDetails.activeSession.customerEmail && (
                              <span className="text-neutral-secondary block mt-0.5 text-[11px]">
                                {spaceDetails.activeSession.customerEmail}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 border-t border-neutral-border/50 my-1 pt-1.5">
                            <span className="text-neutral-secondary block">Parked Since</span>
                            <span className="font-bold text-neutral-primary block mt-0.5">
                              {new Date(spaceDetails.activeSession.entryTime).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedSpace.status === 'RESERVED' && spaceDetails.activeReservation && (
                      <div className="bg-neutral-border/10 p-4 rounded-2xl border border-neutral-border space-y-3 text-left">
                        <h3 className="text-sm font-bold text-neutral-primary flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-brand-primary" /> Reservation Info
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="col-span-2">
                            <span className="text-neutral-secondary block">Reserved For</span>
                            <span className="font-bold text-neutral-primary block mt-0.5">
                              {spaceDetails.activeReservation.customerName}
                            </span>
                            <span className="text-neutral-secondary block mt-0.5 text-[11px]">
                              {spaceDetails.activeReservation.customerEmail}
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-neutral-border/50 my-1 pt-1.5">
                            <span className="text-neutral-secondary block">Reservation Period</span>
                            <span className="font-bold text-neutral-primary block mt-0.5">
                              {new Date(spaceDetails.activeReservation.startTime).toLocaleString()}{' '}
                              -
                            </span>
                            <span className="font-bold text-neutral-primary block mt-0.5">
                              {new Date(spaceDetails.activeReservation.endTime).toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t border-neutral-border/50 my-1 pt-1.5">
                            <span className="text-neutral-secondary block">Reservation Status</span>
                            <Badge
                              variant={spaceDetails.activeReservation.status as any}
                              className="mt-1"
                            >
                              {spaceDetails.activeReservation.status}
                            </Badge>
                          </div>
                          <div className="border-t border-neutral-border/50 my-1 pt-1.5">
                            <span className="text-neutral-secondary block">Estimated Fee</span>
                            <span className="font-bold text-brand-primary block mt-1">
                              ${Number(spaceDetails.activeReservation.fee).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-neutral-secondary italic">
                    No active session/reservation details found.
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-neutral-border flex justify-between gap-3">
              {isAdmin && (
                <Button
                  variant="danger"
                  onClick={() => setIsDeleteSpaceConfirmOpen(true)}
                  isLoading={deleteSpaceMutation.status === 'pending'}
                >
                  Delete Space
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelectedSpace(null)}>
                Close Window
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteLotConfirmOpen}
        title="Delete Parking Lot"
        message="Are you sure you want to delete this parking lot and all associated levels/spaces?"
        confirmLabel="Delete Lot"
        variant="danger"
        isLoading={deleteLotMutation.status === 'pending'}
        onConfirm={() => {
          deleteLotMutation.mutate(activeLotId, {
            onSuccess: () => {
              showToast('Parking lot deleted successfully', 'success');
              setSelectedLotId('');
              setIsDeleteLotConfirmOpen(false);
            },
            onError: (err: any) => {
              showToast(err.response?.data?.message || 'Failed to delete lot', 'error');
              setIsDeleteLotConfirmOpen(false);
            },
          });
        }}
        onCancel={() => setIsDeleteLotConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteSpaceConfirmOpen}
        title="Delete Parking Space"
        message="Are you sure you want to delete this parking space?"
        confirmLabel="Delete Space"
        variant="danger"
        isLoading={deleteSpaceMutation.status === 'pending'}
        onConfirm={() => {
          if (!selectedSpace) return;
          deleteSpaceMutation.mutate(selectedSpace.id, {
            onSuccess: () => {
              showToast('Space deleted successfully', 'success');
              setSelectedSpace(null);
              setIsDeleteSpaceConfirmOpen(false);
            },
            onError: (err: any) => {
              showToast(err.response?.data?.message || 'Failed to delete space', 'error');
              setIsDeleteSpaceConfirmOpen(false);
            },
          });
        }}
        onCancel={() => setIsDeleteSpaceConfirmOpen(false)}
      />
    </div>
  );
};
