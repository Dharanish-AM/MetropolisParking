import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLots, createLot, deleteLot, listLevels, createLevel } from '../../api/endpoints/lots';

export const useLots = () => {
  return useQuery({
    queryKey: ['parking-lots'],
    queryFn: getLots,
  });
};

export const useCreateLot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
    },
  });
};

export const useDeleteLot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
    },
  });
};

export const useLevels = (lotId: string) => {
  return useQuery({
    queryKey: ['levels', lotId],
    queryFn: () => listLevels(lotId),
    enabled: !!lotId,
  });
};

export const useCreateLevel = (lotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levelNumber: number) => createLevel(lotId, levelNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels', lotId] });
    },
  });
};
