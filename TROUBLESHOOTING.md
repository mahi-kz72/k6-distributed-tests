# k6 Distributed Testing Troubleshooting Guide

This guide helps you diagnose and resolve common issues when running distributed k6 tests with Kubernetes and the k6-operator.

## 🔍 Quick Diagnostics

### Check System Status

```bash
# Check if k6-operator is running
kubectl get pods -n k6-operator-system

# Check if TestRuns exist
kubectl -n k6-tests get testruns

# Check if pods are running
kubectl -n k6-tests get pods

# Check recent events
kubectl -n k6-tests get events --sort-by='.lastTimestamp'
```

### Check Resource Usage

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl -n k6-tests top pods

# Check namespace resource quotas
kubectl -n k6-tests describe resourcequota
```

## 🚨 Common Issues and Solutions

### 1. k6-operator Not Installed or Not Running

**Symptoms:**
- `kubectl get testruns` returns "no resources found"
- TestRuns are not being processed

**Diagnosis:**
```bash
# Check if operator is installed
kubectl get pods -n k6-operator-system

# Check operator logs
kubectl -n k6-operator-system logs deployment/k6-operator-controller-manager
```

**Solution:**
```bash
# Install the operator
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml

# Wait for operator to be ready
kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
```

### 2. TestRun Not Starting

**Symptoms:**
- TestRun status shows "Pending" or "Failed"
- No pods are created

**Diagnosis:**
```bash
# Describe the TestRun for detailed status
kubectl -n k6-tests describe testrun k6-basic-test

# Check for validation errors
kubectl -n k6-tests get testruns -o yaml
```

**Common Causes and Solutions:**

#### Missing ConfigMap
```bash
# Check if ConfigMap exists
kubectl -n k6-tests get configmap k6-scripts

# Apply ConfigMap if missing
kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml
```

#### Invalid TestRun Spec
```bash
# Validate TestRun YAML
kubectl apply --dry-run=client -f k8s/testrun-basic.yaml

# Check for syntax errors
kubectl -n k6-tests get testruns -o yaml | grep -A 10 -B 10 "error"
```

#### RBAC Issues
```bash
# Check if service account has permissions
kubectl auth can-i create pods --as=system:serviceaccount:k6-operator-system:k6-operator-controller-manager

# Apply RBAC if needed
kubectl apply -f k8s/rbac.yaml
```

### 3. Pods in Pending State

**Symptoms:**
- Pods are created but remain in "Pending" state
- No pods are running

**Diagnosis:**
```bash
# Describe pods for detailed status
kubectl -n k6-tests describe pods

# Check pod events
kubectl -n k6-tests get events --field-selector involvedObject.kind=Pod
```

**Common Causes and Solutions:**

#### Insufficient Resources
```bash
# Check node resources
kubectl top nodes

# Check resource requests vs available
kubectl -n k6-tests describe nodes

# Reduce resource requests in TestRun
kubectl -n k6-tests edit testrun k6-basic-test
```

#### Node Selector Issues
```bash
# Check if nodes match selector
kubectl get nodes --show-labels

# Remove or modify node selector in TestRun
kubectl -n k6-tests edit testrun k6-basic-test
```

#### Storage Issues
```bash
# Check if storage class exists
kubectl get storageclass

# Check PVC status
kubectl -n k6-tests get pvc
```

### 4. Pods Failing to Start

**Symptoms:**
- Pods are created but fail to start
- Pods restart repeatedly

**Diagnosis:**
```bash
# Check pod logs
kubectl -n k6-tests logs <pod-name>

# Check pod status
kubectl -n k6-tests describe pod <pod-name>
```

**Common Causes and Solutions:**

#### Image Pull Issues
```bash
# Check if image exists
kubectl -n k6-tests describe pod <pod-name> | grep -i image

# Try pulling image manually
kubectl -n k6-tests run test-pod --image=grafana/k6:latest --rm -it -- /bin/sh
```

#### Script Not Found
```bash
# Check if script exists in ConfigMap
kubectl -n k6-tests get configmap k6-scripts -o yaml | grep -A 5 -B 5 "test.js"

# Verify script syntax
kubectl -n k6-tests exec <pod-name> -- k6 run --dry-run /scripts/test.js
```

#### Resource Limits
```bash
# Check if pod is killed due to resource limits
kubectl -n k6-tests describe pod <pod-name> | grep -i "killed\|oom"

