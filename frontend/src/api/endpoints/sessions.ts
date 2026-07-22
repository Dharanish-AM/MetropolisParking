import { client } from "../client";

export const startSession = async (payload: { plateNumber: string; spaceId: string }) => {
  const res = await client.post("/sessions/start", payload);
  return res.data;
};

export const endSession = async (payload: { plateNumber: string }) => {
  const res = await client.post("/sessions/end", payload);
  return res.data;
};
