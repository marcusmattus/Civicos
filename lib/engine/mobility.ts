/**
 * Deterministic MobilitySim model.
 *
 * Maps the licensing and operating controls onto the eight reported outcomes.
 * Like the forecast engine, there is no randomness: the same controls always
 * produce the same outcomes, so a sandbox result can be cited and reproduced.
 *
 * Every relationship is illustrative and monotone in its drivers. Replace
 * `simulateMobility` with the real transport model; the returned shape is what
 * the UI renders.
 */

export type VehicleClass =
  | 'autonomous-cab'
  | 'robotaxi'
  | 'black-cab'
  | 'private-hire'
  | 'autonomous-bus'
  | 'delivery-fleet'
  | 'conventional'

export type MobilityControls = {
  /** Licensed autonomous vehicles operating in the zone. */
  fleetSize: number
  /** Hours per day the licence permits operation. */
  operatingHours: number
  /** Base passenger fare, £ per journey. */
  fare: number
  /** Minimum share of the fleet that must be wheelchair accessible, %. */
  accessibilityQuota: number
  /** Share of vehicle miles run empty, %. */
  emptyMileage: number
  /** Charge applied per mile in the congestion zone, £. */
  congestionCharge: number
  /** Insurance cover carried per vehicle, £m. */
  insuranceCover: number
  /** Remote operators on duty per 100 vehicles. */
  remoteOperators: number
  /** Licence strictness. */
  licensingConditions: 'Light' | 'Standard' | 'Strict'
  /** Safety case required before operation. */
  safetyRequirements: 'Baseline' | 'Enhanced' | 'Full independent audit'
}

export const DEFAULT_CONTROLS: MobilityControls = {
  fleetSize: 2400,
  operatingHours: 18,
  fare: 3.2,
  accessibilityQuota: 15,
  emptyMileage: 22,
  congestionCharge: 2,
  insuranceCover: 5,
  remoteOperators: 8,
  licensingConditions: 'Standard',
  safetyRequirements: 'Enhanced',
}

const LICENSING_WEIGHT: Record<MobilityControls['licensingConditions'], number> = {
  Light: 0.3,
  Standard: 0.6,
  Strict: 1,
}

const SAFETY_WEIGHT: Record<MobilityControls['safetyRequirements'], number> = {
  Baseline: 0.3,
  Enhanced: 0.65,
  'Full independent audit': 1,
}

export type MobilityOutcome = {
  id: string
  label: string
  value: number
  unit: string
  /** Formatted for display, including sign where it carries meaning. */
  display: string
  /** Change against the do-nothing baseline, already formatted. */
  change: string
  tone: 'positive' | 'negative' | 'warning' | 'neutral'
  note: string
}

export type FleetMixEntry = {
  vehicleClass: VehicleClass
  label: string
  vehicles: number
  share: number
}

/** Baseline (no autonomous licensing) values the outcomes are compared against. */
const BASELINE = {
  waitMinutes: 7.4,
  fare: 3.9,
  congestion: 0,
  emptyMileage: 12,
  employment: 0,
  publicTransport: 0,
  energy: 0,
  safety: 0,
}

function round(value: number, dp = 1): number {
  const f = 10 ** dp
  return Math.round(value * f) / f
}

/**
 * Fleet composition implied by the licensed autonomous fleet. Conventional
 * classes give way as autonomous supply grows, but never disappear entirely.
 */
