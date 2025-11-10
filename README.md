# k6 Monitoring Stack: InfluxDB v2 + Grafana

**Always-on monitoring infrastructure for collecting and visualizing k6 load testing metrics from external runners.**

> ⚠️ **Important**: This repository contains **ONLY the monitoring infrastructure**.  
> k6 test scripts should be run externally and send metrics to this centralized stack.

---

## 🏗️ Architecture

```
External k6 Runners → InfluxDB v2 (Storage) → Grafana (Dashboards)
```

**Components:**
- **InfluxDB v2** (2.7): Time-series database with persistent storage (10Gi PVC)
- **Grafana** (latest): Visualization platform with 5 pre-configured dashboards (5Gi PVC)
- **6 Buckets**: `k6-metrics` (default) + 5 team-specific buckets

---

## 🚀 Quick Deployment

### Option 1: Automated Setup (Recommended) ⚡

Run the complete setup script that deploys everything and configures Grafana automatically:

```bash
./setup-complete-stack.sh
```

This script will:
- ✅ Deploy InfluxDB + Grafana to Kubernetes
- ✅ Wait for pods to be ready
- ✅ Set up port-forwards (InfluxDB:8086, Grafana:3000)
- ✅ Configure InfluxDB datasource in Grafana
- ✅ Import pre-built k6 dashboard automatically
- ✅ Display all credentials and next steps

**After setup completes:**
1. Open http://localhost:3000 (admin/admin123)
2. Navigate to **Dashboards** → **k6 Load Testing Dashboard**
3. Run your k6 tests and watch metrics in real-time!

### Option 2: Manual Setup

#### 1. Deploy the Stack

```bash
# Deploy everything
kubectl apply -k k8s/

# Verify pods are running
kubectl -n k6-tests get pods
```

Expected output:
```
NAME                        READY   STATUS    RESTARTS   AGE
influxdb-xxxxx              1/1     Running   0          1m
grafana-xxxxx               1/1     Running   0          1m
```

#### 2. Get Credentials

```bash
# Get InfluxDB token
kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d
```

**Save this token!** External k6 runners need it.

### 3. Access Grafana

```bash
# Port-forward to Grafana
kubectl -n k6-tests port-forward service/grafana 3000:3000

# Open in browser
open http://localhost:3000
```

**Default credentials:**
- Username: `admin`
- Password: `admin123` (⚠️ change in production!)

---

## 📊 Running External k6 Tests

### From Local Machine

```bash
# 1. Get token
export INFLUX_TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)

# 2. Port-forward InfluxDB (for local testing)
kubectl -n k6-tests port-forward service/influxdb 8086:8086 &

# 3. Run k6 test
export K6_OUT="influxdb_v2=url=http://localhost:8086,token=$INFLUX_TOKEN,organization=k6-org,bucket=k6-metrics"
k6 run your-test.js
```

### Team-Specific Buckets

```bash
# Team 1
export K6_OUT="influxdb_v2=url=http://localhost:8086,token=$TOKEN,organization=k6-org,bucket=team1-metrics"
k6 run test.js

# Team 2
export K6_OUT="influxdb_v2=url=http://localhost:8086,token=$TOKEN,organization=k6-org,bucket=team2-metrics"
k6 run test.js
```

### From CI/CD (GitHub Actions Example)

```yaml
name: Load Test
on: [workflow_dispatch]

jobs:
  k6-test:
    runs-on: ubuntu-latest
    steps:
      - name: Run k6
        uses: grafana/k6-action@v0.3.1
        with:
          filename: test.js
        env:
          K6_OUT: influxdb_v2=url=${{ secrets.INFLUX_URL }},token=${{ secrets.INFLUX_TOKEN }},organization=k6-org,bucket=team1-metrics
```

**Required GitHub Secrets:**
- `INFLUX_URL`: InfluxDB endpoint
- `INFLUX_TOKEN`: InfluxDB admin token

---

## 📈 Available Dashboards

Navigate to: **Dashboards → k6 Load Testing**

| Dashboard | Bucket | Metrics Displayed |
|-----------|--------|-------------------|
| Team 1 - k6 Performance Metrics | `team1-metrics` | HTTP RPS, Response Time (p95), VUs, Error Rate |
| Team 2 - k6 Performance Metrics | `team2-metrics` | HTTP RPS, Response Time (p95), VUs, Error Rate |
| Team 3 - k6 Performance Metrics | `team3-metrics` | HTTP RPS, Response Time (p95), VUs, Error Rate |
| Team 4 - k6 Performance Metrics | `team4-metrics` | HTTP RPS, Response Time (p95), VUs, Error Rate |
| Team 5 - k6 Performance Metrics | `team5-metrics` | HTTP RPS, Response Time (p95), VUs, Error Rate |

**Default bucket**: `k6-metrics` (can be viewed in any dashboard)

---

## 🔧 Configuration

### Change Default Credentials

```bash
# InfluxDB token
kubectl -n k6-tests edit secret influxdb-auth

# Grafana password
kubectl -n k6-tests set env deployment/grafana GF_SECURITY_ADMIN_PASSWORD=new-password
```

### Enable External Access (Optional)

