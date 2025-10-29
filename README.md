# k6 Distributed Load Testing with Kubernetes + k6-operator

This setup provides a fully distributed k6 load testing environment using Kubernetes and the official k6-operator, following Grafana's official documentation for distributed testing.

## 🏗️ Architecture

- **k6-operator**: Kubernetes operator that manages TestRun resources
- **TestRun CRD**: Custom Resource Definition for defining distributed tests
- **Parallel Pods**: Each pod executes a unique shard of the test automatically
- **ConfigMap**: Test scripts are stored as Kubernetes ConfigMaps
- **No Master/Worker**: Distribution is handled by the operator via parallelism

## 📁 Project Structure

```
k6/
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml        # k6-tests namespace
│   ├── scripts-configmap.yaml # Test scripts as ConfigMap
│   ├── testrun-basic.yaml    # Basic test TestRun
│   ├── testrun-advanced.yaml # Advanced test TestRun
│   ├── rbac.yaml            # RBAC configuration
│   ├── kustomization.yaml   # Kustomize base configuration
│   ├── operator-install.md  # Operator installation guide
│   ├── overlays/            # Kustomize overlays for scaling
│   │   ├── basic/           # Basic test overlays
│   │   └── advanced/        # Advanced test overlays
│   └── outputs/             # Output configurations
│       ├── influxdb.yaml    # InfluxDB output example
│       ├── prometheus.yaml  # Prometheus output example
│       └── README.md        # Output configuration guide
├── scripts/                 # Test scripts (for reference)
│   ├── test.js             # Basic test script
│   └── advanced-test.js    # Advanced test script
├── Makefile                # Convenient management commands
├── GETTING_STARTED.md      # Quick start guide
├── README.md              # This file
└── .gitignore            # Git ignore file
```

## 🚀 Quick Start

### 1. Install k6-operator

```bash
# Install the k6-operator
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml

# Wait for operator to be ready
kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
```

### 2. Create Namespace and Apply Scripts

```bash
# Create namespace and apply test scripts
kubectl apply -f k8s/namespace.yaml
kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml
```

### 3. Run Your First Test

```bash
# Basic test with 3 parallel pods
kubectl -n k6-tests apply -f k8s/testrun-basic.yaml

# Or advanced test with 5 parallel pods
kubectl -n k6-tests apply -f k8s/testrun-advanced.yaml
```

### 4. Monitor and View Results

```bash
# Watch test progress
kubectl -n k6-tests get testruns,pods -w

# View logs from test pods
kubectl -n k6-tests logs -l testrun=k6-basic-test --tail=50
```

## 📋 Available Commands

### Using Makefile (Recommended)

```bash
make help                          # Show all available commands
make install-operator              # Install k6-operator
make create-ns                     # Create k6-tests namespace
make apply-scripts                 # Apply test scripts ConfigMap
make apply-basic                   # Run basic test (3 pods)
make apply-advanced                # Run advanced test (5 pods)
make watch-basic                   # Watch basic test progress
make logs-basic                    # Show basic test logs
make clean-basic                   # Clean up basic test
make scale-basic-10                # Run basic test with 10 pods
make quick-start                   # Complete quick start workflow
```

### Direct kubectl Commands

```bash
# Basic test operations
kubectl -n k6-tests apply -f k8s/testrun-basic.yaml
kubectl -n k6-tests get testruns,pods
kubectl -n k6-tests logs -l testrun=k6-basic-test

# Scaling with Kustomize
kubectl apply -k k8s/overlays/basic/scale-5
kubectl apply -k k8s/overlays/advanced/scale-10

# Cleanup
kubectl -n k6-tests delete testruns --all
kubectl delete namespace k6-tests
```

## 📊 Test Scripts

| Script | Description | Duration | Users | Use Case |
|--------|-------------|----------|-------|----------|
| `test.js` | Basic HTTP tests | 2 minutes | 10 | Quick validation |
| `advanced-test.js` | Intensive load test | 7 minutes | 50 | Performance testing |

## 🔧 Configuration

### TestRun Configuration

The TestRun manifests include:

- **Parallelism**: Number of parallel pods to run the test
- **Script**: Reference to ConfigMap containing test script
- **Resources**: CPU and memory requests/limits per pod
- **Environment**: k6 configuration and environment variables
- **Output**: Result output configuration

