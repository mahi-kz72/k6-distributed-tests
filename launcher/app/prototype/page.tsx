'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LoadPatternGraph = ({ patternId }: { patternId: string }) => {
  const width = 280
  const height = 100
  const padding = 10
  
  const getPath = () => {
    switch (patternId) {
      case 'quick-check':
        return `M ${padding} ${height - padding - 20} L ${width - padding} ${height - padding - 20}`
      case 'normal-day':
        return `M ${padding} ${height - padding} L ${width * 0.3} ${height - padding - 60} L ${width * 0.7} ${height - padding - 60} L ${width - padding} ${height - padding}`
      case 'find-limits':
        return `M ${padding} ${height - padding} L ${width * 0.2} ${height - padding - 40} L ${width * 0.4} ${height - padding - 50} L ${width * 0.6} ${height - padding - 60} L ${width * 0.8} ${height - padding - 70} L ${width - padding} ${height - padding - 80}`
      case 'traffic-spike':
        return `M ${padding} ${height - padding - 20} L ${width * 0.3} ${height - padding - 20} L ${width * 0.35} ${height - padding - 80} L ${width * 0.5} ${height - padding - 80} L ${width * 0.55} ${height - padding - 20} L ${width - padding} ${height - padding - 20}`
      case 'long-run':
        return `M ${padding} ${height - padding} L ${width * 0.2} ${height - padding - 60} L ${width * 0.8} ${height - padding - 60} L ${width - padding} ${height - padding}`
      case 'step-by-step':
        return `M ${padding} ${height - padding} L ${width * 0.2} ${height - padding - 30} L ${width * 0.2} ${height - padding - 30} L ${width * 0.4} ${height - padding - 30} L ${width * 0.4} ${height - padding - 50} L ${width * 0.6} ${height - padding - 50} L ${width * 0.6} ${height - padding - 70} L ${width * 0.8} ${height - padding - 70} L ${width * 0.8} ${height - padding - 90} L ${width - padding} ${height - padding - 90}`
      default:
        return `M ${padding} ${height - padding} L ${width - padding} ${height - padding}`
    }
  }

  const getColor = () => {
    switch (patternId) {
      case 'quick-check':
        return '#10b981'
      case 'normal-day':
        return '#3b82f6'
      case 'find-limits':
        return '#f59e0b'
      case 'traffic-spike':
        return '#ef4444'
      case 'long-run':
        return '#8b5cf6'
      case 'step-by-step':
        return '#ec4899'
      default:
        return '#667eea'
    }
  }

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`gradient-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={getColor()} stopOpacity="0.3" />
          <stop offset="100%" stopColor={getColor()} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        fill={`url(#gradient-${patternId})`}
        rx="4"
      />
      <path
        d={getPath()}
        stroke={getColor()}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const patterns = [
  {
    id: 'quick-check',
    title: 'Quick Check',
    description: 'Is my API working? Quick test to verify everything responds.',
    duration: '30 seconds',
    users: '1-5 users',
    complexity: 'Fastest & Simplest',
  },
  {
    id: 'normal-day',
    title: 'Normal Day',
    description: 'What happens during a normal busy day? Simulate typical usage.',
    duration: '5 minutes',
    users: '50 users',
    complexity: 'Most Common',
  },
  {
    id: 'find-limits',
    title: 'Find Limits',
    description: 'How much traffic can my system handle before it breaks? Gradually push harder to find the breaking point.',
    duration: '10 minutes',
    users: 'Up to 300',
    complexity: 'Advanced',
  },
  {
    id: 'traffic-spike',
    title: 'Traffic Spike',
    description: 'What if traffic suddenly jumps 10x? Test sudden surges like flash sales or viral posts.',
    duration: '2 minutes',
    users: 'Up to 300',
    complexity: 'For Events',
  },
  {
    id: 'long-run',
    title: 'Long Run',
    description: 'Will my system stay stable for hours? Run normal load for a long time to find slow problems.',
    duration: '2+ hours',
    users: '50 users',
    complexity: 'Deep Testing',
  },
  {
    id: 'step-by-step',
    title: 'Step by Step',
    description: 'Test each level to find exactly where problems start. Like testing each floor of a building to see when it starts to creak.',
    duration: '14 minutes',
    users: '50 to 300',
    complexity: 'Precise',
  },
]

export default function PrototypeHome() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const [mode, setMode] = useState<'easy' | 'advanced'>('easy')

  const handleSelect = (patternId: string) => {
    localStorage.setItem('selectedPattern', patternId)
    localStorage.setItem('mode', 'easy')
    router.push(`/prototype/phase1?pattern=${patternId}&mode=easy`)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Choose Your Mode</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div
              onClick={() => setMode('easy')}
              style={{
                flex: 1,
                padding: '1rem',
                border: mode === 'easy' ? '2px solid #667eea' : '2px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: mode === 'easy' ? '#f0f4ff' : 'white',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Easy Mode {mode === 'easy' && '✓'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Guided setup. No scripting required.
              </div>
            </div>
            <div
              onClick={() => {
                localStorage.setItem('mode', 'advanced')
                router.push('/prototype/advanced/paste-script')
              }}
              style={{
                flex: 1,
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'white',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.background = '#f0f4ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.background = 'white'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Use My Script →
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                I already have my script, just run it.
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          marginBottom: '3rem' 
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            What do you want to test?
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Choose the pattern that matches your situation
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              onClick={() => handleSelect(pattern.id)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
                e.currentTarget.style.borderColor = '#667eea'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                {pattern.title}
              </h2>
              <div style={{
                height: '100px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
              }}>
                <LoadPatternGraph patternId={pattern.id} />
              </div>
              <div style={{ marginBottom: '1rem', color: '#666' }}>
                <div>⏱️ {pattern.duration}</div>
                <div>👥 {pattern.users}</div>
              </div>
              <p style={{ marginBottom: '1rem', color: '#333' }}>
                {pattern.description}
              </p>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#667eea',
                fontWeight: '500',
              }}>
                ✓ {pattern.complexity}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '1rem',
            }}
          >
            What happens when I choose a pattern?
          </button>
          
          {showHelp && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'left',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>What happens next?</h3>
              <p style={{ marginBottom: '1rem' }}>
                Don't worry - we'll guide you through everything!
              </p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  You'll set up the load pattern → Tell us how many users and for how long
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  You'll tell us what to test → Just paste your API URL
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  We'll create and run the test → We generate everything automatically
                </li>
              </ol>
              <p style={{ marginTop: '1rem', fontWeight: '500' }}>
                The whole process takes about 2 minutes!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

