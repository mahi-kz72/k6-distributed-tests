# Running External k6 Tests Against This Monitoring Stack

This document explains how to run k6 load tests from **outside this repository** and send metrics to the InfluxDB v2 + Grafana monitoring stack deployed in Kubernetes.

## 🎯 Overview

This repository provides an always-on monitoring stack consisting of:
- **InfluxDB v2**: Time-series database for storing k6 metrics
- **Grafana**: Pre-configured dashboards for visualizing test results
- **5 Team Dashboards**: Separate dashboards for different teams/reports

**Important**: This repository does NOT contain k6 test scripts. You run your own tests from your local machine, CI/CD pipeline, or any other location, and they send metrics to this centralized stack.

## 📋 Prerequisites

1. **k6 installed** on your local machine or CI/CD runner
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Docker
   docker pull grafana/k6:latest
   ```

2. **Access to InfluxDB** endpoint (URL and token)
3. **Network connectivity** to the InfluxDB Ingress endpoint

## 🔐 Getting Credentials

### 1. Get InfluxDB Token

The InfluxDB admin token is stored in Kubernetes Secret. Retrieve it:

```bash
# Get the admin token
kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d
```

**Store this token securely!** You'll need it for all k6 runs.

### 2. Get InfluxDB URL

The InfluxDB endpoint is exposed via Ingress:

```bash
# Get Ingress hostname
kubectl -n k6-tests get ingress influxdb-ingress -o jsonpath='{.spec.rules[0].host}'
```

Default: `https://influxdb.example.com` (update in `k8s/outputs/influxdb-deployment.yaml`)

### 3. Available Buckets

The following buckets are pre-configured:
- `k6-metrics` (default bucket)
- `team1-metrics`
- `team2-metrics`
- `team3-metrics`
- `team4-metrics`
- `team5-metrics`

Each bucket has a corresponding Grafana dashboard.

## 🚀 Running k6 Tests

### Method 1: Environment Variables (Recommended)

Set environment variables and run your test:

```bash
# Export configuration
export K6_OUT="influxdb_v2=url=https://influxdb.example.com,token=k6-super-secret-admin-token-change-me,organization=k6-org,bucket=k6-metrics"

# Run your test
k6 run /path/to/your/test.js
```

### Method 2: Command Line Arguments

Pass configuration directly in the command:

```bash
k6 run \
  --out influxdb_v2=url=https://influxdb.example.com,token=k6-super-secret-admin-token-change-me,organization=k6-org,bucket=k6-metrics \
  /path/to/your/test.js
```

### Method 3: Using Different Buckets (Team-Specific)

Send metrics to a specific team bucket:

```bash
# Team 1
export K6_OUT="influxdb_v2=url=https://influxdb.example.com,token=k6-super-secret-admin-token-change-me,organization=k6-org,bucket=team1-metrics"
k6 run /path/to/your/test.js

# Team 2
export K6_OUT="influxdb_v2=url=https://influxdb.example.com,token=k6-super-secret-admin-token-change-me,organization=k6-org,bucket=team2-metrics"
k6 run /path/to/your/test.js
```

### Method 4: Docker

Run k6 tests using Docker:

```bash
docker run --rm -i \
  -e K6_OUT="influxdb_v2=url=https://influxdb.example.com,token=k6-super-secret-admin-token-change-me,organization=k6-org,bucket=k6-metrics" \
  -v $(pwd):/scripts \
  grafana/k6:latest run /scripts/your-test.js
```

### Method 5: CI/CD Pipeline (GitHub Actions Example)

```yaml
name: k6 Load Test

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1

      - name: Run k6 test
        env:
          K6_OUT: "influxdb_v2=url=${{ secrets.INFLUXDB_URL }},token=${{ secrets.INFLUXDB_TOKEN }},organization=k6-org,bucket=team1-metrics"
        run: |
          ./k6 run tests/load-test.js
```

**Required GitHub Secrets:**
- `INFLUXDB_URL`: `https://influxdb.example.com`
- `INFLUXDB_TOKEN`: Your InfluxDB admin token

## 📊 Viewing Results in Grafana

### 1. Access Grafana

Port-forward to access Grafana:

```bash
kubectl -n k6-tests port-forward service/grafana 3000:3000
```

Then open: http://localhost:3000

**Default credentials:**
- Username: `admin`
- Password: `admin123`

### 2. Available Dashboards

Navigate to **Dashboards** → **k6 Load Testing** folder:

- **Team 1 - k6 Performance Metrics** (bucket: `team1-metrics`)
- **Team 2 - k6 Performance Metrics** (bucket: `team2-metrics`)
- **Team 3 - k6 Performance Metrics** (bucket: `team3-metrics`)
- **Team 4 - k6 Performance Metrics** (bucket: `team4-metrics`)
- **Team 5 - k6 Performance Metrics** (bucket: `team5-metrics`)

### 3. Dashboard Metrics

Each dashboard shows:
- **HTTP Requests Per Second**: Total request rate
- **Response Time (p95)**: 95th percentile response time
- **Virtual Users**: Number of concurrent users
- **Error Rate**: Percentage of failed requests

### 4. Time Ranges

Default: Last 6 hours

Adjust the time range using the time picker in the top-right corner:
- Last 15 minutes
- Last 1 hour
- Last 6 hours (default)
- Last 24 hours
- Last 7 days
- Custom range

### 5. Real-time Monitoring

Dashboards refresh every 10 seconds automatically. You can:
- Click the **refresh** button to manually refresh
- Adjust auto-refresh interval (top-right dropdown)
- Enable/disable auto-refresh

## 📝 Example k6 Test Script

Here's a simple example test that works with this stack:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be below 5%
  },
};

