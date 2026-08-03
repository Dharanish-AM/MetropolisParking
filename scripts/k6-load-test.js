import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';

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

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has auth token': (r) => r.json('token') !== null,
  });

  const token = loginRes.json('token');
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health status is 200': (r) => r.status === 200 });

  const lotsRes = http.get(`${BASE_URL}/parking-lots`, authParams);
  check(lotsRes, { 'lots status is 200': (r) => r.status === 200 });

  const dashboardRes = http.get(`${BASE_URL}/dashboard`, authParams);
  check(dashboardRes, { 'dashboard status is 200': (r) => r.status === 200 });

  sleep(0.1);
}
