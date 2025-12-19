# k6 Observability Platform (k6 → InfluxDB v2 → Grafana)

Central, reusable observability stack for k6 performance tests.

Teams **only run k6** in their own repos. They do **not** deploy Grafana/InfluxDB or maintain dashboards.  
All results flow into a shared InfluxDB bucket and are visualized in Grafana with a standard dashboard.

---

## Architecture

1. **Grafana** (persistent, always‑on)  
2. **InfluxDB v2** (persistent, always‑on; stores k6 metrics)
3. **k6 Runner Image**  
   Custom k6 built with `xk6-output-influxdb` so CI jobs can stream results to InfluxDB.
4. **Grafana template dashboard**  
   Variables:
   - `script` (k6 script name)
   - `api` (per‑request tag)

k6 jobs are ephemeral; Grafana/InfluxDB remain up for browsing history.

---

## Repo Layout

```
.
├─ infra/
│  ├─ docker-compose.local.yml     # local InfluxDB + Grafana
│  └─ helm/                        # k8s deployment
├─ grafana/
│  ├─ provisioning/                # datasource + dashboard provider
│  └─ dashboards/
│     └─ k6-template-influxdb2.json
├─ k6-runner/
│  ├─ Dockerfile                   # builds k6 with influxdb v2 output
│  └─ entrypoint.sh                # runs k6 with script-level tags
├─ ci/
│  ├─ gitlab/k6-run.yml            # reusable GitLab template
│  └─ github/k6-run.yml            # reusable GitHub workflow
├─ launcher/                       # Web UI for launching k6 tests
│  └─ frontend/                    # Next.js application
└─ samples/
   ├─ api-smoke.js                 # 3 API sample
   └─ api-load.js                  # 2 API sample
```

---

## Local Run (Mac / Linux)

### 1) Start Grafana + InfluxDB
From repo root:

```bash
docker compose -f infra/docker-compose.local.yml up -d
```

Services:
- InfluxDB: http://localhost:8086  
- Grafana:  http://localhost:3000  (admin / admin)

### 2) Create an InfluxDB write token
1. Open InfluxDB UI → http://localhost:8086  
2. Login:
   - user: `admin`
   - pass: `adminadmin`
3. **Load Data → API Tokens → Generate**
4. Create token with **Write** access to bucket `k6`
5. Copy token.

### 3) Put token into Grafana container
Edit `infra/docker-compose.local.yml`:

```yaml
grafana:
  environment:
    INFLUXDB_TOKEN: "PASTE_REAL_TOKEN_HERE"
```

Restart Grafana:

```bash
docker compose -f infra/docker-compose.local.yml restart grafana
```

### 4) Build the k6 runner image
```bash
docker build -t perf/k6-runner:local ./k6-runner
```

### 5) Run sample tests through runner

**Smoke test (3 APIs):**
```bash
docker run --rm   -e K6_SCRIPT=/work/samples/api-smoke.js   -e K6_SCRIPT_NAME=api-smoke   -e K6_TEAM=local   -e K6_INFLUXDB_ADDR=http://host.docker.internal:8086   -e K6_INFLUXDB_ORG=perf-org   -e K6_INFLUXDB_BUCKET=k6   -e K6_INFLUXDB_TOKEN="PASTE_REAL_TOKEN_HERE"   -v "$PWD:/work"   perf/k6-runner:local
```

**Load test (2 APIs):**
```bash
docker run --rm   -e K6_SCRIPT=/work/samples/api-load.js   -e K6_SCRIPT_NAME=api-load   -e K6_TEAM=local   -e K6_INFLUXDB_ADDR=http://host.docker.internal:8086   -e K6_INFLUXDB_ORG=perf-org   -e K6_INFLUXDB_BUCKET=k6   -e K6_INFLUXDB_TOKEN="PASTE_REAL_TOKEN_HERE"   -v "$PWD:/work"   perf/k6-runner:local
```

### 6) View results in Grafana
1. Open Grafana → http://localhost:3000
2. Dashboards → Browse → **k6 - Template (InfluxDB2)**
3. Select:
   - `script`: `api-smoke` or `api-load`
   - `api`: pick specific endpoint or `All`

---

## Web UI Launcher (Optional)

A clean web interface for launching k6 tests without writing code.

### Quick Start

1. **Set the InfluxDB token in docker-compose:**
   ```bash
   # Edit infra/docker-compose.local.yml and set K6_INFLUXDB_TOKEN
   ```

2. **Start all services (including launcher):**
   ```bash
   docker compose -f infra/docker-compose.local.yml up -d
   ```

3. **Access the launcher UI:**
   - Open http://localhost:3001
   - Enter your API endpoint and configure load profile
   - Click "Run Load Test"
   - View results via the Grafana link

### Local Development (Launcher)

For local development of the launcher:

```bash
cd launcher
npm install
# Create .env.local with your InfluxDB token
npm run dev
```

See `launcher/README.md` for detailed documentation.

---

## How teams write k6 scripts (important)

Each HTTP call should include an `api` tag so the API dropdown works.

Example:

```js
http.get(`${BASE_URL}/users`, {
  tags: { api: "list_users" }
});
```

Runner adds test‑wide tags:
- `script=<K6_SCRIPT_NAME>`
- `team=<K6_TEAM>`
- `testid=<CI id or local>`

---
