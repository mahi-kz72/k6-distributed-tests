# k6 Load Test Launcher

A clean, professional web UI for launching k6 load tests without writing k6 code.

## Features

- **Simple UI**: Enter API endpoint and configure load profile
- **No Code Required**: Users don't need to write or upload k6 scripts
- **Automatic Execution**: Tests run in the background via Docker
- **Grafana Integration**: Direct links to view results in Grafana dashboard
- **Load Profile Controls**:
  - Ramp-up duration and VUs
  - Steady-state duration (with optional VU override)
  - Ramp-down duration

## Architecture

- **Frontend**: Next.js 14 with React
- **Backend**: Next.js API routes
- **k6 Execution**: Docker containers using the `perf/k6-runner` image
- **Metrics**: Results automatically sent to InfluxDB2
- **Visualization**: Results appear in existing Grafana dashboard

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- k6 runner image built: `docker build -t perf/k6-runner:local ./k6-runner`

### Setup

1. **Install dependencies:**
   ```bash
   cd launcher
   npm install
   ```

2. **Set environment variables:**
   Create a `.env.local` file:
   ```env
   K6_INFLUXDB_ADDR=http://localhost:8086
   K6_INFLUXDB_ORG=perf-org
   K6_INFLUXDB_BUCKET=k6
   K6_INFLUXDB_TOKEN=your_influxdb_token_here
   GRAFANA_URL=http://localhost:3000
   K6_RUNNER_IMAGE=perf/k6-runner:local
   K6_WORK_DIR=/tmp/k6-tests
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the UI:**
   Open http://localhost:3001

## Docker Compose Integration

The launcher is included in `infra/docker-compose.local.yml`. To start everything:

```bash
docker compose -f infra/docker-compose.local.yml up -d
```

The launcher will be available at http://localhost:3001

## Usage

1. Enter the target API endpoint URL
2. Configure the load profile:
   - **Ramp-up Duration**: Time to reach target VUs (e.g., "30s", "1m", "2m30s")
   - **Target VUs (Ramp-up)**: Number of virtual users to reach
   - **Steady-state Duration**: How long to maintain the load
   - **VUs During Steady State** (optional): Override VU count for steady state
   - **Ramp-down Duration**: Time to reduce VUs to zero
3. Click "Run Load Test"
4. View the Grafana link to see results in real-time

## Generated k6 Script

The launcher automatically generates a k6 script with:
- Stages configuration based on your inputs
- HTTP GET request to the specified API endpoint
- Proper tagging for Grafana filtering
- Basic thresholds for performance monitoring

## Environment Variables

- `K6_INFLUXDB_ADDR`: InfluxDB address (default: http://localhost:8086)
- `K6_INFLUXDB_ORG`: InfluxDB organization (default: perf-org)
- `K6_INFLUXDB_BUCKET`: InfluxDB bucket (default: k6)
- `K6_INFLUXDB_TOKEN`: InfluxDB write token (required)
- `GRAFANA_URL`: Grafana URL for result links (default: http://localhost:3000)
- `K6_RUNNER_IMAGE`: Docker image for k6 runner (default: perf/k6-runner:local)
- `K6_WORK_DIR`: Directory for temporary k6 scripts (default: /tmp/k6-tests)

