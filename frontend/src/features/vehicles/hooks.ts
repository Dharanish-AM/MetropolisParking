import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVehicles, createVehicle } from "../../api/endpoints/vehicles";

export const useVehicles = (plateNumber?: string) => {
  return useQuery({
    queryKey: ["vehicles", plateNumber],
    queryFn: () => getVehicles(plateNumber),
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};
