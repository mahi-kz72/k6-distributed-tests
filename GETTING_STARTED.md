# 🚀 Getting Started with k6 Distributed Testing

This guide will help you get up and running with distributed k6 load testing using the official Kubernetes + k6-operator approach.

## ✅ Prerequisites

1. **Kubernetes cluster** (v1.19+)
   - Local: minikube, kind, or Docker Desktop Kubernetes
   - Cloud: EKS, GKE, AKS, or any compatible cluster

2. **kubectl** configured to access your cluster

3. **Basic Kubernetes knowledge**

## 🏃‍♂️ Quick Start (5 minutes)

### Step 1: Install k6-operator
```bash
# Install the k6-operator
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml

# Wait for operator to be ready
kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
```

### Step 2: Create Namespace and Apply Scripts
```bash
# Create namespace and apply test scripts
kubectl apply -f k8s/namespace.yaml
kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml
```

### Step 3: Run Your First Test
```bash
# Basic test with 3 parallel pods
kubectl -n k6-tests apply -f k8s/testrun-basic.yaml

# Or advanced test with 5 parallel pods
kubectl -n k6-tests apply -f k8s/testrun-advanced.yaml
```

### Step 4: Monitor and View Results
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

## 🔧 Customization

### 1. Create Your Own Test Script
```bash
# Edit the ConfigMap to add your test script
kubectl -n k6-tests edit configmap k6-scripts

# Or create a new test file and update the ConfigMap
kubectl -n k6-tests create configmap my-test-script --from-file=my-test.js
```

Example test script:
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

### 2. Create Custom TestRun
```yaml
apiVersion: k6.io/v1alpha1
kind: TestRun
metadata:
  name: my-custom-test
  namespace: k6-tests
spec:
  parallelism: 5
  script:
    configMap:
      name: my-test-script
      file: my-test.js
  runner:
    image: grafana/k6:latest
    args:
      - run
      - /scripts/my-test.js
```

### 3. Scale Test Execution
```bash
# Scale using Kustomize overlays
kubectl apply -k k8s/overlays/basic/scale-10

# Or edit TestRun directly
kubectl -n k6-tests edit testrun k6-basic-test
```

## 📈 Understanding Results

### Key Metrics
- **http_req_duration**: Response time percentiles
- **http_req_failed**: Error rate
- **checks**: Test assertion pass rate
- **vus**: Virtual users (concurrent)

### Viewing Results
```bash
# View test logs (includes metrics)
kubectl -n k6-tests logs -l testrun=k6-basic-test

# View specific pod logs
kubectl -n k6-tests logs <pod-name>

# Get test status
kubectl -n k6-tests get testruns -o wide
```

### Result Outputs
- **Console logs**: Real-time metrics and progress
- **JSON output**: Detailed metrics (if configured)
- **External systems**: InfluxDB, Prometheus (see `k8s/outputs/`)

## 🐛 Troubleshooting

### Common Issues

1. **"k6-operator not found"**
   ```bash
   # Check if operator is installed
   kubectl get pods -n k6-operator-system
   
   # Install operator
   make install-operator
   ```

2. **"TestRun not starting"**
   ```bash
   # Check TestRun status
   kubectl -n k6-tests describe testrun k6-basic-test
   
   # Check pod events
   kubectl -n k6-tests get events
   ```

3. **"Pods in Pending state"**
   ```bash
   # Check resource availability
   kubectl -n k6-tests describe pods
   
   # Check node resources
   kubectl top nodes
   ```

4. **"Script not found"**
   ```bash
   # Verify ConfigMap exists
   kubectl -n k6-tests get configmap k6-scripts
   
   # Check script content
   kubectl -n k6-tests get configmap k6-scripts -o yaml
   ```

### Debug Commands
```bash
# Check operator logs
kubectl -n k6-operator-system logs deployment/k6-operator-controller-manager

# Describe TestRun for detailed status
kubectl -n k6-tests describe testrun k6-basic-test

# Check pod logs with timestamps
kubectl -n k6-tests logs -l testrun=k6-basic-test --timestamps
```

## 🎯 Next Steps

1. **Read the full documentation**: `README.md`
2. **Explore Kubernetes manifests**: `k8s/` directory
3. **Customize for your API**: Modify test scripts in ConfigMap
4. **Scale up**: Test with more parallel pods
5. **Integrate with CI/CD**: Use in automated pipelines
6. **Configure outputs**: Set up InfluxDB or Prometheus (see `k8s/outputs/`)

## 📚 Additional Resources

- [k6 Documentation](https://grafana.com/docs/k6/)
- [k6-operator GitHub](https://github.com/grafana/k6-operator)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Load Testing Best Practices](https://grafana.com/docs/k6/latest/testing-guides/)

## 💡 Tips

- Start with 3-5 parallel pods and scale up gradually
- Monitor your cluster resources and node capacity
- Use realistic test data and scenarios
- Set appropriate thresholds for your use case
- Configure external outputs for better monitoring
- Use Kustomize overlays for different environments

---

**Need help?** Check the troubleshooting section in `README.md` or run `make debug-basic` for diagnostics.
