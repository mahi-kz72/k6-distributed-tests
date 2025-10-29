# Makefile for k6 Distributed Testing with Kubernetes
# This provides convenient commands for managing k6 tests

.PHONY: help install-operator check-operator create-ns apply-scripts apply-basic apply-advanced watch-basic watch-advanced logs-basic logs-advanced clean-basic clean-advanced clean-all scale-basic scale-advanced status

# Default target
help: ## Show this help message
	@echo "k6 Distributed Testing with Kubernetes"
	@echo "======================================"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Operator management
install-operator: ## Install k6-operator
	@echo "Installing k6-operator..."
	kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
	@echo "Waiting for operator to be ready..."
	kubectl wait --for=condition=available --timeout=300s deployment/k6-operator-controller-manager -n k6-operator-system

check-operator: ## Check if k6-operator is running
	@echo "Checking k6-operator status..."
	kubectl get pods -n k6-operator-system
	@echo ""
	@echo "Checking CRDs..."
	kubectl get crd | grep k6

# Namespace and basic setup
create-ns: ## Create k6-tests namespace
	kubectl apply -f k8s/namespace.yaml

apply-scripts: ## Apply test scripts ConfigMap
	kubectl -n k6-tests apply -f k8s/scripts-configmap.yaml

# Test execution
apply-basic: ## Run basic test (3 parallel pods)
	kubectl -n k6-tests apply -f k8s/testrun-basic.yaml

apply-advanced: ## Run advanced test (5 parallel pods)
	kubectl -n k6-tests apply -f k8s/testrun-advanced.yaml

# Kustomize-based execution
apply-basic-kustomize: ## Run basic test using Kustomize
	kubectl apply -k k8s/overlays/basic

apply-advanced-kustomize: ## Run advanced test using Kustomize
	kubectl apply -k k8s/overlays/advanced

# Scaling with different parallelism levels
scale-basic-3: ## Run basic test with 3 pods
	kubectl apply -k k8s/overlays/basic/scale-3

scale-basic-5: ## Run basic test with 5 pods
	kubectl apply -k k8s/overlays/basic/scale-5

scale-basic-10: ## Run basic test with 10 pods
	kubectl apply -k k8s/overlays/basic/scale-10

scale-advanced-5: ## Run advanced test with 5 pods
	kubectl apply -k k8s/overlays/advanced/scale-5

scale-advanced-10: ## Run advanced test with 10 pods
	kubectl apply -k k8s/overlays/advanced/scale-10

scale-advanced-20: ## Run advanced test with 20 pods
	kubectl apply -k k8s/overlays/advanced/scale-20

# Monitoring and logs
watch-basic: ## Watch basic test progress
	kubectl -n k6-tests get testruns,pods -w

watch-advanced: ## Watch advanced test progress
	kubectl -n k6-tests get testruns,pods -w

logs-basic: ## Show logs from basic test pods
	kubectl -n k6-tests logs -l testrun=k6-basic-test --tail=50

logs-advanced: ## Show logs from advanced test pods
	kubectl -n k6-tests logs -l testrun=k6-advanced-test --tail=50

status: ## Show current test status
	@echo "TestRuns:"
	kubectl -n k6-tests get testruns
	@echo ""
	@echo "Pods:"
	kubectl -n k6-tests get pods
	@echo ""
	@echo "Services:"
	kubectl -n k6-tests get services

# Cleanup
clean-basic: ## Clean up basic test
	kubectl -n k6-tests delete testrun k6-basic-test --ignore-not-found=true
	kubectl -n k6-tests delete service k6-basic-test-service --ignore-not-found=true

clean-advanced: ## Clean up advanced test
	kubectl -n k6-tests delete testrun k6-advanced-test --ignore-not-found=true
	kubectl -n k6-tests delete service k6-advanced-test-service --ignore-not-found=true

clean-all: ## Clean up all tests and namespace
	kubectl -n k6-tests delete testruns --all
	kubectl -n k6-tests delete services --all
	kubectl -n k6-tests delete configmaps --all
	kubectl delete namespace k6-tests --ignore-not-found=true

# Development and debugging
debug-basic: ## Debug basic test (describe TestRun and pods)
	@echo "TestRun details:"
	kubectl -n k6-tests describe testrun k6-basic-test
	@echo ""
	@echo "Pod details:"
	kubectl -n k6-tests describe pods -l testrun=k6-basic-test

debug-advanced: ## Debug advanced test (describe TestRun and pods)
	@echo "TestRun details:"
	kubectl -n k6-tests describe testrun k6-advanced-test
	@echo ""
	@echo "Pod details:"
	kubectl -n k6-tests describe pods -l testrun=k6-advanced-test

# Quick start commands
quick-start: create-ns apply-scripts apply-basic ## Quick start: create namespace, apply scripts, and run basic test

quick-start-advanced: create-ns apply-scripts apply-advanced ## Quick start: create namespace, apply scripts, and run advanced test

# Validation
validate: ## Validate all YAML files
	@echo "Validating Kubernetes manifests..."
	kubectl apply --dry-run=client -f k8s/namespace.yaml
	kubectl apply --dry-run=client -f k8s/scripts-configmap.yaml
	kubectl apply --dry-run=client -f k8s/testrun-basic.yaml
	kubectl apply --dry-run=client -f k8s/testrun-advanced.yaml
	@echo "All manifests are valid!"

# Output configuration
setup-outputs: ## Setup output configurations (InfluxDB, etc.)
	@echo "Setting up output configurations..."
	kubectl apply -f k8s/outputs/

# Complete workflow examples
workflow-basic: install-operator create-ns apply-scripts apply-basic watch-basic ## Complete workflow for basic test

workflow-advanced: install-operator create-ns apply-scripts apply-advanced watch-advanced ## Complete workflow for advanced test

# Verification and testing
verify-setup: ## Verify k6 setup with kind cluster
	./verify-k6-setup.sh kind

verify-setup-minikube: ## Verify k6 setup with minikube cluster
	./verify-k6-setup.sh minikube

verify-setup-no-cleanup: ## Verify k6 setup without cleanup
	./verify-k6-setup.sh kind --no-cleanup

quick-verify: ## Quick verification (assumes cluster exists)
	./quick-verify.sh

ci-test: ## Run CI test (for automated testing)
	./ci-test.sh

# Cluster management
setup-kind: ## Setup kind cluster for testing
	./scripts/setup-kind.sh

setup-minikube: ## Setup minikube cluster for testing
	./scripts/setup-minikube.sh
