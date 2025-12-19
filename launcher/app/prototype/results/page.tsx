'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Results() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patternId = searchParams.get('pattern') || 'normal-day'
  
  const [testId] = useState(`test-${Date.now()}`)
  const [status, setStatus] = useState<'running' | 'completed'>('running')

  useEffect(() => {
    // Simulate status change after 5 seconds
    const timer = setTimeout(() => {
      setStatus('completed')
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const grafanaUrl = `http://localhost:3000/d/k6-template?var-script=${testId}&var-api=All&refresh=10s`

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '12px', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Test Started Successfully!
          </h1>
        </div>

        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>Test Status</h3>
              <div style={{ fontSize: '0.9rem', color: '#065f46' }}>
                Test ID: {testId}
              </div>
            </div>
            <div style={{
              background: status === 'running' ? '#dbeafe' : '#d1fae5',
              color: status === 'running' ? '#1e40af' : '#065f46',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: '600',
            }}>
              {status === 'running' ? '🟢 Running' : '✅ Completed'}
            </div>
          </div>
          <p style={{ color: '#065f46', marginBottom: '1rem' }}>
            Your load test is {status === 'running' ? 'running in the background' : 'completed'}.
            Results will appear in Grafana.
          </p>
          <a
            href={grafanaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#0369a1',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            View Results in Grafana →
          </a>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>What's Next?</h3>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Click the Grafana link above to see real-time results
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              The test runs in the background - you can close this page
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Results will be available for 30 days
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push('/prototype')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Start New Test
          </button>
        </div>
      </div>
    </div>
  )
}

