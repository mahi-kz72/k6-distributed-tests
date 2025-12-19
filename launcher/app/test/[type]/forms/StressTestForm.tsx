'use client'

import { useState } from 'react'
import styles from '../../test.module.css'

interface StressTestFormProps {
  onResult: (result: any) => void
  onError: (error: string | null) => void
}

export default function StressTestForm({ onResult, onError }: StressTestFormProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [stage1Duration, setStage1Duration] = useState('2m')
  const [stage1VUs, setStage1VUs] = useState('50')
  const [stage2Duration, setStage2Duration] = useState('3m')
  const [stage2VUs, setStage2VUs] = useState('150')
  const [stage3Duration, setStage3Duration] = useState('3m')
  const [stage3VUs, setStage3VUs] = useState('300')
  const [rampDownDuration, setRampDownDuration] = useState('2m')
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
          testType: 'stress',
          stages: [
            { duration: stage1Duration, target: parseInt(stage1VUs) },
            { duration: stage2Duration, target: parseInt(stage2VUs) },
            { duration: stage3Duration, target: parseInt(stage3VUs) },
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
        <h2 className={styles.sectionTitle}>Stress Profile</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stage1Duration" className={styles.label}>
              Stage 1 Duration
            </label>
            <input
              id="stage1Duration"
              type="text"
              value={stage1Duration}
              onChange={(e) => setStage1Duration(e.target.value)}
              placeholder="2m"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="stage1VUs" className={styles.label}>
              Stage 1 VUs
            </label>
            <input
              id="stage1VUs"
              type="number"
              min="1"
              value={stage1VUs}
              onChange={(e) => setStage1VUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stage2Duration" className={styles.label}>
              Stage 2 Duration
            </label>
            <input
              id="stage2Duration"
              type="text"
              value={stage2Duration}
              onChange={(e) => setStage2Duration(e.target.value)}
              placeholder="3m"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="stage2VUs" className={styles.label}>
              Stage 2 VUs
            </label>
            <input
              id="stage2VUs"
              type="number"
              min="1"
              value={stage2VUs}
              onChange={(e) => setStage2VUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stage3Duration" className={styles.label}>
              Stage 3 Duration
            </label>
            <input
              id="stage3Duration"
              type="text"
              value={stage3Duration}
              onChange={(e) => setStage3Duration(e.target.value)}
              placeholder="3m"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="stage3VUs" className={styles.label}>
              Stage 3 VUs
            </label>
            <input
              id="stage3VUs"
              type="number"
              min="1"
              value={stage3VUs}
              onChange={(e) => setStage3VUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
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
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={isRunning || !apiUrl}
      >
        {isRunning ? 'Starting Test...' : 'Run Stress Test'}
      </button>
    </form>
  )
}

