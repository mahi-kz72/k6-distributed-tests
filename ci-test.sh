#!/bin/bash

# CI/CD Test Script for k6 Distributed Testing
# This script is designed for automated testing in CI/CD pipelines

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NAMESPACE="k6-tests"
TEST_TIMEOUT=600  # 10 minutes for CI
POLL_INTERVAL=15  # 15 seconds between checks

print_status() {
    echo -e "${BLUE}[CI]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[CI]${NC} $1"
}

print_error() {
    echo -e "${RED}[CI]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CI]${NC} $1"
}

# Function to check if we're in a CI environment
is_ci() {
    [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_URL" ]
}

# Function to setup cluster (CI-specific)
setup_ci_cluster() {
    print_status "Setting up cluster for CI environment..."
    
    # Check if we're in a CI environment
    if ! is_ci; then
        print_warning "Not in CI environment, skipping cluster setup"
        return 0
    fi
    
    # Try to use existing cluster first
    if kubectl cluster-info >/dev/null 2>&1; then
        print_success "Using existing cluster"
        return 0
    fi
    
    # Try to setup kind if available
    if command -v kind >/dev/null 2>&1; then
        print_status "Setting up kind cluster..."
        kind create cluster --name ci-k6-test --wait 300s
        export KUBECONFIG="$(kind get kubeconfig-path --name=ci-k6-test)"
        kubectl wait --for=condition=Ready nodes --all --timeout=300s
        print_success "Kind cluster ready"
    else
        print_error "No Kubernetes cluster available and kind not installed"
        print_status "Please ensure a Kubernetes cluster is available in your CI environment"
        exit 1
    fi
}

# Function to install k6-operator
install_operator() {
    print_status "Installing k6-operator..."
    kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
    kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
    print_success "k6-operator installed"
}

# Function to apply manifests
apply_manifests() {
    print_status "Applying k6 manifests..."
    kubectl apply -f k8s/namespace.yaml
    kubectl -n "$NAMESPACE" apply -f k8s/scripts-configmap.yaml
    kubectl -n "$NAMESPACE" apply -f k8s/testrun-basic.yaml
    print_success "Manifests applied"
}

# Function to wait for test completion
wait_for_completion() {
    print_status "Waiting for test completion..."
    
    local expected_parallelism
    expected_parallelism=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.spec.parallelism}' 2>/dev/null || echo "3")
    
    local start_time
    start_time=$(date +%s)
    local timeout=$TEST_TIMEOUT
    
    while true; do
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "Test timed out after $timeout seconds"
            return 1
        fi
        
        local testrun_status
        testrun_status=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        local completed_pods
        completed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Completed" || echo "0")
        
        local failed_pods
        failed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Error\|CrashLoopBackOff\|Failed" || echo "0")
        
        print_status "Status: $testrun_status | Completed: $completed_pods | Failed: $failed_pods | Elapsed: ${elapsed}s"
        
        if [ "$testrun_status" = "Completed" ] && [ "$completed_pods" -eq "$expected_parallelism" ]; then
            print_success "Test completed successfully!"
            return 0
        fi
        
        if [ "$testrun_status" = "Failed" ] || [ "$failed_pods" -gt 0 ]; then
            print_error "Test failed!"
            return 1
        fi
        
        sleep $POLL_INTERVAL
    done
}

# Function to collect results
collect_results() {
    print_status "Collecting test results..."
    
    # Get TestRun status
    local testrun_status
    testrun_status=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
    
    # Get pod status
    local total_pods
    total_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | wc -l)
    
    local completed_pods
    completed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Completed" || echo "0")
    
    local failed_pods
    failed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Error\|CrashLoopBackOff\|Failed" || echo "0")
    
    # Print results
    echo "TestRun Status: $testrun_status"
    echo "Total Pods: $total_pods"
    echo "Completed Pods: $completed_pods"
    echo "Failed Pods: $failed_pods"
    
    # Print pod logs
    print_status "Pod logs:"
    kubectl -n "$NAMESPACE" get pods --no-headers -o custom-columns=":metadata.name" | while read -r pod; do
        echo "=== Logs from $pod ==="
        kubectl -n "$NAMESPACE" logs "$pod" --tail=20 || echo "Could not get logs for $pod"
        echo ""
    done
    
    # Return success/failure
    if [ "$testrun_status" = "Completed" ] && [ "$completed_pods" -gt 0 ] && [ "$failed_pods" -eq 0 ]; then
        print_success "✅ k6 distributed test passed!"
        return 0
    else
        print_error "❌ k6 distributed test failed!"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    kubectl -n "$NAMESPACE" delete testrun k6-basic-test --ignore-not-found=true
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    
    if is_ci && [ -n "$KUBECONFIG" ] && [[ "$KUBECONFIG" == *"kind"* ]]; then
        kind delete cluster --name ci-k6-test --ignore-not-found=true
    fi
}

# Main function
main() {
    print_status "Starting k6 CI test..."
    
    # Setup
    setup_ci_cluster
    install_operator
    apply_manifests
    
    # Run test
    if wait_for_completion; then
        if collect_results; then
            print_success "🎉 All tests passed!"
            cleanup
            exit 0
        else
            print_error "❌ Test verification failed!"
            cleanup
            exit 1
        fi
    else
        print_error "❌ Test did not complete!"
        collect_results
        cleanup
        exit 1
    fi
}

# Set up exit handler
trap cleanup EXIT

# Run main function
main "$@"
