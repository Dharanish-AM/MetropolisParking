import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, processPayment } from "../../api/endpoints/payments";

export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, method }: { paymentId: string; method: string }) =>
      processPayment(paymentId, { method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
