'use client'

import { useState } from 'react'
import styles from '../../test.module.css'

interface LoadTestFormProps {
  onResult: (result: any) => void
  onError: (error: string | null) => void
}

export default function LoadTestForm({ onResult, onError }: LoadTestFormProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [rampUpDuration, setRampUpDuration] = useState('2m')
  const [rampUpVUs, setRampUpVUs] = useState('50')
  const [steadyStateDuration, setSteadyStateDuration] = useState('5m')
  const [rampDownDuration, setRampDownDuration] = useState('1m')
  const [isRunning, setIsRunning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRunning(true)
    onError(null)

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl,
          testType: 'load',
          stages: [
            { duration: rampUpDuration, target: parseInt(rampUpVUs) },
            { duration: steadyStateDuration, target: parseInt(rampUpVUs) },
            { duration: rampDownDuration, target: 0 },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start test')
      }

      const result = await response.json()
      onResult(result)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="apiUrl" className={styles.label}>
          Target API Endpoint
        </label>
        <input
          id="apiUrl"
          type="url"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className={styles.input}
          required
          disabled={isRunning}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Load Profile</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="rampUpDuration" className={styles.label}>
              Ramp-up Duration
            </label>
            <input
              id="rampUpDuration"
              type="text"
              value={rampUpDuration}
              onChange={(e) => setRampUpDuration(e.target.value)}
              placeholder="2m"
              className={styles.input}
              required
              disabled={isRunning}
            />
            <small className={styles.hint}>e.g., 2m, 5m</small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="rampUpVUs" className={styles.label}>
              Target VUs
            </label>
            <input
              id="rampUpVUs"
              type="number"
              min="1"
              value={rampUpVUs}
              onChange={(e) => setRampUpVUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="steadyStateDuration" className={styles.label}>
              Steady-state Duration
            </label>
            <input
              id="steadyStateDuration"
              type="text"
              value={steadyStateDuration}
              onChange={(e) => setSteadyStateDuration(e.target.value)}
              placeholder="5m"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="rampDownDuration" className={styles.label}>
              Ramp-down Duration
            </label>
            <input
              id="rampDownDuration"
              type="text"
              value={rampDownDuration}
              onChange={(e) => setRampDownDuration(e.target.value)}
              placeholder="1m"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={isRunning || !apiUrl}
      >
        {isRunning ? 'Starting Test...' : 'Run Load Test'}
      </button>
    </form>
  )
}

