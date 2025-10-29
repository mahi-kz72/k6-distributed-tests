#!/bin/bash

# k6 Distributed Testing Setup Verification Script
# This script automatically sets up a local Kubernetes cluster and verifies the k6 setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="k6-test-cluster"
NAMESPACE="k6-tests"
TEST_TIMEOUT=900  # 15 minutes in seconds
POLL_INTERVAL=10  # 10 seconds between status checks

# Global variables
CLUSTER_TYPE=""
KUBECONFIG_BACKUP=""
CLEANUP_ON_EXIT=true

# Function to print colored output
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

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [CLUSTER_TYPE] [OPTIONS]"
    echo ""
    echo "CLUSTER_TYPE:"
    echo "  kind       Use kind (Kubernetes in Docker) - default"
    echo "  minikube   Use minikube"
    echo ""
    echo "OPTIONS:"
    echo "  --no-cleanup    Don't clean up resources after test"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 kind"
    echo "  $0 minikube"
    echo "  $0 kind --no-cleanup"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
    
    # Check if kubectl is available
    if ! command_exists kubectl; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl is available"
    
    # Check if jq is available
    if ! command_exists jq; then
        print_error "jq is not installed. Please install jq first."
        print_status "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    print_success "jq is available"
    
    # Check if required files exist
    local required_files=(
        "k8s/namespace.yaml"
        "k8s/scripts-configmap.yaml"
        "k8s/testrun-basic.yaml"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    print_success "All required manifest files found"
}

# Function to detect and setup cluster
setup_cluster() {
    print_header "Setting Up Kubernetes Cluster"
    
    # Determine cluster type
    if [ "$1" = "minikube" ]; then
        CLUSTER_TYPE="minikube"
    else
        CLUSTER_TYPE="kind"
    fi
    
    print_status "Using cluster type: $CLUSTER_TYPE"
    
    # Backup current kubeconfig
    if [ -n "$KUBECONFIG" ]; then
        KUBECONFIG_BACKUP="$KUBECONFIG"
    else
        KUBECONFIG_BACKUP="$HOME/.kube/config"
    fi
    
    if [ "$CLUSTER_TYPE" = "kind" ]; then
        setup_kind_cluster
    else
        setup_minikube_cluster
    fi
}

# Function to setup kind cluster
setup_kind_cluster() {
    print_status "Setting up kind cluster..."
    
    # Check if kind is installed
    if ! command_exists kind; then
        print_error "kind is not installed. Please install kind first."
        print_status "Install with: go install sigs.k8s.io/kind@latest"
        print_status "Or download from: https://kind.sigs.k8s.io/docs/user/quick-start/"
        exit 1
    fi
    
    # Check if cluster already exists
    if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
        print_warning "Cluster $CLUSTER_NAME already exists. Deleting it..."
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
    
    print_success "Kind cluster is ready"
}

# Function to setup minikube cluster
setup_minikube_cluster() {
    print_status "Setting up minikube cluster..."
    
    # Check if minikube is installed
    if ! command_exists minikube; then
        print_error "minikube is not installed. Please install minikube first."
        print_status "Install with: brew install minikube (macOS) or visit https://minikube.sigs.k8s.io/docs/start/"
        exit 1
    fi
    
    # Check if cluster already exists
    if minikube status --profile="$CLUSTER_NAME" >/dev/null 2>&1; then
        print_warning "Minikube cluster $CLUSTER_NAME already exists. Stopping it..."
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
    
    print_success "Minikube cluster is ready"
}

# Function to install k6-operator
install_k6_operator() {
    print_header "Installing k6-operator"
    
    print_status "Installing k6-operator..."
    kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
    
    print_status "Waiting for k6-operator to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system
    
    print_success "k6-operator is ready"
}

# Function to apply k6 manifests
apply_k6_manifests() {
    print_header "Applying k6 Manifests"
    
    print_status "Creating namespace..."
    kubectl apply -f k8s/namespace.yaml
    
    print_status "Applying test scripts ConfigMap..."
    kubectl -n "$NAMESPACE" apply -f k8s/scripts-configmap.yaml
    
    print_status "Applying basic test TestRun..."
    kubectl -n "$NAMESPACE" apply -f k8s/testrun-basic.yaml
    
    print_success "All manifests applied successfully"
}

# Function to get expected parallelism from TestRun
get_expected_parallelism() {
    local parallelism
    parallelism=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.spec.parallelism}' 2>/dev/null || echo "3")
    echo "${parallelism:-3}"
}

# Function to wait for TestRun completion
wait_for_testrun_completion() {
    print_header "Waiting for TestRun Completion"
    
    local expected_parallelism
    expected_parallelism=$(get_expected_parallelism)
    print_status "Expected parallelism: $expected_parallelism"
    
    local start_time
    start_time=$(date +%s)
    local timeout=$TEST_TIMEOUT
    
    while true; do
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "TestRun timed out after $timeout seconds"
            return 1
        fi
        
        # Check TestRun status
        local testrun_status
        testrun_status=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        # Check pod count
        local pod_count
        pod_count=$(kubectl -n "$NAMESPACE" get pods --no-headers | wc -l)
        
        # Check completed pods
        local completed_pods
        completed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Completed" || echo "0")
        
        # Check failed pods
        local failed_pods
        failed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Error\|CrashLoopBackOff\|Failed" || echo "0")
        
        print_status "Status: $testrun_status | Pods: $pod_count/$expected_parallelism | Completed: $completed_pods | Failed: $failed_pods | Elapsed: ${elapsed}s"
        
        # Check if TestRun is completed
        if [ "$testrun_status" = "Completed" ] && [ "$completed_pods" -eq "$expected_parallelism" ]; then
            print_success "TestRun completed successfully!"
            return 0
        fi
        
        # Check if TestRun failed
        if [ "$testrun_status" = "Failed" ] || [ "$failed_pods" -gt 0 ]; then
            print_error "TestRun failed or pods are in error state"
            return 1
        fi
        
        sleep $POLL_INTERVAL
    done
}

