'use client'

import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useEffect, useRef } from 'react'

/**
 * Thin ECharts wrapper: creates one instance per mount, keeps it sized to its
 * container, and honours a reduced-motion preference.
 *
 * Charts are decorative to assistive tech — every chart on a screen is paired
 * with the same numbers in a table or list, so the canvas is hidden and an
 * accessible summary is provided by the caller.
 */
export function EChart({
  option,
  height = 280,
  ariaLabel,
}: {
  option: EChartsOption
  height?: number
  ariaLabel: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!container.current) return
    const instance = echarts.init(container.current, undefined, { renderer: 'canvas' })
    chart.current = instance

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)

    return () => {
      observer.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    if (!chart.current) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    chart.current.setOption({ ...option, animation: !reduceMotion }, true)
  }, [option])

  return (
    <div
      ref={container}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className="w-full"
    />
  )
}
