#!/bin/bash

# Helper script to setup kind cluster for k6 testing
# This script can be used independently or called by verify-k6-setup.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CLUSTER_NAME="k6-test-cluster"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kind is installed
if ! command -v kind >/dev/null 2>&1; then
    print_error "kind is not installed. Please install kind first."
    echo "Install with: go install sigs.k8s.io/kind@latest"
    echo "Or download from: https://kind.sigs.k8s.io/docs/user/quick-start/"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    print_status "Cluster $CLUSTER_NAME already exists. Deleting it..."
    kind delete cluster --name "$CLUSTER_NAME"
fi

# Create kind cluster
print_status "Creating kind cluster: $CLUSTER_NAME"
kind create cluster --name "$CLUSTER_NAME" --wait 300s

# Set kubeconfig
export KUBECONFIG="$(kind get kubeconfig-path --name="$CLUSTER_NAME")"

# Wait for cluster to be ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

print_success "Kind cluster is ready!"
print_status "To use this cluster: export KUBECONFIG=\"$(kind get kubeconfig-path --name="$CLUSTER_NAME")\""
print_status "To delete this cluster: kind delete cluster --name $CLUSTER_NAME"
