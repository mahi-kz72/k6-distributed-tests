# k6 Output Configurations

This directory contains examples of how to configure k6 to send test results to various output systems.

## Available Outputs

### 1. InfluxDB (`influxdb.yaml`)
- Sends metrics to InfluxDB time-series database
- Includes example InfluxDB deployment for testing
- Configured with proper authentication and database setup

### 2. Prometheus (`prometheus.yaml`)
- Sends metrics to Prometheus monitoring system
- Includes example Prometheus deployment for testing
- Configured with proper endpoint and job settings

## Usage

### Apply Output Configuration

```bash
# Apply InfluxDB output
kubectl apply -f k8s/outputs/influxdb.yaml

# Apply Prometheus output
kubectl apply -f k8s/outputs/prometheus.yaml
```

### Use with TestRuns

The output configurations include example TestRuns that demonstrate how to use each output:

```bash
# Run test with InfluxDB output
kubectl -n k6-tests apply -f k8s/outputs/influxdb.yaml
kubectl -n k6-tests get testruns

# Run test with Prometheus output
kubectl -n k6-tests apply -f k8s/outputs/prometheus.yaml
kubectl -n k6-tests get testruns
```

## Customizing Outputs

### Environment Variables

Each output configuration uses environment variables that you can customize:

**InfluxDB:**
- `INFLUXDB_URL`: InfluxDB server URL
- `INFLUXDB_DATABASE`: Database name
- `INFLUXDB_USERNAME`: Username for authentication
- `INFLUXDB_PASSWORD`: Password for authentication

**Prometheus:**
- `PROMETHEUS_URL`: Prometheus server URL
- `PROMETHEUS_JOB`: Job name for metrics
- `PROMETHEUS_TAGS`: Additional tags for metrics

### k6 Arguments

The TestRuns include the necessary k6 arguments for each output:

**InfluxDB:**
```bash
--out=influxdb=http://influxdb:8086/k6
```

**Prometheus:**
```bash
--out=prometheus=http://prometheus:9090/api/v1/write
```

## Integration with Existing TestRuns

To add output to your existing TestRuns, modify the `args` section:

```yaml
spec:
  runner:
    args:
      - run
      - --out=json=/tmp/results.json
      - --out=influxdb=http://influxdb:8086/k6  # Add this line
      - /scripts/test.js
```

## Monitoring and Visualization

### InfluxDB
- Access InfluxDB UI at `http://localhost:8086` (if port-forwarded)
- Use Grafana to visualize metrics
- Query metrics using InfluxQL

### Prometheus
- Access Prometheus UI at `http://localhost:9090` (if port-forwarded)
- Use Grafana to visualize metrics
- Query metrics using PromQL

## Port Forwarding

To access the output systems from your local machine:

```bash
# InfluxDB
kubectl -n k6-tests port-forward service/influxdb 8086:8086

# Prometheus
kubectl -n k6-tests port-forward service/prometheus 9090:9090
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure the output service is running
2. **Authentication failed**: Check credentials in environment variables
3. **Database not found**: Create the database in InfluxDB
4. **Metrics not appearing**: Check k6 logs for output errors

### Debug Commands

```bash
# Check if output services are running
kubectl -n k6-tests get pods -l app.kubernetes.io/name=influxdb
kubectl -n k6-tests get pods -l app.kubernetes.io/name=prometheus

# Check k6 logs for output errors
kubectl -n k6-tests logs -l testrun=k6-test-with-influxdb

# Test connectivity
kubectl -n k6-tests exec -it <k6-pod> -- curl http://influxdb:8086/ping
```

## Production Considerations

- Use external InfluxDB/Prometheus instances for production
- Configure proper authentication and TLS
- Set up monitoring and alerting
- Consider data retention policies
- Use persistent volumes for data storage
