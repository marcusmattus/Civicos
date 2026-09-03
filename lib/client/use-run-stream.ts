'use client'

import { useEffect, useRef, useState } from 'react'
import type { RunState, ScenarioKey } from '../types'

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'closed' | 'error'

/**
 * Subscribes to the Server-Sent Events run stream.
 *
 * The stream closes itself once the run reaches a terminal state; a dropped
 * connection before then is retried with a short backoff. `scenario` tells the
 * server which scenario to run if it has no run in progress for this
 * simulation — see the events route for why the stream can start one.
 */
export function useRunStream(
  simulationId: string | null,
  scenario?: ScenarioKey,
  enabled = true,
) {
  const [run, setRun] = useState<RunState | null>(null)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const sourceRef = useRef<EventSource | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (!simulationId || !enabled) {
      setStatus('idle')
      return
    }

    let cancelled = false

    const connect = () => {
      if (cancelled) return
      setStatus('connecting')

      const query = scenario ? `?scenario=${scenario}` : ''
      const source = new EventSource(`/api/simulations/${simulationId}/events${query}`)
      sourceRef.current = source

      source.addEventListener('run', (event) => {
        attemptsRef.current = 0
        setStatus('streaming')
        try {
          setRun(JSON.parse((event as MessageEvent<string>).data) as RunState)
        } catch {
          /* malformed frame — wait for the next tick */
        }
      })

      source.addEventListener('idle', () => {
        setStatus('streaming')
        setRun(null)
      })

      source.addEventListener('done', () => {
        setStatus('closed')
        source.close()
      })

      source.onerror = () => {
        source.close()
        if (cancelled) return
        // EventSource errors on normal close too; only retry a few times.
        if (attemptsRef.current >= 3) {
          setStatus('error')
          return
        }
        attemptsRef.current += 1
        retryRef.current = setTimeout(connect, 1000 * attemptsRef.current)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryRef.current) clearTimeout(retryRef.current)
      sourceRef.current?.close()
      sourceRef.current = null
    }
  }, [simulationId, scenario, enabled])

  return { run, status }
}
