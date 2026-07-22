import { client } from "../client";

export const getLots = async () => {
  const res = await client.get("/parking-lots");
  return res.data;
};

export const createLot = async (payload: { name: string; location: string }) => {
  const res = await client.post("/parking-lots", payload);
  return res.data;
};

export const deleteLot = async (lotId: string) => {
  const res = await client.delete(`/parking-lots/${lotId}`);
  return res.data;
};

export const listLevels = async (lotId: string) => {
  const res = await client.get(`/parking-lots/${lotId}/levels`);
  return res.data;
};

export const createLevel = async (lotId: string, levelNumber: number) => {
  const res = await client.post(`/parking-lots/${lotId}/levels`, { levelNumber });
  return res.data;
};
