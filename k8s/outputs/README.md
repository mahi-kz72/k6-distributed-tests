# k6 Monitoring Stack - Output Configuration

This directory contains the InfluxDB v2 + Grafana monitoring stack configuration for receiving metrics from external k6 test runners.

## 📋 Overview

This stack provides an always-on data pipeline for k6 metrics:
- **InfluxDB v2**: Time-series database for metric storage
- **Grafana**: Visualization platform with pre-configured dashboards

**Important**: This stack does NOT execute k6 tests. It only receives and visualizes metrics from external runners.

## 🗂 Files

### influxdb-deployment.yaml
Complete InfluxDB v2 deployment including:
- Secret for authentication tokens
- ConfigMap for initialization
- Deployment with InfluxDB 2.7
- Service for internal access
- PersistentVolumeClaim for data storage
- Ingress for external access

### grafana-deployment.yaml
Complete Grafana deployment including:
- InfluxDB v2 datasource configuration
- Dashboard provisioning setup
- 5 team-specific pre-configured dashboards
- Service for access
- Deployment with Grafana latest

## 🚀 Deployment

### Deploy Complete Stack

```bash
# From project root
kubectl apply -k k8s/

# Or from this directory
kubectl apply -f influxdb-deployment.yaml
kubectl apply -f grafana-deployment.yaml
```

### Verify Deployment

```bash
kubectl -n k6-tests get pods
kubectl -n k6-tests get services
kubectl -n k6-tests get ingress
kubectl -n k6-tests get secrets
kubectl -n k6-tests get pvc
```

Expected pods:
- `influxdb-xxxxx` (Running)
- `grafana-xxxxx` (Running)

## 🔧 Configuration

### InfluxDB Settings

**Default configuration** (stored in Secret `influxdb-auth`):
```yaml
Organization: k6-org
Admin User: admin
Admin Token: k6-super-secret-admin-token-change-me  # ⚠️ CHANGE IN PRODUCTION!
Default Bucket: k6-metrics
```

**Available buckets**:
- `k6-metrics` (default)
- `team1-metrics`
- `team2-metrics`
- `team3-metrics`
- `team4-metrics`
- `team5-metrics`

**Update credentials**:
```bash
kubectl -n k6-tests edit secret influxdb-auth
```

### Ingress Configuration

**Default hostname**: `influxdb.example.com`

**Update to your domain**:
Edit `influxdb-deployment.yaml` and change:
```yaml
spec:
  rules:
  - host: influxdb.your-domain.com  # Update this
```

**Enable TLS**:
1. Install cert-manager in your cluster
2. Uncomment the cert-manager annotation in the Ingress
3. Apply the updated configuration

### Grafana Settings

**Default credentials**:
- Username: `admin`
- Password: `admin123` ⚠️ **Change in production!**

**Update password**:
```bash
kubectl -n k6-tests set env deployment/grafana GF_SECURITY_ADMIN_PASSWORD=your-new-password
```

## 📊 Dashboards

### Available Dashboards

| Dashboard Name | Bucket | Description |
|----------------|--------|-------------|
| Team 1 - k6 Performance Metrics | team1-metrics | Team 1 test results |
| Team 2 - k6 Performance Metrics | team2-metrics | Team 2 test results |
| Team 3 - k6 Performance Metrics | team3-metrics | Team 3 test results |
| Team 4 - k6 Performance Metrics | team4-metrics | Team 4 test results |
| Team 5 - k6 Performance Metrics | team5-metrics | Team 5 test results |

### Dashboard Metrics

Each dashboard displays:
- **HTTP Requests Per Second**: Aggregate request rate
- **Response Time (p95)**: 95th percentile response time
- **Virtual Users**: Number of concurrent VUs
- **Error Rate**: Percentage of failed requests

### Accessing Dashboards

```bash
# Port-forward to Grafana
kubectl -n k6-tests port-forward service/grafana 3000:3000

# Open in browser
open http://localhost:3000
```

Navigate to: **Dashboards → k6 Load Testing**

## 🌐 External k6 Runner Configuration

### Basic Configuration

External k6 runners send metrics using the InfluxDB v2 output:

```bash
export K6_OUT="influxdb_v2=url=https://influxdb.your-domain.com,token=YOUR_TOKEN,organization=k6-org,bucket=k6-metrics"
k6 run your-test.js
```

### Get Required Credentials

```bash
# Get InfluxDB token
kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d

# Get organization
kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.org}' | base64 -d
```

### Team-Specific Buckets

```bash
# Team 1
export K6_OUT="influxdb_v2=url=https://influxdb.your-domain.com,token=YOUR_TOKEN,organization=k6-org,bucket=team1-metrics"
k6 run team1-test.js

# Team 2
export K6_OUT="influxdb_v2=url=https://influxdb.your-domain.com,token=YOUR_TOKEN,organization=k6-org,bucket=team2-metrics"
k6 run team2-test.js
```

