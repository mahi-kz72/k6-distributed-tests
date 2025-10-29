#!/bin/bash

# Helper script to setup minikube cluster for k6 testing
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

# Check if minikube is installed
if ! command -v minikube >/dev/null 2>&1; then
    print_error "minikube is not installed. Please install minikube first."
    echo "Install with: brew install minikube (macOS)"
    echo "Or visit: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if cluster already exists
if minikube status --profile="$CLUSTER_NAME" >/dev/null 2>&1; then
    print_status "Minikube cluster $CLUSTER_NAME already exists. Stopping it..."
    minikube stop --profile="$CLUSTER_NAME"
fi

# Start minikube cluster
print_status "Starting minikube cluster: $CLUSTER_NAME"
minikube start --profile="$CLUSTER_NAME" --driver=docker --wait=all

# Set kubeconfig
export KUBECONFIG="$(minikube kubeconfig --profile="$CLUSTER_NAME")"

# Wait for cluster to be ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

print_success "Minikube cluster is ready!"
print_status "To use this cluster: export KUBECONFIG=\"$(minikube kubeconfig --profile="$CLUSTER_NAME")\""
print_status "To stop this cluster: minikube stop --profile=$CLUSTER_NAME"
