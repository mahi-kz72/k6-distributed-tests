#!/bin/bash

# Quick test script to verify the k6 setup without Docker
# This script checks file structure and basic configuration

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Running quick validation of k6 distributed test setup..."

# Check project structure
print_status "Checking project structure..."

required_files=(
    "docker-compose.yml"
    "scripts/test.js"
    "scripts/advanced-test.js"
    "run-test.sh"
    "validate-setup.sh"
    "README.md"
    ".gitignore"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    print_success "All required files are present"
else
    print_error "$missing_files files are missing"
    exit 1
fi

# Check directory structure
print_status "Checking directory structure..."

if [ -d "scripts" ]; then
    print_success "✓ scripts/ directory exists"
else
    print_error "✗ scripts/ directory missing"
    exit 1
fi

if [ -d "results" ]; then
    print_success "✓ results/ directory exists"
else
    print_warning "results/ directory missing, creating..."
    mkdir -p results
    print_success "✓ results/ directory created"
fi

# Check file permissions
print_status "Checking file permissions..."

if [ -x "run-test.sh" ]; then
    print_success "✓ run-test.sh is executable"
else
    print_warning "run-test.sh not executable, fixing..."
    chmod +x run-test.sh
    print_success "✓ run-test.sh is now executable"
fi

if [ -x "validate-setup.sh" ]; then
    print_success "✓ validate-setup.sh is executable"
else
    print_warning "validate-setup.sh not executable, fixing..."
    chmod +x validate-setup.sh
    print_success "✓ validate-setup.sh is now executable"
fi

# Check Docker Compose YAML syntax (basic validation)
print_status "Validating Docker Compose YAML syntax..."

# Check for basic YAML structure
if grep -q "^version:" docker-compose.yml && grep -q "^services:" docker-compose.yml; then
    print_success "✓ Docker Compose YAML has required sections"
else
    print_error "✗ Docker Compose YAML is malformed"
    exit 1
fi

# Check for required services
if grep -q "master:" docker-compose.yml && grep -q "worker:" docker-compose.yml; then
    print_success "✓ Docker Compose has master and worker services"
else
    print_error "✗ Docker Compose missing required services"
    exit 1
fi

# Check test scripts syntax (basic JavaScript validation)
print_status "Validating test scripts..."

for script in scripts/*.js; do
    if [ -f "$script" ]; then
        if grep -q "export default function" "$script" && grep -q "export const options" "$script"; then
            print_success "✓ $script has required k6 exports"
        else
            print_warning "⚠ $script may be missing required k6 exports"
        fi
    fi
done

print_success "Quick validation completed!"
print_status ""
print_status "Next steps:"
print_status "1. Install Docker Desktop if not already installed"
print_status "2. Run: ./validate-setup.sh"
print_status "3. Run: ./run-test.sh"
print_status ""
print_status "For detailed instructions, see README.md"
