import type { DataClassification, Forecast, LeverDef } from './types'

export function formatCurrencyBn(value: number): string {
  const sign = value < 0 ? '−' : ''
  return `${sign}£${Math.abs(value).toFixed(1)}bn`
}

export function formatLeverValue(def: LeverDef, value: number | string): string {
  if (typeof value === 'string') return value
  switch (def.kind) {
    case 'percent':
      return `${value}%`
    case 'currency':
      return def.unit === '£/mile' ? `£${value.toFixed(2)}/mile` : `£${value.toLocaleString('en-GB')}`
    case 'currency-bn':
      return `£${value}bn`
    case 'year':
      return String(value)
    default:
      return String(value)
  }
}

export function formatMetricValue(forecast: Pick<Forecast, 'unit' | 'p50'>): string {
  const { unit, p50 } = forecast
  if (unit === '£bn') return formatCurrencyBn(p50)
  if (unit === '£/journey') return `£${p50.toFixed(2)}`
  if (unit === 'K jobs') return `${p50 > 0 ? '+' : ''}${Math.round(p50)}K`
  if (unit.startsWith('%')) return `${p50 > 0 ? '+' : ''}${p50.toFixed(1)}%`
  if (unit === 'MtCO₂e') return `${p50.toFixed(2)} Mt`
  return `${p50}`
}

export function formatRange(forecast: Forecast): string {
  const fmt = (v: number) => formatMetricValue({ unit: forecast.unit, p50: v })
  return `${fmt(forecast.p10)} – ${fmt(forecast.p90)}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false })
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

/**
 * Statuses are never signalled by colour alone (WCAG 2.2 AA) — each carries a
 * text label and a distinct glyph.
 */
export const CLASSIFICATION_GLYPH: Record<DataClassification, string> = {
  OBSERVED: '◆',
  DERIVED: '◇',
  IMPUTED: '◈',
  SYNTHETIC: '⬡',
  FORECAST: '◐',
  SCENARIO_ASSUMPTION: '◑',
}

export const CLASSIFICATION_HELP: Record<DataClassification, string> = {
  OBSERVED: 'Measured directly from an official source.',
  DERIVED: 'Computed from observed data through a documented transformation.',
  IMPUTED: 'Estimated to fill gaps in otherwise observed data.',
  SYNTHETIC: 'Artificially generated; never combined with observed data in one figure.',
  FORECAST: 'Model projection with an explicit uncertainty band.',
  SCENARIO_ASSUMPTION: 'An input chosen by the analyst, not an observation.',
}
