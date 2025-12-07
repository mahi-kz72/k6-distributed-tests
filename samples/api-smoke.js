import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    //http_req_failed: ["rate<0.1"],
    http_req_duration: ["p(95)<800"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://test-api.k6.io";

export default function () {
  // API #1
  let res1 = http.get(`${BASE_URL}/public/crocodiles/1/`, {
    tags: { api: "get_crocodile_1" },
  });
  check(res1, {
    "api1 status 200": (r) => r.status === 200,
  });

  // API #2
  let res2 = http.get(`${BASE_URL}/public/crocodiles/2/`, {
    tags: { api: "get_crocodile_2" },
  });
  check(res2, {
    "api2 status 200": (r) => r.status === 200,
  });

  // API #3
  let res3 = http.get(`${BASE_URL}/public/crocodiles/3/`, {
    tags: { api: "get_crocodile_3" },
  });
  check(res3, {
    "api3 status 200": (r) => r.status === 200,
  });

  sleep(1);
}
