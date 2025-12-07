import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const loginTrend = new Trend("login_duration");

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "30s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    //http_req_failed: ["rate<0.2"],
    http_req_duration: ["p(95)<1200"],
    login_duration: ["p(95)<1500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://test-api.k6.io";
const USER = __ENV.USER || "test";
const PASS = __ENV.PASS || "1234";

export default function () {
  // API #1 (login)
  const loginPayload = JSON.stringify({ username: USER, password: PASS });
  const loginRes = http.post(
    `${BASE_URL}/auth/token/login/`,
    loginPayload,
    {
      headers: { "Content-Type": "application/json" },
      tags: { api: "login" },
    }
  );

  loginTrend.add(loginRes.timings.duration);

  check(loginRes, {
    "login ok": (r) => r.status === 200 || r.status === 201,
    "has token": (r) => !!r.json("access"),
  });

  const token = loginRes.json("access");
  if (!token) {
    sleep(1);
    return;
  }

  // API #2 (list crocodiles)
  const listRes = http.get(
    `${BASE_URL}/my/crocodiles/`,
    { headers: { Authorization: `Bearer ${token}` },
      tags: { api: "list_crocodiles" }
    }
  );

  check(listRes, {
    "list ok": (r) => r.status === 200,
  });

  sleep(1);
}
