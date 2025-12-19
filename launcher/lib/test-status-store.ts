// In-memory store for test status (in production, use Redis or a database)
interface TestStatus {
  status: 'running' | 'completed' | 'error'
  containerId?: string
  startedAt: number
}

const testStatusStore = new Map<string, TestStatus>()

export function storeTestStatus(testId: string, containerId: string) {
  testStatusStore.set(testId, {
    status: 'running',
    containerId,
    startedAt: Date.now(),
  })
}

export function getTestStatus(testId: string): TestStatus | undefined {
  return testStatusStore.get(testId)
}

export function updateTestStatus(testId: string, status: 'running' | 'completed' | 'error') {
  const existing = testStatusStore.get(testId)
  if (existing) {
    existing.status = status
    testStatusStore.set(testId, existing)
  }
}

export { testStatusStore }

