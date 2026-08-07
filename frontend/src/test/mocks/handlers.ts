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
    if (body.email === 'customer@metropolisparking.com' && body.password === 'customer123') {
      return HttpResponse.json({
        token: 'mock-jwt-customer-token',
        user: {
          id: 'customer-id-123',
          name: 'Customer User',
          email: 'customer@metropolisparking.com',
          role: 'CUSTOMER',
        },
      });
    }
    return HttpResponse.json(
      { code: 'AUTH_FAILED', message: 'Invalid credentials', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }),

  http.get(`${BASE}/me`, ({ request }) => {
    const auth = request.headers.get('Authorization') ?? '';
    if (auth.includes('mock-jwt-customer-token')) {
      return HttpResponse.json({
        id: 'customer-id-123',
        name: 'Customer User',
        email: 'customer@metropolisparking.com',
        role: 'CUSTOMER',
      });
    }
    return HttpResponse.json({
      id: 'admin-id-123',
      name: 'Admin User',
      email: 'admin@metropolisparking.com',
      role: 'ADMIN',
    });
  }),

  http.get(`${BASE}/parking-lots`, () => {
    return HttpResponse.json([
      {
        id: 'lot-1',
        name: 'Downtown Central',
        location: '123 Main St',
        totalSpaces: 50,
        availableSpaces: 20,
      },
      {
        id: 'lot-2',
        name: 'Westside Plaza',
        location: '456 West Ave',
        totalSpaces: 30,
        availableSpaces: 10,
      },
    ]);
  }),

  http.post(`${BASE}/parking-lots`, async ({ request }) => {
    const body = (await request.json()) as { name: string; location: string };
    return HttpResponse.json(
      { id: 'lot-3', name: body.name, location: body.location },
      { status: 201 }
    );
  }),

  http.get(`${BASE}/parking-lots/:id/levels`, () => {
    return HttpResponse.json([
      { id: 'lvl-1', lotId: 'lot-1', levelNumber: 1 },
      { id: 'lvl-2', lotId: 'lot-1', levelNumber: 2 },
    ]);
  }),

  http.get(`${BASE}/spaces`, () => {
    return HttpResponse.json([
      {
        id: 'space-111',
        lotId: 'lot-1',
        levelId: 'lvl-1',
        spaceNumber: 'A-101',
        type: 'CAR',
        status: 'AVAILABLE',
      },
      {
        id: 'space-222',
        lotId: 'lot-1',
        levelId: 'lvl-1',
        spaceNumber: 'A-102',
        type: 'CAR',
        status: 'OCCUPIED',
      },
    ]);
  }),

  http.post(`${BASE}/spaces`, async ({ request }) => {
    const body = (await request.json()) as {
      lotId: string;
      levelId: string;
      spaceNumber: string;
      type: string;
    };
    return HttpResponse.json({ id: 'space-333', ...body, status: 'AVAILABLE' }, { status: 201 });
  }),

  http.get(`${BASE}/vehicles`, () => {
    return HttpResponse.json([
      { id: 'veh-1', plateNumber: 'MH12AB1234', type: 'CAR', ownerId: 'customer-id-123' },
      { id: 'veh-2', plateNumber: 'KA01CD5678', type: 'SUV', ownerId: 'admin-id-123' },
    ]);
  }),

  http.post(`${BASE}/vehicles`, async ({ request }) => {
    const body = (await request.json()) as { plateNumber: string; type: string };
    if (body.plateNumber === 'DUP123') {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: 'Vehicle already registered',
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }
    return HttpResponse.json(
      { id: 'veh-3', plateNumber: body.plateNumber, type: body.type, ownerId: 'customer-id-123' },
      { status: 201 }
    );
  }),

  http.get(`${BASE}/payments`, () => {
    return HttpResponse.json([
      { id: 'pay-1', sessionId: 'sess-1', amount: 15.0, method: 'CARD', status: 'SETTLED' },
      { id: 'pay-2', sessionId: 'sess-2', amount: 25.0, method: 'CASH', status: 'PENDING' },
      { id: 'pay-3', sessionId: 'sess-3', amount: 10.0, method: 'UPI', status: 'PENDING' },
    ]);
  }),

  http.post(`${BASE}/payments/:id/settle`, ({ params }) => {
    return HttpResponse.json({ id: params.id, amount: 25.0, method: 'CARD', status: 'SETTLED' });
  }),

  http.post(`${BASE}/payments/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, amount: 25.0, method: 'CARD', status: 'SETTLED' });
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

  http.post(`${BASE}/sessions/start`, async ({ request }) => {
    const body = (await request.json()) as { plateNumber: string; spaceId: string };
    return HttpResponse.json({
      id: 'session-222',
      plateNumber: body.plateNumber,
      spaceId: body.spaceId,
      entryTime: new Date().toISOString(),
      status: 'ACTIVE',
    });
  }),

  http.post(`${BASE}/sessions/end`, () => {
    return HttpResponse.json({
      id: 'session-111',
      exitTime: new Date().toISOString(),
      durationMinutes: 45,
      fee: 5.0,
      status: 'COMPLETED',
    });
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

  http.post(`${BASE}/reservations`, async ({ request }) => {
    const body = (await request.json()) as {
      spaceId: string;
      startTime: string;
      endTime: string;
      vehicleType: string;
    };
    return HttpResponse.json({
      id: 'res-222',
      spaceId: body.spaceId,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'CONFIRMED',
      fee: 15.0,
    });
  }),

  http.delete(`${BASE}/reservations/:id`, () => {
    return HttpResponse.json({ message: 'Reservation cancelled successfully' });
  }),

  http.post(`${BASE}/anpr/entry`, () => {
    return HttpResponse.json({
      sessionId: 'session-anpr-1',
      plateNumber: 'ANPR123',
      spaceNumber: 'A-101',
      levelNumber: 1,
      entryTime: new Date().toISOString(),
    });
  }),

  http.post(`${BASE}/anpr/exit`, () => {
    return HttpResponse.json({
      sessionId: 'session-anpr-1',
      plateNumber: 'ANPR123',
      durationMinutes: 60,
      fee: 10.0,
      paymentStatus: 'SETTLED',
    });
  }),

  http.get(`${BASE}/dashboard`, () => {
    return HttpResponse.json({
      occupancy: { totalSpaces: 80, occupiedSpaces: 50, availableSpaces: 30, occupancyRate: 62.5 },
      financial: { totalRevenue: 1250.0, revenueByMethod: { CARD: 800, CASH: 450 } },
      recentSessions: [],
    });
  }),

  http.get(`${BASE}/qr/generate`, () => {
    return HttpResponse.json({
      qrToken: 'mock-qr-jwt-token',
      payload: 'SESSION:MH12AB1234:A-101:session-111',
    });
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
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired QR code token',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }),

  http.get(`${BASE}/api/pricing-rules`, () => {
    return HttpResponse.json([
      {
        id: 'rule-1',
        ruleType: 'PEAK_SURGE',
        rate: 50.0,
        vehicleType: 'CAR',
        lotId: 'lot-1',
        startHour: 8,
        endHour: 18,
        occupancyThreshold: 75,
        surgeMultiplier: 1.25,
        minFee: 10.0,
        maxDailyCap: 250.0,
      },
    ]);
  }),

  http.post(`${BASE}/api/pricing-rules`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: 'rule-new',
      ...body,
    });
  }),

  http.post(`${BASE}/api/pricing-rules/calculate-preview`, () => {
    return HttpResponse.json({
      durationMinutes: 120,
      baseFee: 100.0,
      surgeMultiplier: 1.25,
      finalFee: 125.0,
      appliedRuleType: 'PEAK_SURGE',
    });
  }),

  http.get(`${BASE}/api/analytics/revenue`, () => {
    return HttpResponse.json({
      summary: {
        totalRevenue: 12500.5,
        todayRevenue: 2450.0,
        totalSessions: 142,
        avgSessionFee: 88.03,
      },
      lotBreakdown: [
        { lotId: 'lot-1', lotName: 'Downtown Central', totalRevenue: 8500.0, sessionCount: 95 },
        { lotId: 'lot-2', lotName: 'North Suburb', totalRevenue: 4000.5, sessionCount: 47 },
      ],
      vehicleBreakdown: [
        { vehicleType: 'CAR', totalRevenue: 9000.0, percentage: 72.0 },
        { vehicleType: 'BIKE', totalRevenue: 3500.5, percentage: 28.0 },
      ],
      trendPoints: [
        { date: '2026-08-01', revenue: 1800.0, sessionCount: 20 },
        { date: '2026-08-02', revenue: 2450.0, sessionCount: 28 },
      ],
    });
  }),
];

export const errorHandlers = [
  http.get(`${BASE}/*`, () => {
    return HttpResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }),
  http.post(`${BASE}/*`, () => {
    return HttpResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }),
];
