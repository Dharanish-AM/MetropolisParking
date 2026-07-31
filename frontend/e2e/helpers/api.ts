import type { APIRequestContext } from '@playwright/test';

const BACKEND = 'http://localhost:8080';

export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${BACKEND}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`Login failed (${res.status()}): ${await res.text()}`);
  const { token } = await res.json();
  return token as string;
}

export async function createLot(
  request: APIRequestContext,
  token: string,
  name: string,
  location: string
): Promise<{ id: string; name: string }> {
  const res = await request.post(`${BACKEND}/parking-lots`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, location },
  });
  if (!res.ok()) throw new Error(`Create lot failed (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function createLevel(
  request: APIRequestContext,
  token: string,
  lotId: string,
  levelNumber: number
): Promise<{ id: string }> {
  const res = await request.post(`${BACKEND}/parking-lots/${lotId}/levels`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { levelNumber },
  });
  if (!res.ok()) throw new Error(`Create level failed (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function createSpace(
  request: APIRequestContext,
  token: string,
  lotId: string,
  levelId: string,
  spaceNumber: string,
  type = 'CAR'
): Promise<{ id: string; spaceNumber: string }> {
  const res = await request.post(`${BACKEND}/spaces`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { lotId, levelId, spaceNumber, type },
  });
  if (!res.ok()) throw new Error(`Create space failed (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function createReservation(
  request: APIRequestContext,
  token: string,
  spaceId: string,
  vehicleType = 'CAR'
): Promise<{ id: string; status: string; spaceNumber: string }> {
  const now = new Date();
  const startTime = new Date(now.getTime() + 60_000).toISOString();
  const endTime = new Date(now.getTime() + 3_600_000).toISOString();
  const res = await request.post(`${BACKEND}/reservations`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { spaceId, startTime, endTime, vehicleType },
  });
  if (!res.ok()) throw new Error(`Create reservation failed (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function startSession(
  request: APIRequestContext,
  token: string,
  plateNumber: string,
  spaceId: string
): Promise<{ id: string }> {
  const res = await request.post(`${BACKEND}/sessions/start`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { plateNumber, spaceId },
  });
  if (!res.ok()) throw new Error(`Start session failed (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function endSession(
  request: APIRequestContext,
  token: string,
  plateNumber: string
): Promise<{ id: string }> {
  const res = await request.post(`${BACKEND}/sessions/end`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { plateNumber },
  });
  if (!res.ok()) throw new Error(`End session failed (${res.status()}): ${await res.text()}`);
  return res.json();
}
