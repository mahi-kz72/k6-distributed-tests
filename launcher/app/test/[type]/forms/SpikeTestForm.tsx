'use client'

import { useState } from 'react'
import styles from '../../test.module.css'

interface SpikeTestFormProps {
  onResult: (result: any) => void
  onError: (error: string | null) => void
}

export default function SpikeTestForm({ onResult, onError }: SpikeTestFormProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [stage1Duration, setStage1Duration] = useState('30s')
  const [stage1VUs, setStage1VUs] = useState('20')
  const [spikeDuration, setSpikeDuration] = useState('10s')
  const [spikeVUs, setSpikeVUs] = useState('300')
  const [holdDuration, setHoldDuration] = useState('1m')
  const [recoveryDuration, setRecoveryDuration] = useState('10s')
  const [recoveryVUs, setRecoveryVUs] = useState('20')
  const [rampDownDuration, setRampDownDuration] = useState('30s')
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
          testType: 'spike',
          stages: [
            { duration: stage1Duration, target: parseInt(stage1VUs) },
            { duration: spikeDuration, target: parseInt(spikeVUs) },
            { duration: holdDuration, target: parseInt(spikeVUs) },
            { duration: recoveryDuration, target: parseInt(recoveryVUs) },
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
        <h2 className={styles.sectionTitle}>Spike Profile</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stage1Duration" className={styles.label}>
              Initial Duration
            </label>
            <input
              id="stage1Duration"
              type="text"
              value={stage1Duration}
              onChange={(e) => setStage1Duration(e.target.value)}
              placeholder="30s"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="stage1VUs" className={styles.label}>
              Initial VUs
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
            <label htmlFor="spikeDuration" className={styles.label}>
              Spike Duration
            </label>
            <input
              id="spikeDuration"
              type="text"
              value={spikeDuration}
              onChange={(e) => setSpikeDuration(e.target.value)}
              placeholder="10s"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="spikeVUs" className={styles.label}>
              Spike VUs
            </label>
            <input
              id="spikeVUs"
              type="number"
              min="1"
              value={spikeVUs}
              onChange={(e) => setSpikeVUs(e.target.value)}
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="holdDuration" className={styles.label}>
            Hold at Spike Duration
          </label>
          <input
            id="holdDuration"
            type="text"
            value={holdDuration}
            onChange={(e) => setHoldDuration(e.target.value)}
            placeholder="1m"
            className={styles.input}
            required
            disabled={isRunning}
          />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="recoveryDuration" className={styles.label}>
              Recovery Duration
            </label>
            <input
              id="recoveryDuration"
              type="text"
              value={recoveryDuration}
              onChange={(e) => setRecoveryDuration(e.target.value)}
              placeholder="10s"
              className={styles.input}
              required
              disabled={isRunning}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="recoveryVUs" className={styles.label}>
              Recovery VUs
            </label>
            <input
              id="recoveryVUs"
              type="number"
              min="1"
              value={recoveryVUs}
              onChange={(e) => setRecoveryVUs(e.target.value)}
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
            placeholder="30s"
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
        {isRunning ? 'Starting Test...' : 'Run Spike Test'}
      </button>
    </form>
  )
}

