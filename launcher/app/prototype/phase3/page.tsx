'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

const parseDuration = (duration: string): number => {
  const match = duration.match(/(\d+)([smh])/)
  if (!match) return 0
  const value = parseInt(match[1])
  const unit = match[2]
  if (unit === 's') return value / 60
  if (unit === 'm') return value
  if (unit === 'h') return value * 60
  return 0
}

export default function Phase3() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patternId = searchParams.get('pattern') || 'normal-day'
  const mode = searchParams.get('mode') || 'easy'
  
  const [stages, setStages] = useState<any[]>([])
  const [apiUrl, setApiUrl] = useState('')
  const [customScript, setCustomScript] = useState('')

  useEffect(() => {
    const savedStages = localStorage.getItem('stages')
    const savedApiUrl = localStorage.getItem('apiUrl')
    if (savedStages) {
      setStages(JSON.parse(savedStages))
    }
    if (savedApiUrl) {
      setApiUrl(savedApiUrl)
    }
  }, [])

  const totalDuration = useMemo(() => {
    return stages.reduce((sum: number, s: any) => sum + parseDuration(s.duration), 0)
  }, [stages])

  const peakUsers = useMemo(() => {
    return Math.max(...stages.map((s: any) => s.users), 0)
  }, [stages])

  const stageFormat = useMemo(() => {
    return stages.map((s: any) => `${s.duration}:${s.users}`).join(', ')
  }, [stages])

  const handleRun = () => {
    if (customScript.trim()) {
      localStorage.setItem('customScript', customScript)
    }
    router.push(`/prototype/results?pattern=${patternId}&mode=${mode}`)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '12px', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/prototype/phase2?pattern=${patternId}&mode=${mode}`)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            ← Back to API Config
          </button>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Step 3 of 3: Add Your Test Script
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Paste your k6 test script. Load stages from Step 1 will be applied automatically.
          </p>
        </div>

        <div style={{
          background: '#e3f2fd',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <strong>ℹ️ How this works:</strong>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Paste your k6 test script below. The load stages you configured in Step 1 will be automatically applied to your script.
            Your script should include test logic, checks, and thresholds - but not load stages (we'll add those).
          </p>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Your k6 Test Script</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Paste your k6 test script here. Include test logic, checks, and thresholds. Load stages from Step 1 will be added automatically.
          </p>
          
          <textarea
            value={customScript}
            onChange={(e) => setCustomScript(e.target.value)}
            placeholder={`import http from "k6/http";
import { check, sleep } from "k6";

// Don't include stages - they'll be added from Step 1
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "${apiUrl}";

export default function () {
  const res = http.get(BASE_URL, {
    tags: { api: "test" },
  });
  
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  
  sleep(1);
}`}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              resize: 'vertical',
            }}
          />
        </div>

        {stages.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem', color: '#333' }}>
              Load Summary (from Step 1)
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
              <strong>{stages.length}</strong> stage{stages.length !== 1 ? 's' : ''} • 
              <strong> {totalDuration.toFixed(1)}</strong> minutes total • 
              <strong> {peakUsers}</strong> peak users
            </div>
            <div style={{
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#667eea',
              background: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '0.5rem',
            }}>
              {stageFormat}
            </div>
          </div>
        )}

        <div style={{
          background: '#e3f2fd',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Test Summary</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            Pattern: {patternId.replace('-', ' ')}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            Duration: {totalDuration} minutes
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            Peak Load: {peakUsers} users
          </div>
          <div style={{ marginBottom: '1rem' }}>
            Endpoint: {apiUrl}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <strong>When you click "Run Test":</strong>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Test will start immediately</li>
              <li>It runs in the background</li>
              <li>You'll get a link to view results</li>
              <li>Results appear in Grafana as the test runs</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push(`/prototype/phase2?pattern=${patternId}&mode=${mode}`)}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleRun}
            disabled={!customScript.trim()}
            style={{
              background: customScript.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: customScript.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '600',
            }}
          >
            Run Test Now →
          </button>
        </div>
      </div>
    </div>
  )
}

