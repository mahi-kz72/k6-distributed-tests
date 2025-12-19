import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { storeTestStatus } from '@/lib/test-status-store'

const execAsync = promisify(exec)

interface TestRequest {
  apiUrl: string
  testType?: string
  // Smoke test
  vus?: number
  duration?: string
  // Stage-based tests
  stages?: Array<{ duration: string; target: number }>
}

// Get environment variables with defaults for local development
const getEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue
}

const INFLUXDB_ADDR = getEnvVar('K6_INFLUXDB_ADDR', 'http://host.docker.internal:8086')
const INFLUXDB_ORG = getEnvVar('K6_INFLUXDB_ORG', 'perf-org')
const INFLUXDB_BUCKET = getEnvVar('K6_INFLUXDB_BUCKET', 'k6')
const INFLUXDB_TOKEN = getEnvVar('K6_INFLUXDB_TOKEN', '')
const GRAFANA_URL = getEnvVar('GRAFANA_URL', 'http://localhost:3000')
const K6_RUNNER_IMAGE = getEnvVar('K6_RUNNER_IMAGE', 'perf/k6-runner:local')
const WORK_DIR = getEnvVar('K6_WORK_DIR', '/tmp/k6-tests')

function generateK6Script(params: TestRequest): string {
  const { apiUrl, testType, vus, duration, stages } = params
  
  // Extract API name from URL for tagging
  let apiName = 'api_test'
  try {
    const url = new URL(apiUrl)
    apiName = url.pathname.split('/').filter(Boolean).join('_') || 'api_test'
  } catch {
    apiName = 'api_test'
  }
  
  let optionsConfig = ''
  
  if (testType === 'smoke') {
    // Smoke test: simple vus and duration
    optionsConfig = `  vus: ${vus || 1},
  duration: "${duration || '30s'}",`
  } else if (stages && stages.length > 0) {
    // Stage-based tests
    const stagesStr = stages.map(s => `    { duration: "${s.duration}", target: ${s.target} }`).join(',\n')
    optionsConfig = `  stages: [\n${stagesStr},\n  ],`
  } else {
    // Fallback to default
    optionsConfig = `  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],`
  }
  
  return `import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
${optionsConfig}
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "${apiUrl}";

export default function () {
  const res = http.get(BASE_URL, {
    tags: { api: "${apiName}" },
  });
  
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  
  sleep(1);
}
`
}

async function ensureWorkDir() {
  if (!existsSync(WORK_DIR)) {
    await mkdir(WORK_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json()
    
    // Validate required fields based on test type
    if (!body.apiUrl) {
      return NextResponse.json(
        { error: 'API URL is required' },
        { status: 400 }
      )
    }
    
    const testType = body.testType || 'load'
    
    if (testType === 'smoke') {
      if (!body.vus || !body.duration) {
        return NextResponse.json(
          { error: 'VUs and duration are required for smoke test' },
          { status: 400 }
        )
      }
    } else {
      if (!body.stages || body.stages.length === 0) {
        return NextResponse.json(
          { error: 'Stages are required for this test type' },
          { status: 400 }
        )
      }
    }

    if (!INFLUXDB_TOKEN) {
      return NextResponse.json(
        { error: 'K6_INFLUXDB_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    // Generate unique test ID
    const testId = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const scriptName = `${testType}-test-${testId}`
    
    // Generate k6 script
    const k6Script = generateK6Script(body)
    
    // Ensure work directory exists
    await ensureWorkDir()
    
    // Write script to temporary file in a location accessible to Docker
    // Resolve to absolute path
    const scriptPath = resolve(WORK_DIR, `${scriptName}.js`)
    await writeFile(scriptPath, k6Script)
    
    // Get absolute paths for Docker volume mount
    const scriptDir = resolve(WORK_DIR)
    const scriptFileName = `${scriptName}.js`
    
    // Determine InfluxDB address based on environment
    // If INFLUXDB_ADDR points to localhost/127.0.0.1, k6 container needs host.docker.internal
    // If it's already a service name (like "influxdb"), use it as-is
    let influxAddr = INFLUXDB_ADDR
    if (INFLUXDB_ADDR.includes('localhost') || INFLUXDB_ADDR.includes('127.0.0.1')) {
      influxAddr = INFLUXDB_ADDR.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal')
    } else if (INFLUXDB_ADDR.includes('influxdb:')) {
      // If using docker-compose service name, keep it but k6 container needs same network
      // For docker-compose, we'll use the default bridge network or specify network
      influxAddr = INFLUXDB_ADDR
    }
    
    // Prepare Docker command
    // Note: We run this in the background and don't wait for completion
    // Mount the script directory and reference the script file
    const dockerCmd = [
      'docker run --rm -d',
      `-e K6_SCRIPT=/work/${scriptFileName}`,
      `-e K6_SCRIPT_NAME=${scriptName}`,
      `-e K6_TEAM=ui`,
      `-e K6_INFLUXDB_ADDR=${influxAddr}`,
      `-e K6_INFLUXDB_ORG=${INFLUXDB_ORG}`,
      `-e K6_INFLUXDB_BUCKET=${INFLUXDB_BUCKET}`,
      `-e K6_INFLUXDB_TOKEN="${INFLUXDB_TOKEN}"`,
      `-e BASE_URL="${body.apiUrl}"`,
      `-v "${scriptDir}:/work"`,
      K6_RUNNER_IMAGE
    ].join(' ')
    
    // Execute Docker command in background
    exec(dockerCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting k6 test: ${error.message}`)
        // Clean up script file on error
        unlink(scriptPath).catch(console.error)
        return
      }
      const containerId = stdout.trim()
      console.log(`k6 test started: ${testId}, container: ${containerId}`)
      
      // Store test status
      if (containerId) {
        storeTestStatus(testId, containerId)
      }
    })
    
    // Construct Grafana URL with filters
    const grafanaUrl = `${GRAFANA_URL}/d/k6-template?var-script=${encodeURIComponent(scriptName)}&var-api=All&refresh=10s`
    
    return NextResponse.json({
      testId,
      scriptName,
      grafanaUrl,
      status: 'running',
      message: `Load test started successfully. The test will run in the background and results will appear in Grafana.`,
    })
  } catch (error) {
    console.error('Error in run-test API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

