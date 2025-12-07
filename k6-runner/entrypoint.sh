set -euo pipefail

: "${K6_SCRIPT:?K6_SCRIPT is required}"
: "${K6_SCRIPT_NAME:?K6_SCRIPT_NAME is required}"
: "${K6_TEAM:=unknown}"

: "${K6_INFLUXDB_ADDR:?K6_INFLUXDB_ADDR is required}"
: "${K6_INFLUXDB_ORG:?K6_INFLUXDB_ORG is required}"
: "${K6_INFLUXDB_BUCKET:?K6_INFLUXDB_BUCKET is required}"
: "${K6_INFLUXDB_TOKEN:?K6_INFLUXDB_TOKEN is required}"

export K6_INFLUXDB_ORGANIZATION="$K6_INFLUXDB_ORG"
export K6_INFLUXDB_BUCKET="$K6_INFLUXDB_BUCKET"
export K6_INFLUXDB_TOKEN="$K6_INFLUXDB_TOKEN"

# CI id fallback
TESTID="${CI_PIPELINE_ID:-${GITHUB_RUN_ID:-local}}"

# Tag every metric so Grafana can filter/group
echo "Running k6 script: $K6_SCRIPT"
echo "Tags: script=$K6_SCRIPT_NAME team=$K6_TEAM testid=$TESTID"

k6 run \
  --tag script="$K6_SCRIPT_NAME" \
  --tag team="$K6_TEAM" \
  --tag testid="$TESTID" \
  -o xk6-influxdb="$K6_INFLUXDB_ADDR" \
  "$K6_SCRIPT"

