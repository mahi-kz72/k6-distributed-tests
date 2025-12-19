'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../test.module.css'
import SmokeTestForm from './forms/SmokeTestForm'
import LoadTestForm from './forms/LoadTestForm'
import StressTestForm from './forms/StressTestForm'
import SpikeTestForm from './forms/SpikeTestForm'
import SoakTestForm from './forms/SoakTestForm'
import BreakpointTestForm from './forms/BreakpointTestForm'

interface TestResult {
  testId: string
  grafanaUrl: string
  status: 'running' | 'completed' | 'error'
  message?: string
}

const testTypeConfig: Record<string, { name: string; description: string }> = {
  smoke: { name: 'Smoke Test', description: 'Quick validation with minimal load' },
  load: { name: 'Normal Load Test', description: 'Test under expected normal load' },
  stress: { name: 'Stress Test', description: 'Test beyond normal capacity' },
  spike: { name: 'Spike Test', description: 'Test response to sudden load increases' },
  soak: { name: 'Soak Test', description: 'Test stability under sustained load' },
  breakpoint: { name: 'Breakpoint Test', description: 'Find the exact point of failure' },
}

export default function TestPage() {
  const params = useParams()
  const testType = params?.type as string
  const config = testTypeConfig[testType] || { name: 'Load Test', description: '' }

  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Poll for test status when a test is running
  useEffect(() => {
    if (!testResult || testResult.status !== 'running') {
      return
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/test-status/${testResult.testId}`)
        if (response.ok) {
          const statusData = await response.json()
          if (statusData.status !== testResult.status) {
            setTestResult({
              ...testResult,
              status: statusData.status as 'running' | 'completed' | 'error',
            })
          }
        }
      } catch (err) {
        console.error('Error polling test status:', err)
      }
    }

    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval)
  }, [testResult])

  if (!testTypeConfig[testType]) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Test Type Not Found</h1>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const renderForm = () => {
    switch (testType) {
      case 'smoke':
        return <SmokeTestForm onResult={setTestResult} onError={setError} />
      case 'load':
        return <LoadTestForm onResult={setTestResult} onError={setError} />
      case 'stress':
        return <StressTestForm onResult={setTestResult} onError={setError} />
      case 'spike':
        return <SpikeTestForm onResult={setTestResult} onError={setError} />
      case 'soak':
        return <SoakTestForm onResult={setTestResult} onError={setError} />
      case 'breakpoint':
        return <BreakpointTestForm onResult={setTestResult} onError={setError} />
      default:
        return <LoadTestForm onResult={setTestResult} onError={setError} />
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>{config.name}</h1>
          <p className={styles.subtitle}>{config.description}</p>
        </div>

        {renderForm()}

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
            {error.includes('K6_INFLUXDB_TOKEN') && (
              <div className={styles.errorHelp}>
                <p>To fix this:</p>
                <ol>
                  <li>Get your InfluxDB token from http://localhost:8086</li>
                  <li>Create a <code>.env.local</code> file in the launcher directory</li>
                  <li>Add: <code>K6_INFLUXDB_TOKEN=your_token_here</code></li>
                  <li>Restart the dev server</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h3>Test Started Successfully</h3>
              <div className={styles.statusBadge}>
                <span className={styles.testId}>Test ID: {testResult.testId}</span>
                <span className={`${styles.status} ${styles[`status${testResult.status.charAt(0).toUpperCase() + testResult.status.slice(1)}`]}`}>
                  {testResult.status === 'running' && '🟢 Running'}
                  {testResult.status === 'completed' && '✅ Completed'}
                  {testResult.status === 'error' && '❌ Error'}
                </span>
              </div>
            </div>
            <p className={styles.resultMessage}>{testResult.message}</p>
            <a
              href={testResult.grafanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.grafanaLink}
            >
              View Results in Grafana →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
