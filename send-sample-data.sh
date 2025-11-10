#!/bin/bash

# Quick script to send sample k6 metrics to InfluxDB
# Use this to test your Grafana dashboards

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}📤 Sending sample k6 metrics to InfluxDB...${NC}"
echo ""

# Check if port-forward is running
if ! curl -s http://localhost:8086/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  InfluxDB is not accessible on localhost:8086${NC}"
    echo "Starting port-forward..."
    kubectl -n k6-tests port-forward service/influxdb 8086:8086 > /dev/null 2>&1 &
    PF_PID=$!
    sleep 3
    echo -e "${GREEN}✅ Port-forward started (PID: $PF_PID)${NC}"
else
    echo -e "${GREEN}✅ InfluxDB is accessible${NC}"
fi

# Get token
TOKEN=$(kubectl -n k6-tests get secret influxdb-auth -o jsonpath='{.data.admin-token}' | base64 -d)

echo "Sending 20 data points..."

# Send data points
for i in {1..20}; do
  TIMESTAMP=$(date +%s)000000000
  
  # Random values for realistic data
  VUS=5
  HTTP_REQS=$((i * 2))
  HTTP_DURATION=$((200 + RANDOM % 300))
  ITERATIONS=$i
  FAILED=0
  DATA_RECEIVED=$((1024 * i))
  
  curl -s -X POST "http://localhost:8086/api/v2/write?org=k6-org&bucket=k6-metrics&precision=ns" \
    -H "Authorization: Token $TOKEN" \
    -H "Content-Type: text/plain" \
    --data-raw "vus value=$VUS $TIMESTAMP
http_reqs value=$HTTP_REQS $TIMESTAMP
http_req_duration value=$HTTP_DURATION $TIMESTAMP
iterations value=$ITERATIONS $TIMESTAMP
http_req_failed value=$FAILED $TIMESTAMP
data_received value=$DATA_RECEIVED $TIMESTAMP" > /dev/null
  
  echo -n "."
  sleep 0.3
done

echo ""
echo ""
echo -e "${GREEN}✅ Sample data sent successfully!${NC}"
echo ""
echo -e "${BLUE}🎯 View your dashboard:${NC}"
echo "   http://localhost:3000/d/k6-load-testing/k6-load-testing-dashboard"
echo ""
echo -e "${BLUE}📊 Tips:${NC}"
echo "   • Set time range to 'Last 5 minutes'"
echo "   • Click refresh button to see latest data"
echo "   • Data was sent to bucket: k6-metrics"
echo ""
echo -e "${YELLOW}ℹ️  To send to a different bucket, use:${NC}"
echo "   K6_BUCKET=team1-metrics $0"
echo ""

