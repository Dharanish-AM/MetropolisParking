import { client } from '../client';

export interface ReservationItem {
  id: string;
  userId: string;
  spaceId: string;
  spaceNumber: string;
  lotName: string;
  startTime: string;
  endTime: string;
  status: string;
  fee: number;
}

export const getReservations = async (): Promise<ReservationItem[]> => {
  const res = await client.get<ReservationItem[]>('/reservations');
  return res.data;
};
