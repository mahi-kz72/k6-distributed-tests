#!/bin/bash

# k6 Monitoring Stack - Complete Setup Script
# This script deploys InfluxDB + Grafana + pre-configured dashboard
# Similar to the docker-compose setup mentioned in k6 documentation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     k6 Monitoring Stack - Complete Setup                  ║${NC}"
echo -e "${BLUE}║     InfluxDB v2 + Grafana + Pre-configured Dashboard      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Deploy Kubernetes stack
print_status "Step 1/6: Deploying InfluxDB + Grafana to Kubernetes..."
kubectl apply -k k8s/
print_success "Stack deployed"
echo ""

# Step 2: Wait for pods to be ready
print_status "Step 2/6: Waiting for pods to be ready (max 2 minutes)..."
kubectl -n k6-tests wait --for=condition=ready pod -l app.kubernetes.io/name=influxdb --timeout=120s
kubectl -n k6-tests wait --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=120s
print_success "All pods are ready"
echo ""

# Step 3: Port-forward services
print_status "Step 3/6: Setting up port-forwards..."

# Kill any existing port-forwards
pkill -f "port-forward.*influxdb" 2>/dev/null || true
pkill -f "port-forward.*grafana" 2>/dev/null || true
sleep 2

# Start new port-forwards
kubectl -n k6-tests port-forward service/influxdb 8086:8086 > /dev/null 2>&1 &
INFLUX_PF_PID=$!

kubectl -n k6-tests port-forward service/grafana 3000:3000 > /dev/null 2>&1 &
GRAFANA_PF_PID=$!

sleep 3
print_success "Port-forwards established"
echo "  📍 InfluxDB: http://localhost:8086"
echo "  📍 Grafana:  http://localhost:3000"
echo ""

# Step 4: Get credentials
print_status "Step 4/6: Retrieving credentials from Kubernetes secrets..."
INFLUX_TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)
INFLUX_ORG=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.org}' | base64 -d)
INFLUX_BUCKET=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.bucket}' | base64 -d)

print_success "Credentials retrieved"
echo "  🔑 Organization: $INFLUX_ORG"
echo "  🔑 Default Bucket: $INFLUX_BUCKET"
echo ""

# Step 5: Wait for Grafana to be fully ready
print_status "Step 5/6: Waiting for Grafana to be fully ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Grafana is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Grafana health check timeout"
        kill $INFLUX_PF_PID $GRAFANA_PF_PID 2>/dev/null
        exit 1
    fi
    sleep 2
done
echo ""

# Step 6: Configure Grafana datasource and import dashboard
print_status "Step 6/6: Configuring Grafana datasource and importing dashboard..."

# Check if datasource already exists
DATASOURCE_EXISTS=$(curl -s -u admin:admin123 http://localhost:3000/api/datasources/name/InfluxDB-k6 -o /dev/null -w "%{http_code}")

if [ "$DATASOURCE_EXISTS" != "200" ]; then
    # Create InfluxDB datasource
    curl -s -X POST http://localhost:3000/api/datasources \
        -u admin:admin123 \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"InfluxDB-k6\",
            \"type\": \"influxdb\",
            \"access\": \"proxy\",
            \"url\": \"http://influxdb.k6-tests.svc:8086\",
            \"isDefault\": true,
            \"jsonData\": {
                \"version\": \"Flux\",
                \"organization\": \"$INFLUX_ORG\",
                \"defaultBucket\": \"$INFLUX_BUCKET\",
                \"tlsSkipVerify\": true
            },
            \"secureJsonData\": {
                \"token\": \"$INFLUX_TOKEN\"
            }
        }" > /dev/null
    print_success "InfluxDB datasource created"
else
    print_warning "InfluxDB datasource already exists, skipping creation"
fi

# Get datasource UID
DATASOURCE_UID=$(curl -s -u admin:admin123 http://localhost:3000/api/datasources/name/InfluxDB-k6 | grep -o '"uid":"[^"]*' | cut -d'"' -f4)

if [ -z "$DATASOURCE_UID" ]; then
    print_error "Failed to get datasource UID"
    kill $INFLUX_PF_PID $GRAFANA_PF_PID 2>/dev/null
    exit 1
fi

print_success "Datasource UID: $DATASOURCE_UID"

# Update dashboard template with correct datasource UID
DASHBOARD_JSON=$(cat k6-dashboard-template.json | sed "s/\"uid\": \"influxdb-k6\"/\"uid\": \"$DATASOURCE_UID\"/g")

# Import dashboard
IMPORT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/dashboards/db \
    -u admin:admin123 \
    -H "Content-Type: application/json" \
    -d "{
        \"dashboard\": $DASHBOARD_JSON,
        \"overwrite\": true,
        \"message\": \"Automated import by setup script\"
    }")

DASHBOARD_SUCCESS=$(echo "$IMPORT_RESPONSE" | grep -o '"status":"success"' || echo "")

if [ -n "$DASHBOARD_SUCCESS" ]; then
    DASHBOARD_URL=$(echo "$IMPORT_RESPONSE" | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    print_success "Dashboard imported successfully"
    echo "  📊 Dashboard URL: http://localhost:3000$DASHBOARD_URL"
else
    print_warning "Dashboard import might have failed, but datasource is ready"
    echo "  📊 You can manually import: k6-dashboard-template.json"
fi

echo ""

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅  Setup Complete! k6 Monitoring Stack is Ready         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo "   Grafana:  http://localhost:3000"
echo "   InfluxDB: http://localhost:8086"
echo ""
echo -e "${BLUE}🔐 Grafana Credentials:${NC}"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo -e "${BLUE}🔑 InfluxDB Credentials:${NC}"
echo "   Organization: $INFLUX_ORG"
echo "   Bucket: $INFLUX_BUCKET"
echo "   Token: (stored in Kubernetes secret)"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "   1. Open Grafana: http://localhost:3000"
echo "   2. Go to Dashboards → k6 Load Testing Dashboard"
echo "   3. Run a k6 test with InfluxDB output:"
echo ""
echo "      export K6_INFLUXDB_ORGANIZATION=$INFLUX_ORG"
echo "      export K6_INFLUXDB_BUCKET=$INFLUX_BUCKET"
echo "      export K6_INFLUXDB_TOKEN=\$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)"
echo "      export K6_INFLUXDB_ADDR=http://localhost:8086"
echo "      ./k6 run -o xk6-influxdb test-simple.js"
echo ""
echo -e "${YELLOW}ℹ️  Port-forwards are running in background (PIDs: $GRAFANA_PF_PID, $INFLUX_PF_PID)${NC}"
echo "   To stop them: kill $GRAFANA_PF_PID $INFLUX_PF_PID"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "   • README.md - Complete setup guide"
echo "   • EXTERNAL-RUN.md - External k6 runner instructions"
echo "   • GRAFANA-DASHBOARD-SETUP.md - Dashboard customization"
echo ""

