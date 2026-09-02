const edges: Array<[number, number, number, number]> = [
  [80, 120, 200, 220],
  [200, 220, 330, 180],
  [330, 180, 460, 260],
  [200, 220, 240, 340],
  [240, 340, 150, 420],
  [240, 340, 360, 400],
  [360, 400, 460, 260],
  [360, 400, 420, 500],
  [150, 420, 120, 540],
  [420, 500, 330, 560],
  [330, 560, 150, 420],
]

const nodes: Array<[number, number, number]> = [
  [80, 120, 4],
  [200, 220, 6],
  [330, 180, 4],
  [460, 260, 5],
  [240, 340, 7],
  [150, 420, 4],
  [360, 400, 5],
  [120, 540, 4],
  [420, 500, 4],
  [330, 560, 5],
]

/** Decorative system-graph artwork on the sign-in panel. */
export function NetworkArt() {
  return (
    <div className="relative mt-10 flex-1">
      <svg viewBox="0 0 560 640" className="absolute inset-0 h-full w-full opacity-90" aria-hidden="true">
        <g stroke="#2563eb" strokeWidth="1" opacity="0.5">
          {edges.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <g fill="#06b6d4">
          {nodes.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>

      <div className="absolute top-8 right-10 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
        <div className="h-3.5 w-3.5 rounded-[3px] border-2 border-cyan" />
      </div>
      <div className="absolute bottom-36 left-16 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
        <div className="h-3.5 w-3.5 rounded-full border-2 border-teal" />
      </div>
      <div className="absolute right-20 bottom-16 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
        <div className="h-2.5 w-3.5 rounded-[2px] border-2 border-civic" />
      </div>
    </div>
  )
}