export function fleetMix(controls: MobilityControls): FleetMixEntry[] {
  const autonomous = Math.max(0, controls.fleetSize)
  // Displacement saturates: the first vehicles displace most, later ones less.
  const displacement = 1 - Math.exp(-autonomous / 4200)

  const entries: { vehicleClass: VehicleClass; label: string; vehicles: number }[] = [
    { vehicleClass: 'autonomous-cab', label: 'Autonomous cabs', vehicles: Math.round(autonomous * 0.58) },
    { vehicleClass: 'robotaxi', label: 'Robotaxis', vehicles: Math.round(autonomous * 0.24) },
    { vehicleClass: 'autonomous-bus', label: 'Autonomous buses', vehicles: Math.round(autonomous * 0.08) },
    {
      vehicleClass: 'delivery-fleet',
      label: 'Delivery fleets',
      vehicles: Math.round(autonomous * 0.1 + 900),
    },
    {
      vehicleClass: 'black-cab',
      label: 'Black cabs',
      vehicles: Math.round(14_200 * (1 - 0.42 * displacement)),
    },
    {
      vehicleClass: 'private-hire',
      label: 'Private-hire vehicles',
      vehicles: Math.round(87_000 * (1 - 0.35 * displacement)),
    },
    {
      vehicleClass: 'conventional',
      label: 'Conventional vehicles',
      vehicles: Math.round(2_600_000 * (1 - 0.04 * displacement)),
    },
  ]

  const total = entries.reduce((sum, entry) => sum + entry.vehicles, 0) || 1
  return entries.map((entry) => ({ ...entry, share: round((entry.vehicles / total) * 100, 2) }))
}

export function simulateMobility(controls: MobilityControls): MobilityOutcome[] {
  const licensing = LICENSING_WEIGHT[controls.licensingConditions]
  const safety = SAFETY_WEIGHT[controls.safetyRequirements]

  // Supply per operating hour drives how quickly a passenger is matched.
  const supply = (controls.fleetSize * controls.operatingHours) / 1000
  const waitMinutes = Math.max(1.6, 9.4 - 1.9 * Math.log(1 + supply) + 0.9 * licensing)

  // Fare: scale economies pull it down, compliance costs push it back up.
  const fare =
    controls.fare +
    0.35 * licensing +
    0.006 * controls.accessibilityQuota +
    0.02 * controls.insuranceCover +
    0.03 * controls.remoteOperators -
    0.00012 * controls.fleetSize

  // Congestion: more vehicles and more deadheading add traffic; charging removes it.
  const congestion =
    0.0022 * controls.fleetSize +
    0.16 * controls.emptyMileage -
    1.9 * controls.congestionCharge -
    2.4 * licensing

  const emptyMileage = Math.max(
    3,
    controls.emptyMileage - 2.1 * controls.congestionCharge - 1.4 * licensing,
  )

  // Employment: driver displacement against operator and maintenance roles.
  const employment =
    -0.0042 * controls.fleetSize + 0.42 * controls.remoteOperators + 6 * safety

  // Public transport: cheap door-to-door trips abstract from bus and rail.
  const publicTransport = -0.0016 * controls.fleetSize + 1.4 * controls.congestionCharge + 0.9 * licensing

  // Energy: electrified fleet, but empty running still costs power.
  const energy = 0.0019 * controls.fleetSize + 0.07 * controls.emptyMileage - 0.4 * licensing

  // Safety: audit depth and remote supervision reduce incidents per million miles.
  const safetyOutcome = -(1.9 * safety) - 0.06 * controls.remoteOperators + 0.00028 * controls.fleetSize

  const outcomes: MobilityOutcome[] = [
    {
      id: 'wait-time',
      label: 'Passenger wait time',
      value: round(waitMinutes, 1),
      unit: 'min',
      display: `${round(waitMinutes, 1)} min`,
      change: formatDelta(waitMinutes - BASELINE.waitMinutes, 'min', 1),
      tone: waitMinutes < BASELINE.waitMinutes ? 'positive' : 'warning',
      note: 'Median wait from request to pickup in the licensed zone.',
    },
    {
      id: 'fare',
      label: 'Average fare',
      value: round(fare, 2),
      unit: '£/journey',
      display: `£${round(fare, 2).toFixed(2)}`,
      change: formatDelta(fare - BASELINE.fare, '£', 2),
      tone: fare < BASELINE.fare ? 'positive' : 'warning',
      note: 'Mean passenger fare for a 3.2 mile journey.',
    },
    {
      id: 'congestion',
      label: 'Congestion',
      value: round(congestion, 1),
      unit: '% vehicle hours',
      display: `${congestion > 0 ? '+' : ''}${round(congestion, 1)}%`,
      change: `${congestion > 0 ? '↑' : '↓'} ${Math.abs(round(congestion, 1))} pts vs baseline`,
      tone: congestion <= 0 ? 'positive' : congestion > 6 ? 'negative' : 'warning',
      note: 'Vehicle hours in the central congestion zone.',
    },
    {
      id: 'empty-mileage',
      label: 'Empty mileage',
      value: round(emptyMileage, 1),
      unit: '% of miles',
      display: `${round(emptyMileage, 1)}%`,
      change: formatDelta(emptyMileage - BASELINE.emptyMileage, 'pts', 1),
      tone: emptyMileage <= 15 ? 'positive' : emptyMileage > 25 ? 'negative' : 'warning',
      note: 'Share of vehicle miles run without a passenger.',
    },
    {
      id: 'employment',
      label: 'Employment effects',
      value: round(employment, 1),
      unit: 'K jobs',
      display: `${employment > 0 ? '+' : ''}${round(employment, 1)}K`,
      change: `${employment > 0 ? '↑' : '↓'} ${Math.abs(round(employment, 1))}K vs baseline`,
      tone: employment >= 0 ? 'positive' : employment < -8 ? 'negative' : 'warning',
      note: 'Net licensed-driver, operator and maintenance roles.',
    },
    {
      id: 'public-transport',
      label: 'Public-transport effects',
      value: round(publicTransport, 1),
      unit: '% patronage',
      display: `${publicTransport > 0 ? '+' : ''}${round(publicTransport, 1)}%`,
      change: `${publicTransport > 0 ? '↑' : '↓'} ${Math.abs(round(publicTransport, 1))} pts vs baseline`,
      tone: publicTransport >= 0 ? 'positive' : 'warning',
      note: 'Bus and rail patronage in the licensed zone.',
    },
    {
      id: 'energy',
      label: 'Energy demand',
      value: round(energy, 1),
      unit: 'GWh/yr',
      display: `${round(energy, 1)} GWh`,
      change: formatDelta(energy - BASELINE.energy, 'GWh', 1),
      tone: energy <= 4 ? 'positive' : 'warning',
      note: 'Additional annual charging demand on the local grid.',
    },
    {
      id: 'safety',
      label: 'Safety outcomes',
      value: round(safetyOutcome, 2),
      unit: 'incidents/Mmi',
      display: `${safetyOutcome > 0 ? '+' : ''}${round(safetyOutcome, 2)}`,
      change: `${safetyOutcome > 0 ? '↑' : '↓'} ${Math.abs(round(safetyOutcome, 2))} per million miles`,
      tone: safetyOutcome <= 0 ? 'positive' : safetyOutcome > 0.5 ? 'negative' : 'warning',
      note: 'Reportable incidents per million vehicle miles vs baseline.',
    },
  ]

  return outcomes
}

