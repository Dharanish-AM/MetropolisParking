import { client } from '../client';

export interface RevenueSummary {
  totalRevenue: number;
  todayRevenue: number;
  totalSessions: number;
  avgSessionFee: number;
}

export interface LotRevenueItem {
  lotId: string;
  lotName: string;
  totalRevenue: number;
  sessionCount: number;
}

export interface VehicleTypeRevenueItem {
  vehicleType: string;
  totalRevenue: number;
  percentage: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  sessionCount: number;
}

export interface AnalyticsResponse {
  summary: RevenueSummary;
  lotBreakdown: LotRevenueItem[];
  vehicleBreakdown: VehicleTypeRevenueItem[];
  trendPoints: RevenueTrendPoint[];
}

export const getRevenueAnalytics = async (lotId?: string): Promise<AnalyticsResponse> => {
  const params = lotId ? { lotId } : {};
  const res = await client.get<AnalyticsResponse>('/api/analytics/revenue', { params });
  return res.data;
};