# Function to verify test results
verify_test_results() {
    print_header "Verifying Test Results"
    
    local expected_parallelism
    expected_parallelism=$(get_expected_parallelism)
    
    # Check TestRun status
    local testrun_status
    testrun_status=$(kubectl -n "$NAMESPACE" get testrun k6-basic-test -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
    
    # Check pod status
    local total_pods
    total_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | wc -l)
    
    local completed_pods
    completed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Completed" || echo "0")
    
    local failed_pods
    failed_pods=$(kubectl -n "$NAMESPACE" get pods --no-headers | grep -c "Error\|CrashLoopBackOff\|Failed" || echo "0")
    
    print_status "TestRun Status: $testrun_status"
    print_status "Total Pods: $total_pods"
    print_status "Completed Pods: $completed_pods"
    print_status "Failed Pods: $failed_pods"
    print_status "Expected Parallelism: $expected_parallelism"
    
    # Verify results
    if [ "$testrun_status" = "Completed" ] && [ "$completed_pods" -eq "$expected_parallelism" ] && [ "$failed_pods" -eq 0 ]; then
        print_success "✅ k6-operator setup verified successfully!"
        print_success "$completed_pods pods completed the distributed test."
        return 0
    else
        print_error "❌ TestRun verification failed!"
        return 1
    fi
}

# Function to print pod logs
print_pod_logs() {
    print_header "Pod Logs"
    
    local pods
    pods=$(kubectl -n "$NAMESPACE" get pods --no-headers -o custom-columns=":metadata.name")
    
    for pod in $pods; do
        print_status "Logs from pod: $pod"
        echo "----------------------------------------"
        kubectl -n "$NAMESPACE" logs "$pod" --tail=50 || print_warning "Could not get logs for pod $pod"
        echo "----------------------------------------"
        echo ""
    done
}

# Function to print diagnostics
print_diagnostics() {
    print_header "Diagnostics"
    
    print_status "TestRun details:"
    kubectl -n "$NAMESPACE" describe testrun k6-basic-test
    
    echo ""
    print_status "Pod details:"
    kubectl -n "$NAMESPACE" get pods -o wide
    
    echo ""
    print_status "Events:"
    kubectl -n "$NAMESPACE" get events --sort-by='.lastTimestamp'
    
    echo ""
    print_pod_logs
}

# Function to cleanup resources
cleanup_resources() {
    if [ "$CLEANUP_ON_EXIT" = true ]; then
        print_header "Cleaning Up Resources"
        
        print_status "Deleting TestRun..."
        kubectl -n "$NAMESPACE" delete testrun k6-basic-test --ignore-not-found=true
        
        print_status "Deleting namespace..."
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        
        if [ "$CLUSTER_TYPE" = "kind" ]; then
            print_status "Deleting kind cluster..."
            kind delete cluster --name "$CLUSTER_NAME"
        else
            print_status "Stopping minikube cluster..."
            minikube stop --profile="$CLUSTER_NAME"
        fi
        
        # Restore kubeconfig
        if [ -n "$KUBECONFIG_BACKUP" ]; then
            export KUBECONFIG="$KUBECONFIG_BACKUP"
        fi
        
        print_success "Cleanup completed"
    else
        print_warning "Cleanup skipped (--no-cleanup flag used)"
        print_status "To clean up manually:"
        if [ "$CLUSTER_TYPE" = "kind" ]; then
            print_status "  kind delete cluster --name $CLUSTER_NAME"
        else
            print_status "  minikube stop --profile=$CLUSTER_NAME"
        fi
    fi
}

# Function to handle script exit
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "Script failed with exit code $exit_code"
        print_diagnostics
    fi
    cleanup_resources
    exit $exit_code
}

# Set up exit handler
trap cleanup_on_exit EXIT

# Main function
main() {
    print_header "k6 Distributed Testing Setup Verification"
    
    # Parse arguments
    local cluster_type="kind"
    while [[ $# -gt 0 ]]; do
        case $1 in
            kind|minikube)
                cluster_type="$1"
                shift
                ;;
            --no-cleanup)
                CLEANUP_ON_EXIT=false
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Run verification steps
    check_prerequisites
    setup_cluster "$cluster_type"
    install_k6_operator
    apply_k6_manifests
    
    if wait_for_testrun_completion; then
        if verify_test_results; then
            print_success "🎉 All tests passed! k6 distributed testing setup is working correctly."
            exit 0
        else
            print_error "❌ Test verification failed!"
            print_diagnostics
            exit 1
        fi
    else
        print_error "❌ TestRun did not complete within timeout!"
        print_diagnostics
        exit 1
    fi
}

# Run main function
main "$@"
