import { client } from '../client';

export interface PricingRule {
  id: string;
  ruleType: string;
  rate: number;
  vehicleType?: string;
  lotId?: string;
  startHour: number;
  endHour: number;
  occupancyThreshold: number;
  surgeMultiplier: number;
  minFee: number;
  maxDailyCap: number;
}

export interface PricingRuleCreatePayload {
  ruleType: string;
  rate: number;
  vehicleType?: string;
  lotId?: string;
  startHour?: number;
  endHour?: number;
  occupancyThreshold?: number;
  surgeMultiplier?: number;
  minFee?: number;
  maxDailyCap?: number;
}

export interface PricingCalculatePayload {
  lotId: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
}

export interface PricingCalculateResponse {
  durationMinutes: number;
  baseFee: number;
  surgeMultiplier: number;
  finalFee: number;
  appliedRuleType: string;
}

export const getPricingRules = async (): Promise<PricingRule[]> => {
  const res = await client.get<PricingRule[]>('/api/pricing-rules');
  return res.data;
};

export const createPricingRule = async (
  payload: PricingRuleCreatePayload
): Promise<PricingRule> => {
  const res = await client.post<PricingRule>('/api/pricing-rules', payload);
  return res.data;
};

export const updatePricingRule = async (
  id: string,
  payload: PricingRuleCreatePayload
): Promise<PricingRule> => {
  const res = await client.put<PricingRule>(`/api/pricing-rules/${id}`, payload);
  return res.data;
};

export const deletePricingRule = async (id: string): Promise<void> => {
  await client.delete(`/api/pricing-rules/${id}`);
};

export const calculateFeePreview = async (
  payload: PricingCalculatePayload
): Promise<PricingCalculateResponse> => {
  const res = await client.post<PricingCalculateResponse>(
    '/api/pricing-rules/calculate-preview',
    payload
  );
  return res.data;
};
