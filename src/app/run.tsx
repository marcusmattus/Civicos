import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { agentNames } from '../data/civic'

/** Matches the prototype's timer: +7% every 350ms, so a run takes ~5s. */
const STEP_PCT = 7
const STEP_MS = 350

export type AgentStatus = 'Queued' | 'Running' | 'Complete'

export type AgentProgress = {
  name: string
  pct: number
  status: AgentStatus
}

type RunValue = {
  progress: number
  complete: boolean
  started: boolean
  etaMinutes: number
  agents: AgentProgress[]
  start: () => void
}

const RunContext = createContext<RunValue | null>(null)

/**
 * Derives per-agent progress from overall run progress: agent `i` occupies an
 * 11% band, so agents light up in sequence as the run advances.
 */
function agentsFor(progress: number): AgentProgress[] {
  return agentNames.map((name, i) => {
    const threshold = i * 11
    if (progress >= threshold + 11) return { name, pct: 100, status: 'Complete' }
    if (progress > threshold) {
      return { name, pct: Math.round(((progress - threshold) / 11) * 100), status: 'Running' }
    }
    return { name, pct: 0, status: 'Queued' }
  })
}

export function RunProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const timer = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  const start = useCallback(() => {
    clear()
    setStarted(true)
    setProgress(0)
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + STEP_PCT)
        if (next >= 100) clear()
        return next
      })
    }, STEP_MS)
  }, [clear])

  // Stop the interval if the provider unmounts mid-run.
  useEffect(() => clear, [clear])

  const value = useMemo<RunValue>(
    () => ({
      progress,
      complete: progress >= 100,
      started,
      etaMinutes: Math.max(0, Math.round((100 - progress) / 12)),
      agents: agentsFor(progress),
      start,
    }),
    [progress, started, start],
  )

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

export function useRun() {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error('useRun must be used inside a RunProvider')
  return ctx
}
