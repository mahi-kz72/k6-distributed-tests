'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function Phase2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patternId = searchParams.get('pattern') || 'normal-day'
  const mode = searchParams.get('mode') || 'easy'
  
  const [apiUrl, setApiUrl] = useState('https://api.example.com/users')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const testConnection = () => {
    setConnectionStatus('testing')
    setTimeout(() => {
      setConnectionStatus('success')
    }, 1000)
  }

  const handleNext = () => {
    localStorage.setItem('apiUrl', apiUrl)
    router.push(`/prototype/phase3?pattern=${patternId}&mode=${mode}`)
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
            onClick={() => router.push(`/prototype/phase1?pattern=${patternId}&mode=${mode}`)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            ← Back to Load Pattern
          </button>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Step 2 of 3: Tell us what to test
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Just paste your API URL and we'll test it
          </p>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>What API should we test?</h3>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Paste your API URL here:
          </label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              marginBottom: '1rem',
            }}
            placeholder="https://api.example.com/users"
          />
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: connectionStatus === 'testing' ? 'wait' : 'pointer',
              marginBottom: '1rem',
            }}
          >
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          {connectionStatus === 'success' && (
            <div style={{ color: '#10b981', marginTop: '0.5rem' }}>
              ✓ Connection successful! Your API is reachable and responding.
            </div>
          )}
          {connectionStatus === 'failed' && (
            <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>
              ✗ Connection failed. Please check your URL.
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            ℹ️ This is the endpoint that will receive test traffic. Make sure it's the correct URL before continuing.
          </p>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '1rem',
            }}
          >
            {showAdvanced ? '▼' : '▶'} Need to customize? (Optional)
          </button>
          
          {showAdvanced && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Most users don't need to change these. Only expand if you need to customize headers, request body, or HTTP method.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  HTTP Method:
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}>
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Custom Headers (if needed):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Authorization"
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Bearer token123..."
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Request Body (if needed):
                </label>
                <textarea
                  placeholder='{ "key": "value" }'
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minHeight: '100px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>What will happen?</h3>
          <p style={{ marginBottom: '0.5rem' }}>
            We'll send requests to: <strong>{apiUrl}</strong>
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            Following your load pattern from Step 1
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            We'll check that:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Responses return successfully (status 200)</li>
            <li>Response times are reasonable</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push(`/prototype/phase1?pattern=${patternId}&mode=${mode}`)}
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
            onClick={handleNext}
            disabled={!apiUrl}
            style={{
              background: apiUrl ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: apiUrl ? 'pointer' : 'not-allowed',
              fontWeight: '600',
            }}
          >
            Next: Review & Run →
          </button>
        </div>
      </div>
    </div>
  )
}

