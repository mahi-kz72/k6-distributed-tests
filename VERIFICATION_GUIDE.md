# k6 Distributed Testing Verification Guide

This guide explains how to verify that your k6 distributed testing setup is working correctly using the provided verification scripts.

## 🚀 Quick Start

### Option 1: Full Verification (Recommended)
```bash
# Verify with kind cluster (default)
./verify-k6-setup.sh

# Verify with minikube cluster
./verify-k6-setup.sh minikube

# Verify without cleanup (keep cluster running)
./verify-k6-setup.sh kind --no-cleanup
```

### Option 2: Quick Verification
```bash
# Assumes you already have a Kubernetes cluster running
./quick-verify.sh
```

### Option 3: Using Makefile
```bash
# Full verification with kind
make verify-setup

# Full verification with minikube
make verify-setup-minikube

# Quick verification
make quick-verify

# CI/CD testing
make ci-test
```

## 📋 Prerequisites

### Required Tools
- **Docker**: For running Kubernetes clusters
- **kubectl**: Kubernetes command-line tool
- **jq**: JSON processor for parsing output
- **kind** or **minikube**: For local cluster creation

### Installation Commands

#### macOS (using Homebrew)
```bash
# Install required tools
brew install kubectl jq kind minikube

# Start Docker Desktop
open -a Docker
```

#### Ubuntu/Debian
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install jq
sudo apt-get update && sudo apt-get install -y jq

# Install kind
go install sigs.k8s.io/kind@latest

# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

## 🔧 Verification Scripts

### 1. `verify-k6-setup.sh` - Full Verification

This is the main verification script that:
- Creates a local Kubernetes cluster (kind or minikube)
- Installs the k6-operator
- Applies your k6 manifests
- Waits for TestRun completion
- Verifies all pods completed successfully
- Optionally cleans up resources

#### Usage
```bash
# Basic usage (uses kind by default)
./verify-k6-setup.sh

# Specify cluster type
./verify-k6-setup.sh kind
./verify-k6-setup.sh minikube

# Keep cluster running after test
./verify-k6-setup.sh kind --no-cleanup

# Show help
./verify-k6-setup.sh --help
```

#### Features
- **Automatic cluster creation**: Creates kind or minikube cluster
- **Timeout handling**: 15-minute timeout with progress updates
- **Status monitoring**: Real-time status of TestRun and pods
- **Result verification**: Ensures correct number of pods complete
- **Log collection**: Prints logs from all pods
- **Cleanup**: Automatically cleans up resources (unless disabled)
- **Error diagnostics**: Detailed error information on failure

### 2. `quick-verify.sh` - Quick Verification

This script assumes you already have a Kubernetes cluster running and:
- Installs k6-operator if not present
- Applies k6 manifests
- Shows current status
- Provides monitoring commands

#### Usage
```bash
# Quick verification
./quick-verify.sh
```

#### When to Use
- You already have a Kubernetes cluster running
- You want to test without creating a new cluster
- You want to verify manifests are valid
- You want to see initial pod status

### 3. `ci-test.sh` - CI/CD Testing

This script is designed for automated testing in CI/CD pipelines:
- Detects CI environment
- Uses existing cluster or creates kind cluster
- Shorter timeout (10 minutes)
- Collects results for reporting
- Automatic cleanup

#### Usage
```bash
# Run in CI environment
./ci-test.sh
```

#### CI Environment Variables
The script detects these CI environments:
- `CI=true`
- `GITHUB_ACTIONS`
- `GITLAB_CI`
- `JENKINS_URL`

### 4. Helper Scripts

#### `scripts/setup-kind.sh`
Creates a kind cluster specifically for k6 testing:
```bash
./scripts/setup-kind.sh
```

#### `scripts/setup-minikube.sh`
Creates a minikube cluster specifically for k6 testing:
```bash
./scripts/setup-minikube.sh
```

## 📊 What Gets Verified

### 1. Prerequisites
- Docker is running
- kubectl is installed and configured
- jq is available
- Required manifest files exist

### 2. Cluster Setup
- Kubernetes cluster is created and ready
- Nodes are in Ready state
- Cluster is accessible via kubectl

### 3. k6-operator Installation
- k6-operator is installed
- Operator pods are running
- CRDs are available

### 4. Manifest Application
- Namespace is created
- ConfigMap with test scripts is applied
- TestRun is created successfully

### 5. Test Execution
- Correct number of pods are created (matches parallelism)
- All pods start successfully
- TestRun progresses through phases
- All pods reach Completed state

### 6. Result Verification
- TestRun status is "Completed"
- All pods are in "Completed" state
- No pods are in error state
- Expected number of pods completed

## 🎯 Expected Output

### Success Case
```
✅ k6-operator setup verified successfully!
3 pods completed the distributed test.
```

### Failure Case
```
❌ TestRun verification failed!
Status: Failed | Pods: 3/3 | Completed: 1 | Failed: 2
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Docker is not running"
```bash
# Start Docker Desktop
open -a Docker  # macOS
sudo systemctl start docker  # Linux
```

#### 2. "kubectl is not installed"
```bash
# Install kubectl
brew install kubectl  # macOS
# Or follow installation guide above
```

#### 3. "jq is not installed"
```bash
# Install jq
brew install jq  # macOS
sudo apt-get install jq  # Ubuntu
```

#### 4. "kind is not installed"
```bash
# Install kind
go install sigs.k8s.io/kind@latest
# Or download from GitHub releases
```

#### 5. "TestRun timed out"
- Check cluster resources
- Verify test script is valid
- Check pod logs for errors
- Increase timeout if needed

#### 6. "Pods in Pending state"
- Check node resources
- Verify resource requests are reasonable
- Check for node selector issues

### Debug Commands

```bash
# Check cluster status
kubectl get nodes

# Check operator status
kubectl get pods -n k6-operator-system

# Check TestRun status
kubectl -n k6-tests get testruns

# Check pod status
kubectl -n k6-tests get pods -o wide

# View pod logs
kubectl -n k6-tests logs -l testrun=k6-basic-test

# Describe TestRun for details
kubectl -n k6-tests describe testrun k6-basic-test
```

## 📝 Customization

### Modify Timeout
Edit the `TEST_TIMEOUT` variable in the scripts:
```bash
TEST_TIMEOUT=1800  # 30 minutes
```

### Change Test Script
Modify the TestRun manifest to use a different script:
```bash
# Edit the testrun-basic.yaml file
kubectl -n k6-tests edit testrun k6-basic-test
```

### Adjust Parallelism
Change the parallelism in the TestRun:
```bash
# Edit the testrun-basic.yaml file
kubectl -n k6-tests patch testrun k6-basic-test --type='merge' -p='{"spec":{"parallelism":5}}'
```

## 🎉 Success Criteria

The verification is considered successful when:
1. ✅ All prerequisites are met
2. ✅ Kubernetes cluster is created and ready
3. ✅ k6-operator is installed and running
4. ✅ All manifests are applied successfully
5. ✅ TestRun creates the expected number of pods
6. ✅ All pods start and run successfully
7. ✅ TestRun status becomes "Completed"
8. ✅ All pods reach "Completed" state
9. ✅ No pods are in error state

## 📚 Additional Resources

- [k6-operator Documentation](https://github.com/grafana/k6-operator)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [minikube Documentation](https://minikube.sigs.k8s.io/)
- [kubectl Documentation](https://kubernetes.io/docs/reference/kubectl/)
- [k6 Documentation](https://grafana.com/docs/k6/)

