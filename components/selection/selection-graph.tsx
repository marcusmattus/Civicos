'use client'

import { industries, policyInstruments } from '@/lib/data/catalogue'

const COLUMN_X = { geography: 40, industry: 150, instrument: 275 }
const ROW_HEIGHT = 30
const TOP = 22

/**
 * Compact read-only view of the selected system: geography feeds industries,
 * which are acted on by the selected instruments. Purely informational, so it
 * is exposed to assistive tech as a labelled image with a text summary.
 */
export function SelectionGraph({
  geographyLabel,
  industrySlugs,
  instrumentSlugs,
}: {
  geographyLabel: string
  industrySlugs: string[]
  instrumentSlugs: string[]
}) {
  const selectedIndustries = industries.filter((i) => industrySlugs.includes(i.slug))
  const selectedInstruments = policyInstruments.filter((p) => instrumentSlugs.includes(p.slug))

  if (selectedIndustries.length === 0 && selectedInstruments.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-xs text-muted">
        Nothing selected yet. Pick an industry to see the system take shape.
      </div>
    )
  }

  const rows = Math.max(selectedIndustries.length, selectedInstruments.length, 1)
  const height = TOP + rows * ROW_HEIGHT + 20
  const geographyY = TOP + ((rows - 1) * ROW_HEIGHT) / 2

  const summary = `${geographyLabel} feeding ${selectedIndustries.length} industries and ${selectedInstruments.length} policy instruments`

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 380 ${height}`}
        className="h-auto w-full min-w-[300px]"
        role="img"
        aria-label={summary}
      >
        {/* geography → industry links */}
        {selectedIndustries.map((industry, i) => (
          <path
            key={`link-geo-${industry.id}`}
            d={`M ${COLUMN_X.geography + 34} ${geographyY} C ${COLUMN_X.industry - 20} ${geographyY}, ${COLUMN_X.industry - 20} ${TOP + i * ROW_HEIGHT}, ${COLUMN_X.industry - 4} ${TOP + i * ROW_HEIGHT}`}
            fill="none"
            stroke="#c7cedb"
            strokeWidth="1"
          />
        ))}

        {/* industry → instrument links, fanned from the middle industry */}
        {selectedInstruments.map((instrument, i) => {
          const fromY = TOP + (Math.min(i, Math.max(0, selectedIndustries.length - 1)) * ROW_HEIGHT)
          return (
            <path
              key={`link-inst-${instrument.id}`}
              d={`M ${COLUMN_X.industry + 78} ${fromY} C ${COLUMN_X.instrument - 20} ${fromY}, ${COLUMN_X.instrument - 20} ${TOP + i * ROW_HEIGHT}, ${COLUMN_X.instrument - 4} ${TOP + i * ROW_HEIGHT}`}
              fill="none"
              stroke="#c7cedb"
              strokeWidth="1"
            />
          )
        })}

        <g>
          <rect
            x={COLUMN_X.geography - 34}
            y={geographyY - 11}
            width="72"
            height="22"
            rx="4"
            fill="#eef4ff"
            stroke="#2563eb"
          />
          <text
            x={COLUMN_X.geography + 2}
            y={geographyY + 4}
            textAnchor="middle"
            fontSize="9"
            fill="#1d4ed8"
            fontWeight="600"
          >
            {geographyLabel.length > 14 ? `${geographyLabel.slice(0, 13)}…` : geographyLabel}
          </text>
        </g>

        {selectedIndustries.map((industry, i) => (
          <g key={industry.id}>
            <rect
              x={COLUMN_X.industry - 4}
              y={TOP + i * ROW_HEIGHT - 10}
              width="82"
              height="20"
              rx="4"
              fill="#ffffff"
              stroke="#d8dee8"
            />
            <text
              x={COLUMN_X.industry + 37}
              y={TOP + i * ROW_HEIGHT + 4}
              textAnchor="middle"
              fontSize="9"
              fill="#152033"
            >
              {industry.name}
            </text>
          </g>
        ))}

        {selectedInstruments.map((instrument, i) => (
          <g key={instrument.id}>
            <rect
              x={COLUMN_X.instrument - 4}
              y={TOP + i * ROW_HEIGHT - 10}
              width="100"
              height="20"
              rx="4"
              fill="#ecfdf5"
              stroke="#b7ebd6"
            />
            <text
              x={COLUMN_X.instrument + 46}
              y={TOP + i * ROW_HEIGHT + 4}
              textAnchor="middle"
              fontSize="9"
              fill="#0f9d83"
            >
              {instrument.name}
            </text>
          </g>
        ))}
      </svg>

      <p className="sr-only">{summary}</p>
    </div>
  )
}