function formatDelta(delta: number, unit: string, dp: number): string {
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '–'
  const magnitude = Math.abs(delta).toFixed(dp)
  if (unit === '£') return `${arrow} £${magnitude} vs baseline`
  return `${arrow} ${magnitude} ${unit} vs baseline`
}

/** Licence conditions that the current control settings would breach. */
export function licensingWarnings(controls: MobilityControls): string[] {
  const warnings: string[] = []

  if (controls.accessibilityQuota < 10) {
    warnings.push(
      'Accessibility quota below 10% falls short of the current licensed-taxi standard.',
    )
  }
  if (controls.remoteOperators < 4 && controls.safetyRequirements === 'Baseline') {
    warnings.push(
      'Fewer than 4 remote operators per 100 vehicles with only a baseline safety case is unlikely to be licensable.',
    )
  }
  if (controls.emptyMileage > 30 && controls.congestionCharge < 1) {
    warnings.push('High empty mileage with almost no empty-vehicle charge will rebound congestion.')
  }
  if (controls.insuranceCover < 2) {
    warnings.push('Insurance cover below £2m per vehicle is below the statutory minimum for the sandbox.')
  }
  if (controls.operatingHours > 20 && controls.remoteOperators < 6) {
    warnings.push('Near-24-hour operation needs more remote-operator coverage for handover incidents.')
  }

  return warnings
}
