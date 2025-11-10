# Grafana Dashboard Setup Guide

## 📊 Quick Start

This guide explains how to import and use the pre-built k6 dashboard in Grafana.

---

## Prerequisites

✅ InfluxDB v2 is running with k6 buckets  
✅ Grafana is running and accessible  
✅ InfluxDB datasource is configured in Grafana

---

## Step 1: Access Grafana

```bash
# Port-forward Grafana (if running in Kubernetes)
kubectl -n k6-tests port-forward service/grafana 3000:3000
```

Open browser: **http://localhost:3000**

**Login:**
- Username: `admin`
- Password: `admin123`

---

## Step 2: Verify InfluxDB Datasource

1. Go to **Configuration** → **Data Sources**
2. Find **InfluxDB-k6**
3. Click **Test** to verify connection
4. Should show: ✅ **"datasource is working"**

If not configured, add it manually:
- **Name**: `InfluxDB-k6`
- **Type**: InfluxDB
- **Query Language**: Flux
- **URL**: `http://influxdb.k6-tests.svc:8086` (or `http://localhost:8086`)
- **Organization**: `k6-org`
- **Token**: (get from secret: `kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d`)
- **Default Bucket**: `k6-metrics`

---

## Step 3: Import Dashboard

### Method 1: Import JSON File

1. Go to **Dashboards** → **Import**
2. Click **Upload JSON file**
3. Select `k6-dashboard-template.json` from this repository
4. Click **Load**
5. Select datasource: **InfluxDB-k6**
6. Click **Import**

### Method 2: Copy-Paste JSON

1. Open `k6-dashboard-template.json` in a text editor
2. Copy entire contents (Cmd+A, Cmd+C)
3. Go to **Dashboards** → **Import**
4. Paste JSON into the text area
5. Click **Load**
6. Select datasource: **InfluxDB-k6**
7. Click **Import**

---

## Step 4: Configure Dashboard

After import, you'll see the dashboard with these panels:

| Panel | Metric | Description |
|-------|--------|-------------|
| **Virtual Users** | `vus` | Active virtual users during test |
| **HTTP Requests/sec** | `http_reqs` | Request rate |
| **HTTP Request Duration** | `http_req_duration` | Average response time |
| **Test Iterations** | `iterations` | Completed test iterations |
| **Failed Requests** | `http_req_failed` | Number of failed requests |
| **Data Received** | `data_received` | Incoming data rate |

---

## Step 5: Select Bucket

At the top of the dashboard, you'll see a **Bucket** dropdown with options:
- `k6-metrics` (default)
- `team1-metrics`
- `team2-metrics`
- `team3-metrics`
- `team4-metrics`
- `team5-metrics`

Select the bucket you want to visualize.

---

## Step 6: Set Time Range

- **Top-right corner**: Click time picker
- **Default**: Last 15 minutes
- **Recommended for tests**: 
  - Last 30 minutes (for short tests)
  - Last 1 hour (for longer tests)
  - Custom range (for historical data)

---

## Step 7: Run a k6 Test

Now run a k6 test with InfluxDB output:

```bash
# Port-forward InfluxDB
kubectl -n k6-tests port-forward service/influxdb 8086:8086 &

# Get credentials
export TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)

# Set environment variables
export K6_INFLUXDB_ORGANIZATION=k6-org
export K6_INFLUXDB_BUCKET=k6-metrics
export K6_INFLUXDB_TOKEN=$TOKEN
export K6_INFLUXDB_ADDR=http://localhost:8086

# Run k6 test (requires custom k6 build with xk6-output-influxdb)
./k6 run -o xk6-influxdb your-test.js
```

---

## Step 8: Watch Metrics in Real-Time

1. Go back to Grafana dashboard
2. Enable **Auto-refresh**: Top-right, select **5s** or **10s**
3. Watch metrics update in real-time as your k6 test runs!

---

## 📖 Understanding the Dashboard

