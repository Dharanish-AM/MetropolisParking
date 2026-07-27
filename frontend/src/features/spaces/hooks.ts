import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSpaces, createSpace, updateSpaceStatus, deleteSpace, getSpaceDetails } from '../../api/endpoints/spaces';

export const useSpaces = () => {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: getSpaces,
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useUpdateSpaceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, status }: { spaceId: string; status: string }) =>
      updateSpaceStatus(spaceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useSpaceDetails = (spaceId: string | null) => {
  return useQuery({
    queryKey: ['spaceDetails', spaceId],
    queryFn: () => getSpaceDetails(spaceId!),
    enabled: !!spaceId,
  });
};

