# k6-operator Installation Guide

This guide provides one-liner commands to install and manage the k6-operator in your Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.19+)
- `kubectl` configured to access your cluster
- Cluster admin privileges for operator installation

## Installation

### Option 1: Install Latest Stable Version (Recommended)

```bash
# Install the k6-operator using the official bundle
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
```

### Option 2: Install Specific Version

```bash
# Install k6-operator v0.0.7 (replace with desired version)
kubectl apply -f https://github.com/grafana/k6-operator/releases/download/v0.0.7/k6-operator.yaml
```

### Option 3: Install from Local File

```bash
# Download and apply locally (useful for air-gapped environments)
curl -LO https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
kubectl apply -f k6-operator.yaml
```

## Verify Installation

```bash
# Check if the operator is running
kubectl get pods -n k6-operator-system

# Check if CRDs are installed
kubectl get crd | grep k6

# Check operator logs
kubectl logs -n k6-operator-system deployment/k6-operator-controller-manager
```

Expected output:
```
NAME                                                      READY   STATUS    RESTARTS   AGE
k6-operator-controller-manager-xxxxxxxxx-xxxxx            2/2     Running   0          1m
```

## Check Available CRDs

```bash
# List all k6-related CRDs
kubectl get crd | grep k6

# Describe the TestRun CRD
kubectl describe crd testruns.k6.io
```

## Uninstall k6-operator

### Complete Removal

```bash
# Remove the operator
kubectl delete -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml

# Or if installed from local file
kubectl delete -f k6-operator.yaml
```

### Clean Up CRDs (Optional)

```bash
# Remove k6 CRDs (this will delete all existing TestRuns)
kubectl delete crd testruns.k6.io
kubectl delete crd k6s.k6.io
```

## Troubleshooting

### Common Issues

1. **Operator not starting**
   ```bash
   # Check operator logs
   kubectl logs -n k6-operator-system deployment/k6-operator-controller-manager
   
   # Check if CRDs are installed
   kubectl get crd | grep k6
   ```

2. **RBAC issues**
   ```bash
   # Check if service account has proper permissions
   kubectl auth can-i create testruns --as=system:serviceaccount:k6-operator-system:k6-operator-controller-manager
   ```

3. **Cluster compatibility**
   ```bash
   # Check Kubernetes version
   kubectl version --short
   
   # k6-operator requires Kubernetes v1.19+
   ```

### Health Check

```bash
# Check operator health
kubectl get pods -n k6-operator-system -o wide

# Check operator logs for errors
kubectl logs -n k6-operator-system deployment/k6-operator-controller-manager --tail=50
```

## Next Steps

After successful installation:

1. Create the k6-tests namespace: `kubectl apply -f k8s/namespace.yaml`
2. Apply test scripts: `kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml`
3. Run your first test: `kubectl -n k6-tests apply -f k8s/testrun-basic.yaml`

## References

- [k6-operator GitHub Repository](https://github.com/grafana/k6-operator)
- [k6-operator Documentation](https://grafana.com/docs/k6/latest/testing-guides/running-distributed-tests/)
- [Kubernetes CRD Documentation](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
