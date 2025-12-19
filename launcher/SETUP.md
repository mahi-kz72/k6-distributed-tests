# Setup Guide

## Setting Up InfluxDB Token

If you see the error: **"K6_INFLUXDB_TOKEN environment variable is not set"**, follow these steps:

### Option 1: Local Development (Recommended)

1. **Get your InfluxDB token:**
   - Open InfluxDB UI: http://localhost:8086
   - Login with:
     - Username: `admin`
     - Password: `adminadmin`
   - Go to **Load Data → API Tokens**
   - Click **Generate API Token**
   - Select **Write** access for bucket `k6`
   - Copy the token

2. **Create `.env.local` file in the launcher directory:**
   ```bash
   cd launcher
   touch .env.local
   ```

3. **Add the token to `.env.local`:**
   ```env
   K6_INFLUXDB_TOKEN=your_token_here
   K6_INFLUXDB_ADDR=http://localhost:8086
   K6_INFLUXDB_ORG=perf-org
   K6_INFLUXDB_BUCKET=k6
   GRAFANA_URL=http://localhost:3000
   K6_RUNNER_IMAGE=perf/k6-runner:local
   K6_WORK_DIR=/tmp/k6-tests
   ```

4. **Restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C) and restart
   npm run dev
   ```

### Option 2: Docker Compose

1. **Get your InfluxDB token** (same as above)

2. **Set environment variable before starting:**
   ```bash
   export K6_INFLUXDB_TOKEN=your_token_here
   docker compose -f infra/docker-compose.local.yml up -d
   ```

   Or edit `infra/docker-compose.local.yml` and replace:
   ```yaml
   K6_INFLUXDB_TOKEN: ${K6_INFLUXDB_TOKEN:-}
   ```
   with:
   ```yaml
   K6_INFLUXDB_TOKEN: "your_token_here"
   ```

## Verifying Setup

After setting up the token, try running a test. The error should be gone and tests should start successfully.

