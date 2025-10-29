#!/bin/bash

# k6 Distributed Test Setup Validation Script
# Run this script to validate your k6 distributed test setup

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

print_status "Validating k6 distributed test setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    print_status "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

print_success "Docker is installed"

# Check if Docker Compose is available
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    print_success "Docker Compose (v2) is available"
elif docker-compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    print_success "Docker Compose (v1) is available"
else
    print_error "Docker Compose is not available"
    print_status "Please install Docker Compose or use Docker Desktop"
    exit 1
fi

# Validate Docker Compose configuration
print_status "Validating Docker Compose configuration..."
if $COMPOSE_CMD config &> /dev/null; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration is invalid"
    $COMPOSE_CMD config
    exit 1
fi

# Check if required files exist
print_status "Checking required files..."

required_files=(
    "docker-compose.yml"
    "scripts/test.js"
    "scripts/advanced-test.js"
    "run-test.sh"
    "README.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
        exit 1
    fi
done

# Check if results directory exists
if [ -d "results" ]; then
    print_success "✓ results directory exists"
else
    print_warning "results directory doesn't exist, creating it..."
    mkdir -p results
    print_success "✓ results directory created"
fi

# Check if run-test.sh is executable
if [ -x "run-test.sh" ]; then
    print_success "✓ run-test.sh is executable"
else
    print_warning "run-test.sh is not executable, fixing..."
    chmod +x run-test.sh
    print_success "✓ run-test.sh is now executable"
fi

# Test Docker Compose syntax
print_status "Testing Docker Compose syntax..."
if $COMPOSE_CMD config --quiet; then
    print_success "✓ Docker Compose syntax is valid"
else
    print_error "✗ Docker Compose syntax is invalid"
    exit 1
fi

# Check if k6 image is available
print_status "Checking if k6 Docker image is available..."
if docker image inspect grafana/k6:latest &> /dev/null; then
    print_success "✓ k6 Docker image is available locally"
else
    print_warning "k6 Docker image not found locally, will be pulled on first run"
fi

# Test network creation
print_status "Testing Docker network creation..."
if docker network ls | grep -q k6-network; then
    print_warning "k6-network already exists, cleaning up..."
    docker network rm k6-network 2>/dev/null || true
fi

# Create test network
if docker network create k6-network --driver bridge --subnet 172.20.0.0/16 &> /dev/null; then
    print_success "✓ Docker network creation test passed"
    docker network rm k6-network
else
    print_error "✗ Failed to create Docker network"
    exit 1
fi

print_success "Setup validation completed successfully!"
print_status ""
print_status "You can now run your k6 distributed tests:"
print_status "  ./run-test.sh                    # Basic test with 2 workers"
print_status "  ./run-test.sh -w 5               # Test with 5 workers"
print_status "  ./run-test.sh -s advanced-test.js # Advanced test"
print_status "  $COMPOSE_CMD up --scale worker=3  # Manual Docker Compose"
print_status ""
print_status "For more information, see README.md"
