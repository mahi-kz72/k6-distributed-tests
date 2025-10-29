#!/bin/bash

# k6 Distributed Test Runner Script
# This script provides easy commands to run distributed k6 tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
WORKERS=2
TEST_SCRIPT="test.js"
CLEANUP=false

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -w, --workers NUM     Number of worker nodes (default: 2)"
    echo "  -s, --script SCRIPT   Test script to run (default: test.js)"
    echo "  -c, --cleanup         Clean up containers and volumes after test"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with 2 workers using test.js"
    echo "  $0 -w 5 -s advanced-test.js          # Run with 5 workers using advanced-test.js"
    echo "  $0 -w 3 -c                           # Run with 3 workers and cleanup after"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -s|--script)
            TEST_SCRIPT="$2"
            shift 2
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        -h|--help)
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

# Validate test script exists
if [ ! -f "scripts/$TEST_SCRIPT" ]; then
    print_error "Test script 'scripts/$TEST_SCRIPT' not found!"
    exit 1
fi

# Create results directory if it doesn't exist
mkdir -p results

print_status "Starting k6 distributed test with $WORKERS workers using script: $TEST_SCRIPT"

# Stop any existing containers
print_status "Stopping any existing k6 containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Start the test
print_status "Starting master and $WORKERS worker nodes..."
docker-compose up --scale worker=$WORKERS -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if master is healthy
print_status "Checking master node health..."
if docker-compose exec master curl -f http://localhost:6565/v1/status >/dev/null 2>&1; then
    print_success "Master node is healthy"
else
    print_error "Master node is not responding"
    docker-compose logs master
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

# Follow logs
print_status "Following test execution logs (Ctrl+C to stop following logs but keep containers running)..."
print_warning "Press Ctrl+C to stop following logs. Containers will continue running."
print_warning "Use 'docker-compose logs -f' to follow logs again."
print_warning "Use 'docker-compose down' to stop all containers."

# Follow logs with timeout
timeout 300 docker-compose logs -f || true

# Show test results
print_status "Test completed. Checking results..."

if [ -f "results/results.json" ]; then
    print_success "Results saved to results/results.json"
    print_status "Results summary:"
    jq '.metrics | {checks: .checks.values, http_req_duration: .http_req_duration.values, http_req_failed: .http_req_failed.values}' results/results.json 2>/dev/null || cat results/results.json
else
    print_warning "No results.json found. Check container logs for details."
fi

if [ -f "results/summary.json" ]; then
    print_success "Summary saved to results/summary.json"
fi

# Cleanup if requested
if [ "$CLEANUP" = true ]; then
    print_status "Cleaning up containers and volumes..."
    docker-compose down -v --remove-orphans
    print_success "Cleanup completed"
fi

print_success "Test execution completed!"
print_status "To view logs: docker-compose logs -f"
print_status "To stop containers: docker-compose down"
print_status "To scale workers: docker-compose up --scale worker=N"
