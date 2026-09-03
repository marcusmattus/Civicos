import { scenarioKeySchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import { getRun, startRun, subscribe } from '@/lib/services/run-engine'
import type { RunState } from '@/lib/types'

type Context = { params: Promise<{ id: string }> }

/** Keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 15_000

// The stream must not be cached or statically rendered, and it needs to stay
// open for the length of a run.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Server-Sent Events stream of run state.
 *
 * Emits the current state immediately on connect, then on every engine tick,
 * and closes once the run reaches a terminal state.
 *
 * If no run exists on this instance, the stream starts one. Run state lives in
 * process memory, so on a serverless platform the instance that handled
 * `POST /run` may not be the one serving this stream — letting the stream own
 * the run keeps the whole lifecycle on a single long-lived connection. Pass
 * `?scenario=` to say which scenario to run; the simulation's active scenario
 * is used otherwise.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const encoder = new TextEncoder()

  // Resolve a startable run before opening the stream, so a missing simulation
  // is reported as a 404 rather than an empty stream.
  let starting: RunState | null = null
  if (!getRun(id)) {
    const simulation = await repository().getSimulation(id)
    if (simulation) {
      const requested = new URL(request.url).searchParams.get('scenario')
      const scenario = scenarioKeySchema.safeParse(requested).success
        ? scenarioKeySchema.parse(requested)
        : simulation.activeScenario
      starting = startRun(simulation, scenario)
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      const finish = () => {
        if (closed) return
        closed = true
        unsubscribe()
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      const onState = (state: RunState) => {
        send('run', state)
        if (state.status !== 'running') {
          send('done', { status: state.status })
          finish()
        }
      }

      const unsubscribe = subscribe(id, onState)

      const heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'))
        } catch {
          finish()
        }
      }, HEARTBEAT_MS)

      const current = getRun(id) ?? starting
      if (current) {
        onState(current)
      } else {
        // No run and no simulation to start one from.
        send('idle', { simulationId: id })
        finish()
      }

      request.signal.addEventListener('abort', finish)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering so events arrive as they are produced.
      'X-Accel-Buffering': 'no',
    },
  })
}
