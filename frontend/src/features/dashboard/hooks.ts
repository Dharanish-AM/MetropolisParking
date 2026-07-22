import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../api/endpoints/dashboard";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 5000,
  });
};