### Virtual Users (VUs)
Shows how many concurrent users are active. Should match your k6 script configuration.

### HTTP Requests per Second
Request throughput. Higher is better (if response times stay low).

### HTTP Request Duration
Response time in milliseconds. Lower is better.
- **Green zone**: < 500ms
- **Yellow zone**: 500-1000ms
- **Red zone**: > 1000ms

### Failed Requests
Should be **0** or very low. High values indicate errors.

---

## 🔧 Customization

### Add More Panels

1. Click **Add panel** (top-right)
2. Select **InfluxDB-k6** datasource
3. Write Flux query, for example:

```flux
from(bucket: "${bucket}")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "http_req_waiting")
  |> filter(fn: (r) => r._field == "value")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
```

4. Click **Apply**

### Available k6 Metrics

Common metrics you can visualize:

| Metric | Description |
|--------|-------------|
| `vus` | Virtual users |
| `vus_max` | Maximum virtual users |
| `iterations` | Completed iterations |
| `iteration_duration` | Time per iteration |
| `http_reqs` | HTTP requests count |
| `http_req_blocked` | Time blocked before request |
| `http_req_connecting` | Time connecting to host |
| `http_req_duration` | Total request time |
| `http_req_failed` | Failed request count |
| `http_req_receiving` | Time receiving response |
| `http_req_sending` | Time sending request |
| `http_req_tls_handshaking` | TLS handshake time |
| `http_req_waiting` | Time waiting for response |
| `data_received` | Data received (bytes) |
| `data_sent` | Data sent (bytes) |

---

## 🎯 Best Practices

### 1. Use Variables
The dashboard includes a `${bucket}` variable. You can add more:
- `${environment}` - for prod/staging
- `${region}` - for different regions
- `${test_id}` - for specific test runs

### 2. Set Alerts
Create alerts for critical metrics:
- Response time > 1000ms
- Failed requests > 1%
- Request rate drops below threshold

### 3. Save Dashboard
After customizing:
1. Click **Save dashboard** (top-right)
2. Add description
3. Click **Save**

### 4. Share Dashboard
- **Export**: Settings → JSON Model → Copy to clipboard
- **Snapshot**: Share → Snapshot → Create snapshot
- **Link**: Copy URL and share with team

---

## 🐛 Troubleshooting

### Dashboard shows "No data"

**Check 1**: Verify k6 is sending metrics
```bash
# Query InfluxDB directly
kubectl -n k6-tests port-forward service/influxdb 8086:8086 &

TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)

curl -X POST "http://localhost:8086/api/v2/query?org=k6-org" \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "k6-metrics") |> range(start: -1h) |> limit(n: 10)'
```

**Check 2**: Verify datasource UID
1. Go to **Configuration** → **Data Sources** → **InfluxDB-k6**
2. Note the **UID** in URL: `/datasources/edit/<UID>`
3. Edit dashboard JSON and update `"uid": "<UID>"` in all panels

**Check 3**: Verify bucket name
- Make sure selected bucket matches your k6 test configuration
- Check if bucket exists in InfluxDB

**Check 4**: Check time range
- Extend time range to "Last 6 hours" or "Last 24 hours"
- Your test data might be older than current range

### Queries return errors

**Error: "bucket not found"**
- Check bucket name spelling
- Verify bucket exists: `kubectl -n k6-tests exec -it <influxdb-pod> -- influx bucket list`

**Error: "unauthorized"**
- Regenerate datasource token
- Update token in datasource configuration

---

## 📚 Additional Resources

- [k6 Documentation](https://grafana.com/docs/k6/latest/)
- [InfluxDB v2 Documentation](https://docs.influxdata.com/influxdb/v2.7/)
- [Flux Query Language](https://docs.influxdata.com/influxdb/v2.7/query-data/get-started/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/)

---

## 🎉 You're All Set!

Your k6 monitoring dashboard is now ready to use. Run k6 tests and watch metrics in real-time!

**Happy Load Testing!** 🚀

