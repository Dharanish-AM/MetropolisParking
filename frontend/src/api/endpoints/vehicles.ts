import { client } from '../client';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  ownerId?: string | null;
}

export const getVehicles = async (plateNumber?: string): Promise<Vehicle[]> => {
  const res = await client.get('/vehicles', {
    params: plateNumber ? { plateNumber } : undefined,
  });
  return res.data;
};

export const createVehicle = async (payload: {
  plateNumber: string;
  type: string;
  ownerId?: string | null;
}): Promise<Vehicle> => {
  const res = await client.post('/vehicles', payload);
  return res.data;
};
