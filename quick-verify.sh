#!/bin/bash

# Quick verification script for k6 setup
# This script assumes you already have a Kubernetes cluster running

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

NAMESPACE="k6-tests"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if kubectl can connect to cluster
if ! kubectl cluster-info >/dev/null 2>&1; then
    print_error "Cannot connect to Kubernetes cluster"
    print_status "Please ensure kubectl is configured and cluster is running"
    exit 1
fi

print_success "Connected to Kubernetes cluster"

# Check if k6-operator is installed
if ! kubectl get crd testruns.k6.io >/dev/null 2>&1; then
    print_warning "k6-operator not found. Installing..."
    kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
    print_status "Waiting for operator to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
    print_success "k6-operator installed"
else
    print_success "k6-operator is installed"
fi

# Apply manifests
print_status "Applying k6 manifests..."

kubectl apply -f k8s/namespace.yaml
kubectl -n "$NAMESPACE" apply -f k8s/scripts-configmap.yaml
kubectl -n "$NAMESPACE" apply -f k8s/testrun-basic.yaml

print_success "Manifests applied"

# Wait a moment for pods to start
print_status "Waiting for pods to start..."
sleep 10

# Check status
print_status "Current status:"
kubectl -n "$NAMESPACE" get testruns,pods

# Get expected parallelism
EXPECTED_PARALLELISM=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.spec.parallelism}' 2>/dev/null || echo "3")
print_status "Expected parallelism: $EXPECTED_PARALLELISM"

# Check pod count
POD_COUNT=$(kubectl -n "$NAMESPACE" get pods --no-headers | wc -l)
print_status "Current pod count: $POD_COUNT"

if [ "$POD_COUNT" -eq "$EXPECTED_PARALLELISM" ]; then
    print_success "✅ Correct number of pods created"
else
    print_warning "⚠️  Expected $EXPECTED_PARALLELISM pods, but found $POD_COUNT"
fi

print_status "To monitor progress: kubectl -n $NAMESPACE get testruns,pods -w"
print_status "To view logs: kubectl -n $NAMESPACE logs -l testrun=k6-basic-test"
print_status "To clean up: kubectl -n $NAMESPACE delete testruns --all"
