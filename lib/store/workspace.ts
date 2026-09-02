'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_PROMPT, DEMO_SIMULATION_ID, demoScenarios } from '../data/demo'
import type { ModelGraph, ScenarioConfig, ScenarioKey } from '../types'

/**
 * The analyst's working state for the simulation being assembled.
 *
 * Persisted to sessionStorage so a refresh mid-workflow doesn't lose the draft
 * (the "autosave" and "unsaved changes" states in the spec).
 */
type WorkspaceState = {
  simulationId: string
  title: string
  prompt: string
  geographySlug: string
  budgetBn: number
  baselineYear: number
  endYear: number
  industrySlugs: string[]
  instrumentSlugs: string[]
  scenarios: Record<ScenarioKey, ScenarioConfig>
  activeScenario: ScenarioKey
  graph: ModelGraph | null
  dirty: boolean
  lastSavedAt: string | null

  setPrompt: (prompt: string) => void
  setTitle: (title: string) => void
  setGeography: (slug: string) => void
  setBudget: (bn: number) => void
  setHorizon: (baselineYear: number, endYear: number) => void
  toggleIndustry: (slug: string) => void
  toggleInstrument: (slug: string) => void
  setIndustries: (slugs: string[]) => void
  setInstruments: (slugs: string[]) => void
  setActiveScenario: (key: ScenarioKey) => void
  setLeverValue: (key: ScenarioKey, leverId: string, value: number | string) => void
  setScenarioNotes: (key: ScenarioKey, notes: string) => void
  resetScenario: (key: ScenarioKey) => void
  setGraph: (graph: ModelGraph) => void
  markSaved: () => void
  reset: () => void
}

const initial = {
  simulationId: DEMO_SIMULATION_ID,
  title: 'London AI Transition',
  prompt: DEMO_PROMPT,
  geographySlug: 'greater-london',
  budgetBn: 10,
  baselineYear: 2027,
  endYear: 2040,
  industrySlugs: ['transport', 'healthcare', 'employment'],
  instrumentSlugs: ['regulation', 'licensing', 'public-spending', 'ubi', 'workforce-training'],
  scenarios: demoScenarios(),
  activeScenario: 'expected' as ScenarioKey,
  graph: null,
  dirty: false,
  lastSavedAt: null,
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initial,

      setPrompt: (prompt) => set({ prompt, dirty: true }),
      setTitle: (title) => set({ title, dirty: true }),
      setGeography: (geographySlug) => set({ geographySlug, dirty: true }),
      setBudget: (budgetBn) => set({ budgetBn, dirty: true }),
      setHorizon: (baselineYear, endYear) => set({ baselineYear, endYear, dirty: true }),

      toggleIndustry: (slug) =>
        set((s) => ({
          industrySlugs: s.industrySlugs.includes(slug)
            ? s.industrySlugs.filter((v) => v !== slug)
            : [...s.industrySlugs, slug],
          dirty: true,
        })),

      toggleInstrument: (slug) =>
        set((s) => ({
          instrumentSlugs: s.instrumentSlugs.includes(slug)
            ? s.instrumentSlugs.filter((v) => v !== slug)
            : [...s.instrumentSlugs, slug],
          dirty: true,
        })),

      setIndustries: (industrySlugs) => set({ industrySlugs, dirty: true }),
      setInstruments: (instrumentSlugs) => set({ instrumentSlugs, dirty: true }),
      setActiveScenario: (activeScenario) => set({ activeScenario }),

      setLeverValue: (key, leverId, value) =>
        set((s) => ({
          scenarios: {
            ...s.scenarios,
            [key]: { ...s.scenarios[key], values: { ...s.scenarios[key].values, [leverId]: value } },
          },
          dirty: true,
        })),

      setScenarioNotes: (key, notes) =>
        set((s) => ({
          scenarios: { ...s.scenarios, [key]: { ...s.scenarios[key], notes } },
          dirty: true,
        })),

      resetScenario: (key) =>
        set((s) => ({
          scenarios: { ...s.scenarios, [key]: demoScenarios()[key] },
          dirty: true,
        })),

      setGraph: (graph) => set({ graph, dirty: true }),
      markSaved: () => set({ dirty: false, lastSavedAt: new Date().toISOString() }),
      reset: () => set({ ...initial, scenarios: demoScenarios() }),
    }),
    {
      name: 'civicos.workspace',
      storage: {
        getItem: (name) => {
          try {
            const raw = sessionStorage.getItem(name)
            return raw ? JSON.parse(raw) : null
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value))
          } catch {
            /* storage unavailable — state stays in memory */
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name)
          } catch {
            /* no-op */
          }
        },
      },
    },
  ),
)

/** Simulation shape the engine expects, built from the working state. */
export function workspaceToSimulation(state: WorkspaceState) {
  return {
    id: state.simulationId,
    title: state.title,
    prompt: state.prompt,
    geographySlug: state.geographySlug,
    budgetGbp: state.budgetBn * 1e9,
    baselineYear: state.baselineYear,
    endYear: state.endYear,
    industrySlugs: state.industrySlugs,
    instrumentSlugs: state.instrumentSlugs,
    scenarios: state.scenarios,
    activeScenario: state.activeScenario,
  }
}
