import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getTestStatus, updateTestStatus, testStatusStore } from '@/lib/test-status-store'

const execAsync = promisify(exec)

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    
    // Get stored status
    const stored = getTestStatus(testId)
    
    if (!stored) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }
    
    // If test is running, check Docker container status
    if (stored.status === 'running' && stored.containerId) {
      try {
        // Check if container is still running
        const { stdout } = await execAsync(`docker ps -q -f id=${stored.containerId}`)
        if (!stdout.trim()) {
          // Container is not running, check if it exited successfully
          try {
            const { stdout: inspectOut } = await execAsync(
              `docker inspect ${stored.containerId} --format='{{.State.Status}}' 2>/dev/null || echo "notfound"`
            )
            const containerStatus = inspectOut.trim()
            
            if (containerStatus === 'exited') {
              // Check exit code
              const { stdout: exitCodeOut } = await execAsync(
                `docker inspect ${stored.containerId} --format='{{.State.ExitCode}}' 2>/dev/null || echo "1"`
              )
              const exitCode = parseInt(exitCodeOut.trim())
              
              if (exitCode === 0) {
                updateTestStatus(testId, 'completed')
                stored.status = 'completed'
              } else {
                updateTestStatus(testId, 'error')
                stored.status = 'error'
              }
            } else if (containerStatus === 'notfound') {
              // Container was removed (--rm flag), assume completed
              updateTestStatus(testId, 'completed')
              stored.status = 'completed'
            }
          } catch {
            // Container might have been removed, assume completed
            updateTestStatus(testId, 'completed')
            stored.status = 'completed'
          }
        }
      } catch (error) {
        // Error checking container, but don't fail the request
        console.error('Error checking container status:', error)
      }
    }
    
    return NextResponse.json({
      testId,
      status: stored.status,
      startedAt: stored.startedAt,
    })
  } catch (error) {
    console.error('Error in test-status API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

