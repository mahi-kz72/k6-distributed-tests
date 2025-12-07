#!/usr/bin/env bash
set -euo pipefail

: "${GRAFANA_URL:?GRAFANA_URL required, e.g. https://grafana.perf.internal}"
: "${GRAFANA_TOKEN:?GRAFANA_TOKEN required}"
: "${K6_SCRIPT_NAME:?K6_SCRIPT_NAME required}"

TEMPLATE_UID="k6-template"
NEW_UID="k6-${K6_SCRIPT_NAME}"

# Check if dashboard already exists
existing=$(curl -sS -H "Authorization: Bearer $GRAFANA_TOKEN"       "$GRAFANA_URL/api/dashboards/uid/$NEW_UID" | jq -r '.dashboard.uid // empty')

if [[ -n "$existing" ]]; then
  echo "Dashboard $NEW_UID already exists."
  exit 0
fi

echo "Creating Grafana dashboard for script: $K6_SCRIPT_NAME"

# Get template
template=$(curl -sS -H "Authorization: Bearer $GRAFANA_TOKEN"       "$GRAFANA_URL/api/dashboards/uid/$TEMPLATE_UID")

# Replace title/uid and set default variable for script
payload=$(echo "$template" | jq       --arg uid "$NEW_UID"       --arg title "k6 - $K6_SCRIPT_NAME"       --arg script "$K6_SCRIPT_NAME"       '.dashboard.uid=$uid
   | .dashboard.title=$title
   | (.dashboard.templating.list[] | select(.name=="script") | .current.value)=$script
   | (.dashboard.templating.list[] | select(.name=="script") | .current.text)=$script
   | {dashboard:.dashboard, folderId:0, overwrite:false}')

curl -sS -X POST       -H "Authorization: Bearer $GRAFANA_TOKEN"       -H "Content-Type: application/json"       -d "$payload"       "$GRAFANA_URL/api/dashboards/db" >/dev/null

echo "Dashboard created: $NEW_UID"