Uncomment the Ingress section in `k8s/outputs/influxdb-deployment.yaml`:

```yaml
# Change domain from influxdb.example.com to your domain
# Enable TLS with cert-manager if needed
```

### Storage Configuration

**Default:** PersistentVolumeClaim
- InfluxDB: 10Gi
- Grafana: 5Gi

Update storage size in deployment files if needed.

---

## 🛠️ Management Commands

```bash
# Check pod status
kubectl -n k6-tests get pods,pvc,svc

# View InfluxDB logs
kubectl -n k6-tests logs deployment/influxdb

# View Grafana logs
kubectl -n k6-tests logs deployment/grafana

# Delete stack (keeps namespace)
kubectl delete -k k8s/

# Delete everything including data
kubectl delete namespace k6-tests
```

---

## 🔍 Verify Data Flow

### 1. Check InfluxDB Data

```bash
kubectl -n k6-tests port-forward service/influxdb 8086:8086

# List buckets
kubectl -n k6-tests exec deployment/influxdb -- \
  influx bucket list --org k6-org

# Query recent data
kubectl -n k6-tests exec deployment/influxdb -- \
  influx query 'from(bucket:"k6-metrics") |> range(start:-1h) |> limit(n:10)' --org k6-org
```

### 2. Verify Grafana Datasource

1. Login to Grafana (http://localhost:3000)
2. **Configuration** → **Data Sources** → **InfluxDB-k6**
3. Click **Test** button
4. Should show: "Data source is working" ✅

---

## 🔒 Security Checklist

Before production deployment:

- [ ] Change InfluxDB admin token in Secret
- [ ] Change Grafana admin password
- [ ] Configure Ingress with your domain
- [ ] Enable TLS/HTTPS with cert-manager
- [ ] Create limited-scope tokens for teams
- [ ] Implement NetworkPolicy for access control
- [ ] Set up data retention policies
- [ ] Configure regular backups

---

## 📚 Documentation

- **[EXTERNAL-RUN.md](EXTERNAL-RUN.md)**: Complete guide for external k6 runners with examples
- **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)**: What changed and deployment details
- **[VERIFICATION-CHECKLIST.md](VERIFICATION-CHECKLIST.md)**: Step-by-step verification guide
- **[k8s/outputs/README.md](k8s/outputs/README.md)**: Detailed configuration reference

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
kubectl -n k6-tests describe pod <pod-name>
kubectl -n k6-tests get events --sort-by='.lastTimestamp'
```

### No Data in Grafana

1. Check time range (use "Last 1 hour")
2. Verify InfluxDB has data:
   ```bash
   kubectl -n k6-tests exec deployment/influxdb -- \
     influx query 'from(bucket:"k6-metrics") |> range(start:-24h) |> count()' --org k6-org
   ```
3. Test datasource connection in Grafana

### Authentication Errors

```bash
# Verify token
kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d

# Ensure token matches in k6 command
```

---

## 📦 Project Structure

```
k6/
├── k8s/
│   ├── namespace.yaml              # k6-tests namespace
│   ├── kustomization.yaml          # Main deployment config
│   └── outputs/
│       ├── influxdb-deployment.yaml # InfluxDB v2 + PVC + Ingress
│       ├── grafana-deployment.yaml  # Grafana + 5 dashboards + PVC
│       └── README.md               # Configuration details
├── scripts/                        # Utility scripts
│   ├── setup-full-stack.sh        # Automated setup
│   ├── export-results.sh          # Export results
│   └── ...
├── EXTERNAL-RUN.md                 # External runner guide
├── DEPLOYMENT-SUMMARY.md           # Deployment details
├── VERIFICATION-CHECKLIST.md       # Verification steps
└── README.md                       # This file
```

---

## ✅ Features

- ✅ **Persistent Storage**: PVCs for both InfluxDB and Grafana
- ✅ **Multi-Tenant**: 6 separate buckets for team isolation
- ✅ **Pre-Configured**: 5 ready-to-use Grafana dashboards
- ✅ **Secure**: Token-based authentication, Kubernetes Secrets
- ✅ **Scalable**: Kubernetes-native resource management
- ✅ **Production-Ready**: Health checks, resource limits, persistent data

---

## 🎯 Use Cases

Perfect for:
- Centralized k6 metrics collection across teams
- Long-term performance trend analysis
- CI/CD integration for automated testing
- Multi-team load testing with separate dashboards
- Historical data retention and compliance

---

## 📝 Notes

- **No test scripts included** - This is infrastructure only
- **External runners** send metrics via InfluxDB v2 output
- **Data persistence** via PersistentVolumeClaims
- **Auto-provisioned** dashboards on Grafana startup
- **Token-based auth** only (no username/password for InfluxDB)

---

## 🆘 Support

For issues:
1. Check [EXTERNAL-RUN.md](EXTERNAL-RUN.md) for common questions
2. Review [VERIFICATION-CHECKLIST.md](VERIFICATION-CHECKLIST.md) for validation
3. Check logs: `kubectl -n k6-tests logs deployment/<component>`
4. Verify resources: `kubectl -n k6-tests get all`

---

**Made for DevOps Teams** | **Production-Ready** | **Always-On Monitoring** 🚀
