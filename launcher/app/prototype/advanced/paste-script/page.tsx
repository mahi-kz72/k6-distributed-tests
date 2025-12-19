'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PasteScript() {
  const router = useRouter()
  const [customScript, setCustomScript] = useState('')

  const handleRun = () => {
    localStorage.setItem('customScript', customScript)
    router.push('/prototype/results?mode=advanced')
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
            onClick={() => router.push('/prototype')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            ← Back to Home
          </button>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Advanced Mode: Use Your Own Script
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Paste your complete k6 test script and run it. No load configuration needed.
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
            Paste your complete k6 test script below. Your script should include everything: load stages, thresholds, and test logic.
            We'll run it exactly as you've written it.
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
            Paste your complete k6 test script below. Include everything: load stages, thresholds, and test logic.
          </p>
          
          <textarea
            value={customScript}
            onChange={(e) => setCustomScript(e.target.value)}
            placeholder={`import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "5m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://api.example.com/users";

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


        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push('/prototype')}
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

