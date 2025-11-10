// Simple k6 test for verification
// This test is ONLY for testing the monitoring stack
// It will be deleted before git push

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '10s',
  
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  // Simple HTTP request to test endpoint
  const res = http.get('https://httpbin.org/get');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}