**📖 See [EXTERNAL-RUN.md](../../EXTERNAL-RUN.md) for complete documentation**

## 🔍 Data Verification

### Check InfluxDB Data

```bash
# Port-forward to InfluxDB
kubectl -n k6-tests port-forward service/influxdb 8086:8086

# Query using InfluxDB CLI
kubectl -n k6-tests exec -it deployment/influxdb -- influx bucket list --org k6-org

# Check data in bucket
kubectl -n k6-tests exec -it deployment/influxdb -- influx query 'from(bucket:"k6-metrics") |> range(start:-1h) |> limit(n:10)' --org k6-org
```

### Check Grafana Datasource

1. Login to Grafana
2. Go to **Configuration → Data Sources**
3. Click on **InfluxDB-k6**
4. Click **Test** button
5. Should see: "Data source is working"

## 🛠 Maintenance

### Backup InfluxDB Data

```bash
# Create backup
kubectl -n k6-tests exec deployment/influxdb -- \
  influx backup /tmp/backup --org k6-org --token YOUR_TOKEN

# Copy backup locally
kubectl -n k6-tests cp influxdb-pod:/tmp/backup ./influxdb-backup
```

### Restore InfluxDB Data

```bash
# Copy backup to pod
kubectl -n k6-tests cp ./influxdb-backup influxdb-pod:/tmp/backup

# Restore
kubectl -n k6-tests exec deployment/influxdb -- \
  influx restore /tmp/backup --org k6-org --token YOUR_TOKEN
```

### Set Data Retention

```bash
# Update bucket retention (e.g., 30 days)
kubectl -n k6-tests exec deployment/influxdb -- \
  influx bucket update \
  --name team1-metrics \
  --retention 720h \
  --org k6-org \
  --token YOUR_TOKEN
```

### Monitor Resource Usage

```bash
# Check pod resource usage
kubectl -n k6-tests top pods

# Check PVC usage
kubectl -n k6-tests get pvc
kubectl -n k6-tests exec deployment/influxdb -- df -h /var/lib/influxdb2
```

## 🔒 Security

### Production Hardening

1. **Change default credentials**:
   ```bash
   kubectl -n k6-tests edit secret influxdb-auth
   kubectl -n k6-tests set env deployment/grafana GF_SECURITY_ADMIN_PASSWORD=new-password
   ```

2. **Enable TLS on Ingress**:
   - Install cert-manager
   - Configure Let's Encrypt
   - Update Ingress with TLS annotations

3. **Create limited-scope tokens**:
   ```bash
   kubectl -n k6-tests exec deployment/influxdb -- \
     influx auth create \
     --org k6-org \
     --write-bucket team1-metrics \
     --description "Team 1 write-only" \
     --token YOUR_ADMIN_TOKEN
   ```

4. **Implement NetworkPolicy**:
   ```bash
   kubectl apply -f - <<EOF
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
   EOF
   ```

## 🐛 Troubleshooting

### InfluxDB Not Starting

```bash
# Check pod status
kubectl -n k6-tests describe pod -l app.kubernetes.io/name=influxdb

# Check logs
kubectl -n k6-tests logs deployment/influxdb

# Check PVC
kubectl -n k6-tests get pvc influxdb-pvc
```

### Grafana Dashboards Empty

```bash
# Check datasource logs
kubectl -n k6-tests logs deployment/grafana | grep -i influx

# Verify data exists
kubectl -n k6-tests exec deployment/influxdb -- \
  influx query 'from(bucket:"k6-metrics") |> range(start:-24h) |> count()' --org k6-org
```

### Cannot Access Ingress

```bash
# Check Ingress status
kubectl -n k6-tests describe ingress influxdb-ingress

# Check Ingress controller
kubectl -n ingress-nginx get pods

# Test internal connectivity
kubectl -n k6-tests run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://influxdb:8086/health
```

## 📚 Additional Resources

- [InfluxDB v2 Documentation](https://docs.influxdata.com/influxdb/v2/)
- [Grafana Documentation](https://grafana.com/docs/)
- [k6 InfluxDB Output](https://k6.io/docs/results-output/real-time/influxdb/)
- [EXTERNAL-RUN.md](../../EXTERNAL-RUN.md) - Complete guide for external runners

## 🧹 Cleanup

```bash
# Delete monitoring stack (keeps namespace)
kubectl delete -f influxdb-deployment.yaml
kubectl delete -f grafana-deployment.yaml

# Delete everything including data
kubectl delete namespace k6-tests
```

**⚠️ Warning**: Deleting the namespace will permanently delete all stored metrics!
