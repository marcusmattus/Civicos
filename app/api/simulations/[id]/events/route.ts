import { getRun, subscribe } from '@/lib/services/run-engine'
import type { RunState } from '@/lib/types'

type Context = { params: Promise<{ id: string }> }

/** Keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 15_000

/**
 * Server-Sent Events stream of run state.
 *
 * Emits the current state immediately on connect, then on every engine tick,
 * and closes once the run reaches a terminal state.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const encoder = new TextEncoder()

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

      const current = getRun(id)
      if (current) {
        onState(current)
      } else {
        send('idle', { simulationId: id })
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