### Scaling Test Execution

```bash
# Scale using Kustomize overlays
kubectl apply -k k8s/overlays/basic/scale-10

# Or edit TestRun directly
kubectl -n k6-tests edit testrun k6-basic-test
```

### Custom Test Scripts

```bash
# Edit the ConfigMap to add your test script
kubectl -n k6-tests edit configmap k6-scripts

# Or create a new test file and update the ConfigMap
kubectl -n k6-tests create configmap my-test-script --from-file=my-test.js
```

## 📈 Viewing Results

### Real-time Monitoring

```bash
# Follow all logs
kubectl -n k6-tests logs -f -l testrun=k6-basic-test

# Follow specific pod logs
kubectl -n k6-tests logs -f <pod-name>

# View container status
kubectl -n k6-tests get pods -o wide
```

### Test Results

Results are available through:

- **Console logs**: Real-time metrics and progress
- **JSON output**: Detailed metrics (if configured)
- **External systems**: InfluxDB, Prometheus (see `k8s/outputs/`)

### Export Results

```bash
# Copy results from pods
kubectl -n k6-tests cp <pod-name>:/tmp/results.json ./results.json

# View results with jq (if installed)
kubectl -n k6-tests logs <pod-name> | jq '.metrics'
```

## 🎯 Scaling Workers

### Dynamic Scaling

```bash
# Scale to 5 pods
kubectl apply -k k8s/overlays/basic/scale-5

# Scale to 10 pods
kubectl apply -k k8s/overlays/basic/scale-10

# Scale to 20 pods
kubectl apply -k k8s/overlays/advanced/scale-20
```

### Performance Considerations

- **CPU**: Each pod consumes CPU resources
- **Memory**: Workers share the test script and data
- **Network**: More pods = more network load
- **Target**: Ensure your target system can handle the load

## 🔍 Troubleshooting

### Common Issues

1. **k6-operator not found**:
   ```bash
   kubectl get pods -n k6-operator-system
   make install-operator
   ```

2. **TestRun not starting**:
   ```bash
   kubectl -n k6-tests describe testrun k6-basic-test
   kubectl -n k6-tests get events
   ```

3. **Pods in Pending state**:
   ```bash
   kubectl -n k6-tests describe pods
   kubectl top nodes
   ```

4. **Script not found**:
   ```bash
   kubectl -n k6-tests get configmap k6-scripts
   kubectl -n k6-tests get configmap k6-scripts -o yaml
   ```

### Debug Mode

```bash
# Check operator logs
kubectl -n k6-operator-system logs deployment/k6-operator-controller-manager

# Describe TestRun for detailed status
kubectl -n k6-tests describe testrun k6-basic-test

# Check pod logs with timestamps
kubectl -n k6-tests logs -l testrun=k6-basic-test --timestamps
```

## 📚 Custom Test Scripts

### Creating Your Own Test

1. Create a new file in `scripts/` directory
2. Use k6 JavaScript API
3. Export `options` for test configuration
4. Export `default` function for test logic
5. Optionally export `handleSummary` for custom result handling

### Example Custom Test

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const response = http.get('https://your-api.com/endpoint');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
```

## 🔗 Official Documentation

This setup follows the official Grafana k6 documentation:
- [Running Distributed Tests](https://grafana.com/docs/k6/latest/testing-guides/running-distributed-tests/)
- [k6-operator GitHub](https://github.com/grafana/k6-operator)
- [k6 Docker Hub](https://hub.docker.com/r/grafana/k6)
- [k6 JavaScript API](https://grafana.com/docs/k6/latest/javascript-api/)

## 📝 Notes

- Test scripts are stored as Kubernetes ConfigMaps
- Results are available through pod logs and optional external outputs
- The k6-operator coordinates all pods automatically
- Each pod executes a unique shard of the test
- All containers use the official `grafana/k6:latest` image
- Health checks ensure proper startup sequence

## 🐳 Docker Compose Alternative

For local development and testing without Kubernetes, the Docker Compose setup is still available in the `docker-compose.yml` file. However, the Kubernetes + k6-operator approach is the official and recommended method for distributed testing.

To use Docker Compose:
```bash
# Run with Docker Compose (non-official distribution)
docker-compose up --scale worker=3
```

**Note**: The Docker Compose approach is provided for local development only and is not the official distributed testing method.