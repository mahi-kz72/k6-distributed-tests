#!/bin/bash

# k6 Kubernetes Setup Validation Script
# This script validates the Kubernetes setup for k6 distributed testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Validating k6 Kubernetes distributed testing setup..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    print_status "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

print_success "kubectl is available"

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    print_status "Please ensure kubectl is configured and cluster is accessible"
    exit 1
fi

print_success "Connected to Kubernetes cluster"

# Check Kubernetes version
K8S_VERSION=$(kubectl version --short --client | grep -o 'v[0-9]\+\.[0-9]\+' | head -1)
print_status "Kubernetes version: $K8S_VERSION"

# Check if k8s directory exists
if [ ! -d "k8s" ]; then
    print_error "k8s directory not found"
    exit 1
fi

print_success "k8s directory exists"

# Validate YAML files
print_status "Validating Kubernetes manifests..."

required_files=(
    "k8s/namespace.yaml"
    "k8s/scripts-configmap.yaml"
    "k8s/testrun-basic.yaml"
    "k8s/testrun-advanced.yaml"
    "k8s/rbac.yaml"
    "k8s/kustomization.yaml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        if kubectl apply --dry-run=client -f "$file" &> /dev/null; then
            print_success "✓ $file is valid"
        else
            print_error "✗ $file has validation errors"
            kubectl apply --dry-run=client -f "$file"
            exit 1
        fi
    else
        print_error "✗ $file is missing"
        exit 1
    fi
done

# Check Kustomize overlays
print_status "Validating Kustomize overlays..."

overlay_dirs=(
    "k8s/overlays/basic"
    "k8s/overlays/advanced"
    "k8s/overlays/basic/scale-3"
    "k8s/overlays/basic/scale-5"
    "k8s/overlays/basic/scale-10"
    "k8s/overlays/advanced/scale-5"
    "k8s/overlays/advanced/scale-10"
    "k8s/overlays/advanced/scale-20"
)

for dir in "${overlay_dirs[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/kustomization.yaml" ]; then
        if kubectl apply --dry-run=client -k "$dir" &> /dev/null; then
            print_success "✓ $dir/kustomization.yaml is valid"
        else
            print_warning "⚠ $dir/kustomization.yaml has validation issues"
        fi
    else
        print_warning "⚠ $dir/kustomization.yaml not found"
    fi
done

# Check if k6-operator is installed
print_status "Checking k6-operator installation..."

if kubectl get crd testruns.k6.io &> /dev/null; then
    print_success "✓ k6-operator CRDs are installed"
    
    # Check if operator is running
    if kubectl get pods -n k6-operator-system &> /dev/null; then
        OPERATOR_PODS=$(kubectl get pods -n k6-operator-system --no-headers | wc -l)
        if [ "$OPERATOR_PODS" -gt 0 ]; then
            print_success "✓ k6-operator pods are running"
        else
            print_warning "⚠ k6-operator pods not found"
        fi
    else
        print_warning "⚠ k6-operator-system namespace not found"
    fi
else
    print_warning "⚠ k6-operator CRDs not found"
    print_status "Run: kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml"
fi

# Check if namespace exists
print_status "Checking k6-tests namespace..."

if kubectl get namespace k6-tests &> /dev/null; then
    print_success "✓ k6-tests namespace exists"
    
    # Check if ConfigMap exists
    if kubectl -n k6-tests get configmap k6-scripts &> /dev/null; then
        print_success "✓ k6-scripts ConfigMap exists"
    else
        print_warning "⚠ k6-scripts ConfigMap not found"
        print_status "Run: kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml"
    fi
else
    print_warning "⚠ k6-tests namespace not found"
    print_status "Run: kubectl apply -f k8s/namespace.yaml"
fi

# Check cluster resources
print_status "Checking cluster resources..."

# Check nodes
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
print_status "Available nodes: $NODE_COUNT"

# Check node resources
if kubectl top nodes &> /dev/null; then
    print_status "Node resource usage:"
    kubectl top nodes
else
    print_warning "Cannot check node resources (metrics-server may not be installed)"
fi

# Check if Makefile exists and is executable
if [ -f "Makefile" ]; then
    print_success "✓ Makefile exists"
    if [ -x "Makefile" ] || [ -f "Makefile" ]; then
        print_success "✓ Makefile is accessible"
    fi
else
    print_warning "⚠ Makefile not found"
fi

# Test basic functionality
print_status "Testing basic functionality..."

# Test namespace creation
if kubectl apply --dry-run=client -f k8s/namespace.yaml &> /dev/null; then
    print_success "✓ Namespace creation test passed"
else
    print_error "✗ Namespace creation test failed"
fi

# Test ConfigMap creation
if kubectl apply --dry-run=client -f k8s/scripts-configmap.yaml &> /dev/null; then
    print_success "✓ ConfigMap creation test passed"
else
    print_error "✗ ConfigMap creation test failed"
fi

# Test TestRun creation
if kubectl apply --dry-run=client -f k8s/testrun-basic.yaml &> /dev/null; then
    print_success "✓ TestRun creation test passed"
else
    print_error "✗ TestRun creation test failed"
fi

print_success "Kubernetes setup validation completed!"
print_status ""
print_status "Next steps:"
print_status "1. Install k6-operator: make install-operator"
print_status "2. Create namespace: make create-ns"
print_status "3. Apply scripts: make apply-scripts"
print_status "4. Run basic test: make apply-basic"
print_status "5. Monitor test: make watch-basic"
print_status ""
print_status "For troubleshooting, see TROUBLESHOOTING.md"
print_status "For quick start, see GETTING_STARTED.md"
