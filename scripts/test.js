import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1000ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Test targets (override via env: K6_WEB_BASE_URL, K6_API_BASE_URL, K6_API_PATH)
const WEB_BASE_URL = __ENV.K6_WEB_BASE_URL || 'https://testnet.nobitex.ir';
const API_BASE_URL = __ENV.K6_API_BASE_URL || 'https://testnetapiv2.nobitex.ir';
const API_PATH = __ENV.K6_API_PATH || '/';

export default function () {
  // Test 1: GET landing page (HTML)
  const response1 = http.get(`${WEB_BASE_URL}/`);
  check(response1, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(response1.status !== 200);

  sleep(1);

  // Test 2: GET API base (JSON or any response)
  const response2 = http.get(`${API_BASE_URL}${API_PATH}`);
  check(response2, {
    'API status is 200': (r) => r.status === 200,
    'API response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(response2.status !== 200);

  sleep(1);

  // Optional small pause
  sleep(1);
}

export function handleSummary(data) {
  return {
    '/results/summary.json': JSON.stringify(data, null, 2),
  };
}
