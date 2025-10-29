import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration for more intensive load
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    response_time: ['p(95)<800'],
  },
};

// Test targets (override via env)
const WEB_BASE_URL = __ENV.K6_WEB_BASE_URL || 'https://testnet.nobitex.ir';
const API_BASE_URL = __ENV.K6_API_BASE_URL || 'https://testnetapiv2.nobitex.ir';
const API_PATHS = (__ENV.K6_API_PATHS || '/,/market/stats').split(',');

export default function () {
  // Alternate between web landing and API paths
  const useApi = Math.random() < 0.7; // 70% API traffic
  const endpoint = useApi ? API_PATHS[Math.floor(Math.random() * API_PATHS.length)] : '/';
  const base = useApi ? API_BASE_URL : WEB_BASE_URL;
  const url = `${base}${endpoint}`;
  
  let response;
  const startTime = Date.now();
  
  response = http.get(url);
  
  const duration = Date.now() - startTime;
  responseTime.add(duration);
  
  check(response, {
    [`GET ${endpoint} is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`GET ${endpoint} < 2000ms`]: (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(response.status < 200 || response.status >= 400);
  
  // Random sleep between 0.5 and 2 seconds
  sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
  return {
    '/results/advanced-summary.json': JSON.stringify(data, null, 2),
  };
}
