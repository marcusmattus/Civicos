import type { Role } from '../types'

/** Actions that are gated by role. */
export const ACTIONS = [
  'simulation:create',
  'simulation:run',
  'simulation:approve',
  'simulation:export',
  'dataset:manage',
  'model:publish',
  'audit:read',
  'settings:manage',
] as const

export type Action = (typeof ACTIONS)[number]

const MATRIX: Record<Role, Action[]> = {
  analyst: ['simulation:create', 'simulation:run', 'simulation:export', 'audit:read'],
  data_steward: ['dataset:manage', 'audit:read'],
  model_developer: ['model:publish', 'simulation:run', 'audit:read'],
  policy_reviewer: ['simulation:run', 'simulation:export', 'audit:read'],
  approver: ['simulation:approve', 'simulation:export', 'audit:read'],
  auditor: ['audit:read'],
  administrator: [...ACTIONS],
}

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action)
}

export function actionsFor(role: Role): Action[] {
  return MATRIX[role]
}

export const ACTION_LABELS: Record<Action, string> = {
  'simulation:create': 'Create simulations',
  'simulation:run': 'Run simulations',
  'simulation:approve': 'Approve high-impact simulations',
  'simulation:export': 'Export reports',
  'dataset:manage': 'Manage dataset governance',
  'model:publish': 'Publish and version models',
  'audit:read': 'Read the audit record',
  'settings:manage': 'Manage organisation settings',
}