export default function () {
  const res = http.get('https://test.k6.io');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

Save as `my-test.js` and run:

```bash
export K6_OUT="influxdb_v2=url=https://influxdb.example.com,token=YOUR_TOKEN,organization=k6-org,bucket=team1-metrics"
k6 run my-test.js
```

## 🔍 Verifying Data Flow

### 1. Check if metrics are being received

Query InfluxDB directly:

```bash
# Port-forward to InfluxDB
kubectl -n k6-tests port-forward service/influxdb 8086:8086

# Query using InfluxDB CLI or API
curl -X POST "http://localhost:8086/api/v2/query?org=k6-org" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "k6-metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "http_reqs")
  |> count()'
```

### 2. Check Grafana datasource

1. Go to **Configuration** → **Data Sources**
2. Click on **InfluxDB-k6**
3. Click **Test** button
4. Should show: "Data source is working"

### 3. Verify bucket creation

List all buckets:

```bash
kubectl -n k6-tests exec -it deployment/influxdb -- \
  influx bucket list --org k6-org --token YOUR_TOKEN
```

Expected output should include: `k6-metrics`, `team1-metrics`, etc.

## 🐛 Troubleshooting

### Issue: Connection refused

**Cause**: InfluxDB Ingress not accessible

**Solution**:
1. Verify Ingress is deployed:
   ```bash
   kubectl -n k6-tests get ingress influxdb-ingress
   ```
2. Check Ingress controller is running
3. Verify DNS resolves to your cluster
4. Test local connectivity:
   ```bash
   kubectl -n k6-tests port-forward service/influxdb 8086:8086
   # Use http://localhost:8086 in k6 config
   ```

### Issue: Authentication failed

**Cause**: Invalid token

**Solution**:
1. Verify token:
   ```bash
   kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d
   ```
2. Ensure token matches in k6 command
3. Check token has not been changed in the Secret

### Issue: No data in Grafana

**Cause**: Metrics not reaching InfluxDB or wrong bucket

**Solution**:
1. Verify k6 output shows successful writes:
   ```
   INFO[0001] output: InfluxDB v2 output                   
   ```
2. Check bucket name matches dashboard
3. Verify time range in Grafana (try "Last 24 hours")
4. Check InfluxDB logs:
   ```bash
   kubectl -n k6-tests logs deployment/influxdb
   ```

### Issue: TLS certificate errors

**Cause**: Self-signed certificate or cert-manager not configured

**Solution**:
1. For testing, disable TLS verification in k6:
   ```javascript
   export const options = {
     insecureSkipTLSVerify: true,
   };
   ```
2. For production, configure cert-manager:
   - Uncomment cert-manager annotations in Ingress
   - Ensure cert-manager is installed in cluster

### Issue: Slow dashboard loading

**Cause**: Too much data or inefficient queries

**Solution**:
1. Reduce time range (e.g., last 1 hour instead of 7 days)
2. Increase dashboard refresh interval
3. Implement data retention policies in InfluxDB:
   ```bash
   influx bucket update \
     --name team1-metrics \
     --retention 30d \
     --org k6-org \
     --token YOUR_TOKEN
   ```

## 🔒 Security Best Practices

### 1. Secure Token Storage

**DO NOT** commit tokens to version control!

- Use environment variables
- Use CI/CD secrets
- Use secret management tools (HashiCorp Vault, AWS Secrets Manager)

### 2. Token Rotation

Regularly rotate InfluxDB tokens:

```bash
# Create a new token with limited scope
kubectl -n k6-tests exec -it deployment/influxdb -- \
  influx auth create \
  --org k6-org \
  --write-bucket team1-metrics \
  --description "Team 1 k6 runner" \
  --token YOUR_ADMIN_TOKEN
```

### 3. Network Policies

Restrict access to InfluxDB:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: influxdb-ingress-only
  namespace: k6-tests
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: influxdb
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8086
```

### 4. TLS Configuration

Enable TLS for production:

1. Install cert-manager
2. Create ClusterIssuer
3. Uncomment TLS annotations in Ingress
4. Update Ingress host to your actual domain

## 📈 Advanced Configuration

### Custom Tags

Add custom tags to your k6 tests for better filtering:

```javascript
export const options = {
  tags: {
    environment: 'production',
    team: 'backend',
    service: 'api-gateway',
  },
};
```

### Multiple Outputs

Send metrics to multiple destinations:

```bash
k6 run \
  --out influxdb_v2=url=https://influxdb.example.com,token=TOKEN,organization=k6-org,bucket=k6-metrics \
  --out json=results.json \
  your-test.js
```

### Distributed Testing

Run k6 tests from multiple locations:

```bash
# Location 1: US East
K6_OUT="influxdb_v2=url=...,tags=location=us-east" k6 run test.js

# Location 2: EU West  
K6_OUT="influxdb_v2=url=...,tags=location=eu-west" k6 run test.js
```

Then filter by location in Grafana dashboards.

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 InfluxDB Output](https://k6.io/docs/results-output/real-time/influxdb/)
- [InfluxDB v2 Documentation](https://docs.influxdata.com/influxdb/v2/)
- [Grafana Documentation](https://grafana.com/docs/)
- [k6 Examples](https://github.com/grafana/k6-examples)

## 🤝 Support

For issues with:
- **This monitoring stack**: Check logs and verify configuration
- **k6 test scripts**: Refer to k6 documentation
- **Kubernetes deployment**: Check cluster resources and events

```bash
# Check pod status
kubectl -n k6-tests get pods

# Check logs
kubectl -n k6-tests logs deployment/influxdb
kubectl -n k6-tests logs deployment/grafana

# Check events
kubectl -n k6-tests get events --sort-by='.lastTimestamp'
```

