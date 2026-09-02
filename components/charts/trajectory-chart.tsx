'use client'

import type { EChartsOption } from 'echarts'
import { useMemo } from 'react'
import { metricById } from '@/lib/data/catalogue'
import type { TrajectoryPoint } from '@/lib/types'
import { EChart } from './echart'

/**
 * Median trajectory with a P10–P90 confidence band, drawn as a stacked
 * transparent lower bound plus a filled band — the standard ECharts idiom for
 * uncertainty ribbons.
 */
export function TrajectoryChart({
  points,
  metricId,
  height = 300,
}: {
  points: TrajectoryPoint[]
  metricId: string
  height?: number
}) {
  const metric = metricById.get(metricId)

  const option = useMemo<EChartsOption>(() => {
    const years = points.map((p) => String(p.year))
    const lower = points.map((p) => p.p10)
    const bandWidth = points.map((p) => Number((p.p90 - p.p10).toFixed(3)))
    const median = points.map((p) => p.p50)
    const baseline = points.map((p) => p.baseline)

    return {
      grid: { left: 52, right: 16, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        borderColor: '#d8dee8',
        backgroundColor: '#ffffff',
        textStyle: { color: '#152033', fontSize: 12 },
        formatter: (params: unknown) => {
          const rows = params as { axisValue: string; dataIndex: number }[]
          const i = rows[0]?.dataIndex ?? 0
          const point = points[i]
          if (!point) return ''
          const unit = metric?.unit ?? ''
          return [
            `<strong>${point.year}</strong>`,
            `P50 (median): ${point.p50} ${unit}`,
            `P10–P90: ${point.p10} – ${point.p90} ${unit}`,
            `Baseline: ${point.baseline} ${unit}`,
          ].join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: '#d8dee8' } },
        axisLabel: { color: '#98a2b3', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: metric?.unit,
        nameTextStyle: { color: '#98a2b3', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f0f2f6' } },
        axisLabel: { color: '#98a2b3', fontSize: 11 },
      },
      series: [
        {
          name: 'P10',
          type: 'line',
          data: lower,
          lineStyle: { opacity: 0 },
          stack: 'confidence',
          symbol: 'none',
          silent: true,
        },
        {
          name: 'P10–P90',
          type: 'line',
          data: bandWidth,
          lineStyle: { opacity: 0 },
          areaStyle: { color: '#2563eb', opacity: 0.12 },
          stack: 'confidence',
          symbol: 'none',
          silent: true,
        },
        {
          name: 'Baseline',
          type: 'line',
          data: baseline,
          lineStyle: { color: '#98a2b3', type: 'dashed', width: 1 },
          symbol: 'none',
        },
        {
          name: 'P50 (median)',
          type: 'line',
          data: median,
          lineStyle: { color: '#2563eb', width: 2.5 },
          itemStyle: { color: '#2563eb' },
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: false,
        },
      ],
    }
  }, [points, metric])

  const first = points[0]
  const last = points[points.length - 1]
  const summary = first && last
    ? `${metric?.label ?? metricId} from ${first.year} to ${last.year}: median moves from ${first.p50} to ${last.p50} ${metric?.unit ?? ''}, with a P10–P90 range of ${last.p10} to ${last.p90} in the final year.`
    : 'No trajectory data.'

  return (
    <div>
      <EChart option={option} height={height} ariaLabel={summary} />
      <p className="sr-only">{summary}</p>
    </div>
  )
}
