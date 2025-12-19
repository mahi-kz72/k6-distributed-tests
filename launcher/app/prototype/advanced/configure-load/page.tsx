'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

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

const LoadTimelineGraph = ({ stages }: { stages: any[] }) => {
  const width = 700
  const height = 200
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const timelineData = useMemo(() => {
    let currentTime = 0
    const points: Array<{ time: number; users: number }> = [{ time: 0, users: 0 }]
    
    stages.forEach((stage) => {
      const duration = parseDuration(stage.duration)
      points.push({ time: currentTime, users: stage.users })
      currentTime += duration
      points.push({ time: currentTime, users: stage.users })
    })
    
    return { points, totalTime: currentTime, maxUsers: Math.max(...stages.map(s => s.users), 1) }
  }, [stages])

  const { points, totalTime, maxUsers } = timelineData

  if (totalTime === 0 || maxUsers === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        Configure stages to see timeline
      </div>
    )
  }

  const scaleX = (time: number) => padding + (time / totalTime) * chartWidth
  const scaleY = (users: number) => height - padding - (users / maxUsers) * chartHeight

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${scaleX(p.time)} ${scaleY(p.users)}`
  ).join(' ')

  const areaPath = `${pathData} L ${scaleX(totalTime)} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="loadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#667eea" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#667eea" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      <rect
        x={padding}
        y={padding}
        width={chartWidth}
        height={chartHeight}
        fill="#f8f9fa"
        rx="4"
      />
      
      <path
        d={areaPath}
        fill="url(#loadGradient)"
      />
      
      <path
        d={pathData}
        stroke="#667eea"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.time)}
          cy={scaleY(p.users)}
          r="4"
          fill="#667eea"
        />
      ))}
      
      <text
        x={padding}
        y={padding - 10}
        fontSize="12"
        fill="#666"
      >
        {maxUsers} users
      </text>
      
      <text
        x={width - padding}
        y={height - padding + 20}
        fontSize="12"
        fill="#666"
        textAnchor="end"
      >
        {totalTime.toFixed(1)}m
      </text>
    </svg>
  )
}

export default function ConfigureLoad() {
  const router = useRouter()
  
  const [stages, setStages] = useState([
    { id: 1, label: 'Build up traffic', duration: '2m', users: 50 },
    { id: 2, label: 'Keep traffic steady', duration: '5m', users: 50 },
    { id: 3, label: 'Wind down traffic', duration: '1m', users: 0 },
  ])

  const totalDuration = useMemo(() => {
    return stages.reduce((sum, s) => sum + parseDuration(s.duration), 0)
  }, [stages])

  const peakUsers = Math.max(...stages.map(s => s.users))

  const stageFormat = useMemo(() => {
    return stages.map(s => `--stage ${s.duration}:${s.users}`).join('\n')
  }, [stages])

  const updateStage = (id: number, field: string, value: string | number) => {
    setStages(stages.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const removeStage = (id: number) => {
    if (stages.length > 1) {
      setStages(stages.filter(s => s.id !== id))
    }
  }

  const addStage = () => {
    setStages([...stages, {
      id: Date.now(),
      label: 'New step',
      duration: '1m',
      users: 50,
    }])
  }

  const applyPreset = (preset: string) => {
    if (preset === 'quick') {
      setStages([
        { id: 1, label: 'Quick test', duration: '30s', users: 5 },
      ])
    } else if (preset === 'standard') {
      setStages([
        { id: 1, label: 'Build up traffic', duration: '2m', users: 50 },
        { id: 2, label: 'Keep traffic steady', duration: '5m', users: 50 },
        { id: 3, label: 'Wind down traffic', duration: '1m', users: 0 },
      ])
    } else if (preset === 'extended') {
      setStages([
        { id: 1, label: 'Build up traffic', duration: '5m', users: 100 },
        { id: 2, label: 'Keep traffic steady', duration: '10m', users: 100 },
        { id: 3, label: 'Wind down traffic', duration: '2m', users: 0 },
      ])
    }
  }

  const handleNext = () => {
    localStorage.setItem('stages', JSON.stringify(stages))
    router.push('/prototype/advanced/paste-script')
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
            Define how traffic changes over time. Your script logic stays intact.
          </p>
          <div style={{
            background: '#f0f4ff',
            border: '1px solid #667eea',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            color: '#1e40af',
          }}>
            Step 1: Define Load Stages
          </div>
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
            We've started you with a default load setup below. <strong>Edit and customize these stages</strong> to match your needs.
            These load stages will be automatically applied to your k6 script in the next step - you don't need to include stages in your script.
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Load Stages Timeline</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            These stages will be applied to your script automatically.
          </p>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
          }}>
            <LoadTimelineGraph stages={stages} />
          </div>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            padding: '1rem',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
              Stage format (k6-style):
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#333',
              background: '#f8f9fa',
              padding: '0.75rem',
              borderRadius: '4px',
            }}>
{stageFormat}
            </pre>
          </div>
        </div>

        <div style={{
          background: '#fff9e6',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          <strong>📝 Default stages shown below</strong> - Edit the duration and user counts to customize your load pattern.
        </div>

        {stages.map((stage, index) => (
          <div key={stage.id} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>
              Stage {index + 1}: {stage.label}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  How long?
                </label>
                <input
                  type="text"
                  value={stage.duration}
                  onChange={(e) => updateStage(stage.id, 'duration', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  e.g., 2m, 30s, 1h
                </small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  How many users?
                </label>
                <input
                  type="number"
                  value={stage.users}
                  onChange={(e) => updateStage(stage.id, 'users', parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
            {stages.length > 1 && (
              <button
                onClick={() => removeStage(stage.id)}
                style={{
                  background: '#fee',
                  color: '#c33',
                  border: '1px solid #fcc',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Remove this step
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addStage}
          style={{
            background: '#f0f0f0',
            border: '1px solid #ddd',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '2rem',
          }}
        >
          + Add Another Step
        </button>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Quick Options</h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Not sure what to pick? Try one of these:
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => applyPreset('quick')}
              style={{
                background: 'white',
                border: '1px solid #ddd',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Quick Test
            </button>
            <button
              onClick={() => applyPreset('standard')}
              style={{
                background: 'white',
                border: '1px solid #ddd',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Standard Test
            </button>
            <button
              onClick={() => applyPreset('extended')}
              style={{
                background: 'white',
                border: '1px solid #ddd',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Extended Test
            </button>
          </div>
        </div>

        <div style={{
          background: '#e3f2fd',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Load Stages Summary</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            ⏱️ Total time: {totalDuration} minutes
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            👥 Peak users: {peakUsers}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            These load stages will be applied to your script in the next step.
          </p>
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
            onClick={handleNext}
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
            Next: Paste Script →
          </button>
        </div>
      </div>
    </div>
  )
}

