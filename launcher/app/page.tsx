'use client'

import Link from 'next/link'
import styles from './home.module.css'

export default function Home() {
  const testTypes = [
    {
      id: 'smoke',
      name: 'Smoke Test',
      description: 'Quick validation test with minimal load to verify basic functionality',
      icon: '💨',
    },
    {
      id: 'load',
      name: 'Normal Load Test',
      description: 'Test system behavior under expected normal load conditions',
      icon: '📊',
    },
    {
      id: 'stress',
      name: 'Stress Test',
      description: 'Test system behavior beyond normal capacity to find breaking points',
      icon: '⚡',
    },
    {
      id: 'spike',
      name: 'Spike Test',
      description: 'Test system response to sudden, extreme increases in load',
      icon: '📈',
    },
    {
      id: 'soak',
      name: 'Soak Test',
      description: 'Test system stability under sustained load over extended periods',
      icon: '⏱️',
    },
    {
      id: 'breakpoint',
      name: 'Breakpoint Test',
      description: 'Gradually increase load to identify the exact point of failure',
      icon: '🎯',
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome</h1>
          <p className={styles.subtitle}>
            Choose the type of performance test you need to run
          </p>
        </div>

        <div className={styles.testGrid}>
          {testTypes.map((test) => (
            <Link
              key={test.id}
              href={`/test/${test.id}`}
              className={styles.testCard}
            >
              <div className={styles.testIcon}>{test.icon}</div>
              <h3 className={styles.testName}>{test.name}</h3>
              <p className={styles.testDescription}>{test.description}</p>
              <div className={styles.testArrow}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
