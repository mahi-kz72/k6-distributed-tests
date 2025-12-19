'use client'

import { useState } from 'react'
import styles from '../../test.module.css'

interface SmokeTestFormProps {
  onResult: (result: any) => void
  onError: (error: string | null) => void
}

export default function SmokeTestForm({ onResult, onError }: SmokeTestFormProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [vus, setVus] = useState('1')
  const [duration, setDuration] = useState('30s')
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
          testType: 'smoke',
          vus: parseInt(vus),
          duration,
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
        <h2 className={styles.sectionTitle}>Test Configuration</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="vus" className={styles.label}>
              Virtual Users (VUs)
            </label>
            <input
              id="vus"
              type="number"
              min="1"
              value={vus}
              onChange={(e) => setVus(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="duration" className={styles.label}>
              Duration
            </label>
            <input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30s"
              className={styles.input}
              required
              disabled={isRunning}
            />
            <small className={styles.hint}>e.g., 30s, 1m, 2m30s</small>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={isRunning || !apiUrl}
      >
        {isRunning ? 'Starting Test...' : 'Run Smoke Test'}
      </button>
    </form>
  )
}

