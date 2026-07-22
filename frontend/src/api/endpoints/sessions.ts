import { client } from "../client";

export interface Session {
  id: string;
  vehicleId: string;
  spaceId: string;
  entryTime: string;
  exitTime?: string | null;
  duration?: number | null;
  fee?: number | null;
  plateNumber?: string;
  spaceNumber?: string;
  status: "ACTIVE" | "COMPLETED" | string;
}

export const startSession = async (payload: { plateNumber: string; spaceId: string }): Promise<Session> => {
  const res = await client.post("/sessions/start", payload);
  return res.data;
};

export const endSession = async (payload: { plateNumber: string }): Promise<Session> => {
  const res = await client.post("/sessions/end", payload);
  return res.data;
};

export const getSessions = async (active?: boolean): Promise<Session[]> => {
  const res = await client.get("/sessions", {
    params: active !== undefined ? { active } : undefined,
  });
  return res.data;
};

export const getSessionsHistory = async (plateNumber: string): Promise<Session[]> => {
  const res = await client.get("/sessions/history", {
    params: { plateNumber },
  });
  return res.data;
};

