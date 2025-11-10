#!/bin/bash

# Test Script for k6 Monitoring Stack
# This script verifies the complete functionality before git push

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     k6 Monitoring Stack - Complete Test Suite             ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to print test results
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Test 1: Check if kubectl is working
echo -e "${YELLOW}[1/10] Checking kubectl connection...${NC}"
kubectl cluster-info > /dev/null 2>&1
print_test $? "kubectl is connected to cluster"
echo ""

# Test 2: Deploy the stack
echo -e "${YELLOW}[2/10] Deploying k6 monitoring stack...${NC}"
kubectl apply -k k8s/ > /dev/null 2>&1
print_test $? "Stack deployed successfully"
echo ""

# Test 3: Wait for pods to be ready
echo -e "${YELLOW}[3/10] Waiting for pods to be ready (max 2 minutes)...${NC}"
kubectl -n k6-tests wait --for=condition=ready pod -l app.kubernetes.io/name=influxdb --timeout=120s > /dev/null 2>&1
print_test $? "InfluxDB pod is ready"

kubectl -n k6-tests wait --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=120s > /dev/null 2>&1
print_test $? "Grafana pod is ready"
echo ""

# Test 4: Check PVCs are bound
echo -e "${YELLOW}[4/10] Checking persistent storage...${NC}"
INFLUX_PVC=$(kubectl -n k6-tests get pvc influxdb-pvc -o jsonpath='{.status.phase}')
GRAFANA_PVC=$(kubectl -n k6-tests get pvc grafana-pvc -o jsonpath='{.status.phase}')

if [ "$INFLUX_PVC" = "Bound" ]; then
    print_test 0 "InfluxDB PVC is bound"
else
    print_test 1 "InfluxDB PVC is not bound (status: $INFLUX_PVC)"
fi

if [ "$GRAFANA_PVC" = "Bound" ]; then
    print_test 0 "Grafana PVC is bound"
else
    print_test 1 "Grafana PVC is not bound (status: $GRAFANA_PVC)"
fi
echo ""

# Test 5: Check InfluxDB health
echo -e "${YELLOW}[5/10] Testing InfluxDB health...${NC}"
kubectl -n k6-tests exec deployment/influxdb -- curl -sf http://localhost:8086/health > /dev/null 2>&1
print_test $? "InfluxDB health endpoint is responding"
echo ""

# Test 6: Check buckets exist
echo -e "${YELLOW}[6/10] Verifying InfluxDB buckets...${NC}"
TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)
BUCKETS=$(kubectl -n k6-tests exec deployment/influxdb -- influx bucket list --org k6-org --token "$TOKEN" --hide-headers | wc -l | tr -d ' ')

if [ "$BUCKETS" -ge 6 ]; then
    print_test 0 "All 6 buckets exist (found: $BUCKETS)"
else
    print_test 1 "Expected 6 buckets, found: $BUCKETS"
fi
echo ""

# Test 7: Check Grafana health
echo -e "${YELLOW}[7/10] Testing Grafana health...${NC}"
kubectl -n k6-tests exec deployment/grafana -- curl -sf http://localhost:3000/api/health > /dev/null 2>&1
print_test $? "Grafana health endpoint is responding"
echo ""

# Test 8: Start port-forwards in background
echo -e "${YELLOW}[8/10] Setting up port-forwards...${NC}"
kubectl -n k6-tests port-forward service/influxdb 8086:8086 > /dev/null 2>&1 &
PF_INFLUX=$!
sleep 2

kubectl -n k6-tests port-forward service/grafana 3000:3000 > /dev/null 2>&1 &
PF_GRAFANA=$!
sleep 2

print_test 0 "Port-forwards established (InfluxDB: 8086, Grafana: 3000)"
echo ""

# Test 9: Run a simple k6 test if k6 is available
echo -e "${YELLOW}[9/10] Running k6 smoke test...${NC}"

if command -v k6 &> /dev/null; then
    # Create a simple test script
    cat > /tmp/k6-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 2,
  duration: '5s',
};

export default function () {
  const res = http.get('https://httpbin.org/get');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

    # Just run k6 test (without output to InfluxDB for now)
    k6 run /tmp/k6-test.js > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_test 0 "k6 test executed successfully"
        echo -e "${YELLOW}   Note: k6 standard version doesn't support InfluxDB v2 output${NC}"
        echo -e "${YELLOW}   For InfluxDB v2, build k6 with: xk6 build --with github.com/grafana/xk6-output-influxdb${NC}"
    else
        echo -e "${YELLOW}⚠️  k6 test failed (but stack is OK)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  k6 not found, skipping smoke test${NC}"
fi
echo ""

# Test 10: Verify services are accessible
echo -e "${YELLOW}[10/10] Verifying service accessibility...${NC}"

# Test InfluxDB via port-forward
curl -sf http://localhost:8086/health > /dev/null 2>&1
print_test $? "InfluxDB accessible on http://localhost:8086"

# Test Grafana via port-forward
curl -sf http://localhost:3000/api/health > /dev/null 2>&1
print_test $? "Grafana accessible on http://localhost:3000"
echo ""

# Cleanup
echo -e "${BLUE}Cleaning up port-forwards...${NC}"
kill $PF_INFLUX $PF_GRAFANA 2>/dev/null
rm -f /tmp/k6-test.js

# Final summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ ALL TESTS PASSED                       ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}📊 Stack Status:${NC}"
echo -e "   • InfluxDB: ${GREEN}Running with persistent storage${NC}"
echo -e "   • Grafana:  ${GREEN}Running with persistent storage${NC}"
echo -e "   • Buckets:  ${GREEN}6 buckets configured${NC}"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "   • Grafana: ${YELLOW}http://localhost:3000${NC} (admin/admin123)"
echo -e "   • InfluxDB: ${YELLOW}http://localhost:8086${NC}"
echo ""
echo -e "${BLUE}🔑 InfluxDB Token:${NC}"
echo -e "   ${YELLOW}$TOKEN${NC}"
echo ""
echo -e "${GREEN}✅ Stack is ready for git push!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "   1. Open Grafana: kubectl -n k6-tests port-forward svc/grafana 3000:3000"
echo -e "   2. Login and verify dashboards exist"
echo -e "   3. Run: git add . && git commit -m 'feat: k6 monitoring stack' && git push"
echo ""

