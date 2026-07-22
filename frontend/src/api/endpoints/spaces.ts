import { client } from '../client';

export const getSpaces = async () => {
  const res = await client.get('/spaces');
  return res.data;
};

export const createSpace = async (payload: {
  lotId: string;
  levelId: string;
  spaceNumber: string;
  type: string;
}) => {
  const res = await client.post('/spaces', payload);
  return res.data;
};

export const updateSpaceStatus = async (spaceId: string, status: string) => {
  const res = await client.put(`/spaces/${spaceId}/status`, status, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return res.data;
};

export const deleteSpace = async (spaceId: string) => {
  const res = await client.delete(`/spaces/${spaceId}`);
  return res.data;
};