# Increase resource limits
kubectl -n k6-tests edit testrun k6-basic-test
```

### 5. Test Execution Issues

**Symptoms:**
- Pods start but tests fail
- Tests run but produce errors

**Diagnosis:**
```bash
# Check test logs
kubectl -n k6-tests logs -l testrun=k6-basic-test

# Check specific pod logs
kubectl -n k6-tests logs <pod-name> --tail=100
```

**Common Causes and Solutions:**

#### Network Connectivity
```bash
# Test connectivity from pod
kubectl -n k6-tests exec <pod-name> -- curl -I https://httpbin.org/get

# Check DNS resolution
kubectl -n k6-tests exec <pod-name> -- nslookup httpbin.org
```

#### Script Errors
```bash
# Validate script syntax
kubectl -n k6-tests exec <pod-name> -- k6 run --dry-run /scripts/test.js

# Check script permissions
kubectl -n k6-tests exec <pod-name> -- ls -la /scripts/
```

#### Environment Variables
```bash
# Check environment variables
kubectl -n k6-tests exec <pod-name> -- env | grep K6

# Verify k6 configuration
kubectl -n k6-tests exec <pod-name> -- k6 version
```

## 🔧 Advanced Troubleshooting

### Debug Mode

```bash
# Enable debug logging
kubectl -n k6-tests patch testrun k6-basic-test --type='merge' -p='{"spec":{"runner":{"env":[{"name":"K6_LOG_LEVEL","value":"debug"}]}}}'

# Check debug logs
kubectl -n k6-tests logs -l testrun=k6-basic-test --tail=100
```

### Resource Monitoring

```bash
# Monitor resource usage during test
kubectl -n k6-tests top pods --watch

# Check node resource usage
kubectl top nodes --watch
```

### Network Debugging

```bash
# Test network connectivity
kubectl -n k6-tests run network-test --image=busybox --rm -it -- wget -O- https://httpbin.org/get

# Check DNS resolution
kubectl -n k6-tests run dns-test --image=busybox --rm -it -- nslookup httpbin.org
```

## 📊 Performance Issues

### High Resource Usage

```bash
# Check resource usage
kubectl -n k6-tests top pods

# Reduce parallelism
kubectl -n k6-tests edit testrun k6-basic-test
# Change parallelism: 3 to parallelism: 1

# Reduce resource requests
kubectl -n k6-tests edit testrun k6-basic-test
# Reduce CPU/memory requests
```

### Slow Test Execution

```bash
# Check pod status
kubectl -n k6-tests get pods -o wide

# Check node resources
kubectl top nodes

# Check network latency
kubectl -n k6-tests exec <pod-name> -- ping -c 5 httpbin.org
```

## 🧹 Cleanup and Recovery

### Clean Up Failed Tests

```bash
# Delete all TestRuns
kubectl -n k6-tests delete testruns --all

# Delete all pods
kubectl -n k6-tests delete pods --all

# Clean up namespace
kubectl delete namespace k6-tests
```

### Reset Operator

```bash
# Restart operator
kubectl -n k6-operator-system rollout restart deployment/k6-operator-controller-manager

# Check operator status
kubectl -n k6-operator-system get pods
```

## 📞 Getting Help

### Useful Commands for Support

```bash
# Collect system information
kubectl version
kubectl get nodes -o wide
kubectl -n k6-operator-system get pods -o wide

# Collect test information
kubectl -n k6-tests get testruns -o yaml
kubectl -n k6-tests get pods -o yaml
kubectl -n k6-tests get events

# Collect logs
kubectl -n k6-operator-system logs deployment/k6-operator-controller-manager > operator.log
kubectl -n k6-tests logs -l testrun=k6-basic-test > test.log
```

### Log Analysis

```bash
# Search for errors
kubectl -n k6-tests logs -l testrun=k6-basic-test | grep -i error

# Search for warnings
kubectl -n k6-tests logs -l testrun=k6-basic-test | grep -i warn

# Check test metrics
kubectl -n k6-tests logs -l testrun=k6-basic-test | grep -E "(checks|http_req)"
```

## 🔗 Additional Resources

- [k6-operator GitHub Issues](https://github.com/grafana/k6-operator/issues)
- [k6 Documentation](https://grafana.com/docs/k6/)
- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug-application-cluster/)
- [k6 Community Forum](https://community.grafana.com/c/k6/)
