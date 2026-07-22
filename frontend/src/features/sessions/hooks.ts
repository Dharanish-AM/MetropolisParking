import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  startSession,
  endSession,
  getSessions,
  getSessionsHistory,
} from '../../api/endpoints/sessions';

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useSessions = (active?: boolean) => {
  return useQuery({
    queryKey: ['sessions', active],
    queryFn: () => getSessions(active),
  });
};

export const useSessionsHistory = (plateNumber: string) => {
  return useQuery({
    queryKey: ['sessions-history', plateNumber],
    queryFn: () => getSessionsHistory(plateNumber),
    enabled: !!plateNumber,
  });
};
