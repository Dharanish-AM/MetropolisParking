import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp-up to 50 VUs
    { duration: '20s', target: 150 }, // Ramp-up to 150 VUs (Severe Stress)
    { duration: '30s', target: 150 }, // Sustained peak load at 150 VUs
    { duration: '10s', target: 0 },   // Cool-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Less than 1% failure under extreme load
    http_req_duration: ['p(90)<1000'], // 90% requests completed within 1 sec
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080';

export default function () {
  const loginPayload = JSON.stringify({
    email: 'admin@metropolisparking.com',
    password: 'admin123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 1. Health Diagnostic Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health status is 200': (r) => r.status === 200 });

  // 2. Authentication Peak Load
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has auth token': (r) => r.json('token') !== null,
  });

  if (!loginSuccess) {
    return;
  }

  const token = loginRes.json('token');
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 3. High-Concurrency Resource Queries
  const lotsRes = http.get(`${BASE_URL}/parking-lots`, authParams);
  check(lotsRes, { 'lots status is 200': (r) => r.status === 200 });

  const spacesRes = http.get(`${BASE_URL}/spaces`, authParams);
  check(spacesRes, { 'spaces status is 200': (r) => r.status === 200 });

  const vehiclesRes = http.get(`${BASE_URL}/vehicles`, authParams);
  check(vehiclesRes, { 'vehicles status is 200': (r) => r.status === 200 });

  // 4. Aggregated Dashboard Analytics Stress
  const dashboardRes = http.get(`${BASE_URL}/dashboard`, authParams);
  check(dashboardRes, { 'dashboard status is 200': (r) => r.status === 200 });

  // 5. Payment Ledger Queries
  const paymentsRes = http.get(`${BASE_URL}/payments`, authParams);
  check(paymentsRes, { 'payments status is 200': (r) => r.status === 200 });

  sleep(0.05);
}
