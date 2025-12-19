'use client'

import { useState } from 'react'
import styles from '../../test.module.css'

interface BreakpointTestFormProps {
  onResult: (result: any) => void
  onError: (error: string | null) => void
}

export default function BreakpointTestForm({ onResult, onError }: BreakpointTestFormProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [stageDuration, setStageDuration] = useState('2m')
  const [initialVUs, setInitialVUs] = useState('50')
  const [incrementVUs, setIncrementVUs] = useState('50')
  const [maxVUs, setMaxVUs] = useState('300')
  const [rampDownDuration, setRampDownDuration] = useState('2m')
  const [isRunning, setIsRunning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRunning(true)
    onError(null)

    try {
      // Generate stages dynamically based on increment
      const stages = []
      let currentVUs = parseInt(initialVUs)
      const increment = parseInt(incrementVUs)
      const max = parseInt(maxVUs)

      while (currentVUs <= max) {
        stages.push({ duration: stageDuration, target: currentVUs })
        currentVUs += increment
      }
      stages.push({ duration: rampDownDuration, target: 0 })

      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl,
          testType: 'breakpoint',
          stages,
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
        <h2 className={styles.sectionTitle}>Breakpoint Profile</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stageDuration" className={styles.label}>
              Stage Duration
            </label>
            <input
              id="stageDuration"
              type="text"
              value={stageDuration}
              onChange={(e) => setStageDuration(e.target.value)}
              placeholder="2m"
              className={styles.input}
              required
              disabled={isRunning}
            />
            <small className={styles.hint}>Duration for each increment stage</small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="initialVUs" className={styles.label}>
              Initial VUs
            </label>
            <input
              id="initialVUs"
              type="number"
              min="1"
              value={initialVUs}
              onChange={(e) => setInitialVUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="incrementVUs" className={styles.label}>
              VU Increment per Stage
            </label>
            <input
              id="incrementVUs"
              type="number"
              min="1"
              value={incrementVUs}
              onChange={(e) => setIncrementVUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
            <small className={styles.hint}>How many VUs to add each stage</small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="maxVUs" className={styles.label}>
              Maximum VUs
            </label>
            <input
              id="maxVUs"
              type="number"
              min="1"
              value={maxVUs}
              onChange={(e) => setMaxVUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
            <small className={styles.hint}>Stop incrementing at this VU count</small>
          </div>
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
            placeholder="2m"
            className={styles.input}
            required
            disabled={isRunning}
          />
        </div>
        <div className={styles.hint} style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#e3f2fd', borderRadius: '4px' }}>
          <strong>Stages will be:</strong> {initialVUs} → {parseInt(initialVUs) + parseInt(incrementVUs)} → {parseInt(initialVUs) + parseInt(incrementVUs) * 2} → ... → {maxVUs} → 0
        </div>
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={isRunning || !apiUrl}
      >
        {isRunning ? 'Starting Test...' : 'Run Breakpoint Test'}
      </button>
    </form>
  )
}

