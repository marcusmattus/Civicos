import { z } from 'zod'
import { REPORT_TYPES, SCENARIO_KEYS } from './types'

export const scenarioKeySchema = z.enum(SCENARIO_KEYS)

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your government email address')
    .email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const mfaSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type MfaInput = z.infer<typeof mfaSchema>

export const createSimulationSchema = z.object({
  title: z.string().min(3, 'Give the simulation a title').max(120),
  prompt: z.string().min(10, 'Describe the system you want to model'),
  geographySlug: z.string().min(1),
  budgetGbp: z.number().nonnegative(),
  baselineYear: z.number().int().min(2020).max(2050),
  endYear: z.number().int().min(2021).max(2060),
  industrySlugs: z.array(z.string()).default([]),
  instrumentSlugs: z.array(z.string()).default([]),
})

export type CreateSimulationInput = z.infer<typeof createSimulationSchema>

export const patchSimulationSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  prompt: z.string().min(10).optional(),
  geographySlug: z.string().optional(),
  budgetGbp: z.number().nonnegative().optional(),
  baselineYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  industrySlugs: z.array(z.string()).optional(),
  instrumentSlugs: z.array(z.string()).optional(),
  activeScenario: scenarioKeySchema.optional(),
  scenarios: z.record(z.string(), z.any()).optional(),
  graph: z.any().optional(),
  status: z
    .enum(['draft', 'validated', 'running', 'complete', 'cancelled', 'failed', 'awaiting_approval'])
    .optional(),
})

export const runSchema = z.object({
  scenario: scenarioKeySchema,
})

export const approveSchema = z.object({
  decision: z.enum(['Approved', 'Denied']),
  note: z.string().max(500).optional(),
})

export const exportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  format: z.enum(['pdf', 'csv', 'json']),
  scenario: scenarioKeySchema,
})

export type ExportInput = z.infer<typeof exportSchema>
