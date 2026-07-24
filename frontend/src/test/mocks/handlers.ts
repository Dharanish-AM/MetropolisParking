import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8080';

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === 'admin@metropolisparking.com' && body.password === 'admin123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 'admin-id-123',
          name: 'Admin User',
          email: 'admin@metropolisparking.com',
          role: 'ADMIN',
        },
      });
    }
    return HttpResponse.json(
      { code: 'AUTH_FAILED', message: 'Invalid credentials', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }),

  http.get(`${BASE}/me`, () => {
    return HttpResponse.json({
      id: 'admin-id-123',
      name: 'Admin User',
      email: 'admin@metropolisparking.com',
      role: 'ADMIN',
    });
  }),

  http.get(`${BASE}/sessions`, () => {
    return HttpResponse.json([
      {
        id: 'session-111',
        vehicleId: 'veh-111',
        spaceId: 'space-111',
        entryTime: new Date().toISOString(),
        exitTime: null,
        status: 'ACTIVE',
      },
    ]);
  }),

  http.get(`${BASE}/reservations`, () => {
    return HttpResponse.json([
      {
        id: 'res-111',
        userId: 'admin-id-123',
        spaceId: 'space-111',
        spaceNumber: 'A-101',
        lotName: 'Central Lot',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'CONFIRMED',
        fee: 10.0,
      },
    ]);
  }),

  http.post(`${BASE}/qr/scan`, async ({ request }) => {
    const body = (await request.json()) as { qrToken?: string };
    if (body.qrToken && body.qrToken.length > 5) {
      return HttpResponse.json({
        action: 'CHECKIN',
        entityId: 'session-111',
        entityType: 'RESERVATION',
        plateNumber: 'QR-PASS-99',
        spaceNumber: 'A-101',
        status: 'ACTIVE',
        message: 'Gate opened for reserved space A-101',
      });
    }
    return HttpResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid or expired QR code token', timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }),
];
