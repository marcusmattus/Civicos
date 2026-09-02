/**
 * Mock data for the CivicOS frontend.
 *
 * Every value here is lifted from the CivicOS.dc.html design prototype so the
 * implemented screens match the design exactly. Swap these modules for API
 * calls when a backend exists.
 */

export type Simulation = {
  id: string
  title: string
  scenario: string
  updated: string
  status: 'Complete' | 'Running' | 'Draft'
  owner: string
}

export const simulations: Simulation[] = [
  {
    id: 'london-ai-transition',
    title: 'London AI Transition',
    scenario: 'Expected scenario',
    updated: 'Updated 2h ago',
    status: 'Complete',
    owner: 'J. Delacroix',
  },
  {
    id: 'uk-housing-acceleration',
    title: 'UK Housing Acceleration',
    scenario: 'Intervention scenario',
    updated: 'Updated 1d ago',
    status: 'Running',
    owner: 'S. Whitfield',
  },
  {
    id: 'net-zero-industry-plan',
    title: 'Net Zero Industry Plan',
    scenario: 'Conservative scenario',
    updated: 'Updated 3d ago',
    status: 'Draft',
    owner: 'M. Reyes',
  },
  {
    id: 'healthcare-capacity-review',
    title: 'Healthcare Capacity Review',
    scenario: 'Expected scenario',
    updated: 'Updated 5d ago',
    status: 'Complete',
    owner: 'A. Okafor',
  },
]

/** The Command Centre shows only the three most recent simulations. */
export const recentSimulations = simulations.slice(0, 3)

export const starterPrompts = [
  { title: 'Model the impact of AI on public services', years: '2027–2040' },
  { title: 'Assess a universal basic income for a major city', years: '2027–2040' },
  { title: 'Future of mobility with autonomous vehicles', years: '2027–2040' },
  { title: 'Evaluate healthcare system scenarios', years: '2027–2040' },
]

export const defaultPrompt =
  'Model how autonomous cabs, AI healthcare and a £1,000 monthly UBI could affect London between 2027 and 2040.'

export const promptChips = ['Greater London', '2027–2040', '£10bn envelope', '3 datasets']

/* ---------------------------------------------------------------- Model canvas */

export const pipelineNodes = [
  { label: 'Geography', sub: 'Greater London' },
  { label: 'Industries', sub: '7 selected' },
  { label: 'Policy instruments', sub: '4 selected' },
  { label: 'Assumptions', sub: '12 defined' },
  { label: 'Metrics', sub: '18 selected' },
]

export const modelIndustries = [
  { label: 'Healthcare', checked: true },
  { label: 'Mobility', checked: true },
  { label: 'Housing', checked: false },
  { label: 'Energy', checked: false },
  { label: 'Agriculture', checked: false },
  { label: 'Education', checked: true },
  { label: 'Employment', checked: true },
]

export const policyInstruments = [
  { label: 'Regulation', status: 'Active' },
  { label: 'Licensing', status: 'Active' },
  { label: 'Public spending', status: 'Active' },
  { label: 'UBI', status: 'Active' },
]

/** Canvas tiles: a 3×2 grid with policy instruments as the highlighted centre cell. */
export const canvasTiles = ['Healthcare', null, 'Economy', 'Mobility', 'Policy instruments', 'Society'] as const

/* ------------------------------------------------------------------ Scenarios */

export const scenarioTabs = ['Conservative', 'Expected', 'Accelerated', 'Intervention'] as const
export type ScenarioTab = (typeof scenarioTabs)[number]

export const assumptions = [
  { label: 'Economic growth (avg. p.a.)', value: '1.2%' },
  { label: 'Productivity growth (avg. p.a.)', value: '0.8%' },
  { label: 'Population growth (p.a.)', value: '0.4%' },
  { label: 'Technology adoption rate', value: 'Slow' },
  { label: 'Global energy price', value: 'High' },
  { label: 'Behavioural response', value: 'Low' },
  { label: 'Fiscal constraint', value: 'Tight' },
  { label: 'Regulatory readiness', value: 'High' },
]

export const levers = [
  { label: 'Autonomous-cab adoption by 2040', display: '25%', pct: 25 },
  { label: 'AI healthcare adoption by 2040', display: '35%', pct: 35 },
  { label: 'UBI value (per month)', display: '£600', pct: 60 },
  { label: 'Public investment (total)', display: '£10bn', pct: 70 },
  { label: 'Regulatory strictness', display: 'High', pct: 80 },
]

export const dependencyPreview =
  'These levers influence: Fiscal impact, Jobs changed, Congestion, Healthcare capacity, +6 more'

/* ------------------------------------------------------------------------ Run */

export const agentNames = [
  'Data Intelligence Agent',
  'Policy Analysis Agent',
  'Mobility Agent',
  'Healthcare Agent',
  'Economic Agent',
  'Employment Agent',
  'UBI Agent',
  'Risk Agent',
  'Audit Agent',
]

export const runEvents = [
  { time: '14:36:09', text: 'Mobility Model: ridership and road-network data loaded' },
  { time: '14:36:08', text: 'Policy Analysis: evaluated UBI fiscal impact pathways' },
  { time: '14:36:07', text: 'Data Intelligence: loaded ONS population projections' },
  { time: '14:36:05', text: 'Data Intelligence: verified 12 datasets' },
  { time: '14:35:58', text: 'Audit Agent: run parameters recorded' },
]

export const dataSources = [
  { name: 'ONS — Office for National Statistics', count: '8 datasets' },
  { name: 'TfL — Transport for London', count: '4 datasets' },
  { name: 'NHS Digital', count: '3 datasets' },
  { name: 'HMRC — HM Revenue & Customs', count: '2 datasets' },
]

export const simulationId = 'SM-2025-0057'

/* -------------------------------------------------------------------- Results */

export type Kpi = {
  label: string
  year: string
  value: string
  change: string
  tone: 'positive' | 'negative' | 'warning'
}

export const kpis: Kpi[] = [
  { label: 'Fiscal impact', year: '2040', value: '£-2.3bn', change: '↓ 1.3% of GDA', tone: 'negative' },
  { label: 'Jobs changed', year: '2040', value: '+142K', change: '↑ 3.6%', tone: 'positive' },
  { label: 'UBI funding gap', year: '2040', value: '£8.7bn', change: 'vs baseline', tone: 'warning' },
  { label: 'Average cab fare', year: '2040', value: '£3.20', change: '↑ 18%', tone: 'warning' },
  { label: 'Congestion', year: '2040', value: '-22%', change: 'vehicle hours', tone: 'positive' },
  { label: 'Healthcare capacity', year: '2040', value: '+18%', change: 'vs baseline', tone: 'positive' },
]

export const trajectoryYears = Array.from({ length: 14 }, (_, i) => String(2027 + i))

export const risks = [
  'Public acceptance of UBI',
  'Labour market displacement',
  'Data privacy and security',
  'Fiscal sustainability',
]

export const interventions = [
  'Phase UBI with work incentives',
  'Invest in reskilling programmes',
  'Strengthen data governance',
  'Dynamic pricing for congestion',
]

export const evidenceSummary = [
  { n: 12, label: 'Datasets' },
  { n: 5, label: 'Models' },
  { n: 8, label: 'Assumptions' },
  { n: 2, label: 'Approvals' },
]

/* ----------------------------------------------------------------- Industries */

export const industryCards = [
  { name: 'Healthcare', models: 4, datasets: 6, sims: 2 },
  { name: 'Transport', models: 5, datasets: 4, sims: 3 },
  { name: 'Housing', models: 2, datasets: 3, sims: 1 },
  { name: 'Energy', models: 3, datasets: 5, sims: 1 },
  { name: 'Agriculture', models: 2, datasets: 2, sims: 0 },
  { name: 'Education', models: 2, datasets: 3, sims: 0 },
  { name: 'Employment', models: 3, datasets: 4, sims: 2 },
  { name: 'Smart cities', models: 3, datasets: 3, sims: 1 },
  { name: 'Public finance', models: 4, datasets: 5, sims: 1 },
  { name: 'Social care', models: 2, datasets: 3, sims: 1 },
]

/* --------------------------------------------------------------- DataFoundry */

export type DatasetRow = {
  name: string
  source: string
  dept: string
  cls: string
  geo: string
  fresh: string
  quality: string
  ready: 'Ready' | 'Review'
}

export const datasetRows: DatasetRow[] = [
  {
    name: 'ONS Population Projections',
    source: 'ONS',
    dept: 'Statistics',
    cls: 'OBSERVED',
    geo: 'England & Wales',
    fresh: 'Monthly',
    quality: 'High',
    ready: 'Ready',
  },
  {
    name: 'TfL Road Network & Traffic',
    source: 'TfL',
    dept: 'Transport',
    cls: 'OBSERVED',
    geo: 'Greater London',
    fresh: 'Daily',
    quality: 'High',
    ready: 'Ready',
  },
  {
    name: 'NHS Capacity & Demand',
    source: 'NHS Digital',
    dept: 'Health',
    cls: 'DERIVED',
    geo: 'England',
    fresh: 'Weekly',
    quality: 'Medium',
    ready: 'Ready',
  },
  {
    name: 'HMRC Income Distribution',
    source: 'HMRC',
    dept: 'Treasury',
    cls: 'OBSERVED',
    geo: 'UK',
    fresh: 'Quarterly',
    quality: 'High',
    ready: 'Ready',
  },
  {
    name: 'UBI Fiscal Pathway (modelled)',
    source: 'CivicOS',
    dept: 'Treasury',
    cls: 'SCENARIO_ASSUMPTION',
    geo: 'Greater London',
    fresh: 'On run',
    quality: 'Medium',
    ready: 'Ready',
  },
  {
    name: 'Autonomous-cab Adoption Curve',
    source: 'CivicOS',
    dept: 'Transport',
    cls: 'FORECAST',
    geo: 'Greater London',
    fresh: 'On run',
    quality: 'Medium',
    ready: 'Review',
  },
  {
    name: 'Employment Register',
    source: 'DWP',
    dept: 'Employment',
    cls: 'OBSERVED',
    geo: 'UK',
    fresh: 'Monthly',
    quality: 'High',
    ready: 'Ready',
  },
  {
    name: 'Synthetic Mobility Panel',
    source: 'CivicOS',
    dept: 'Transport',
    cls: 'SYNTHETIC',
    geo: 'Greater London',
    fresh: 'On run',
    quality: 'Low',
    ready: 'Review',
  },
]

/* ------------------------------------------------------------ Model registry */

export const modelCards = [
  {
    name: 'Mobility Demand Model',
    purpose: 'Forecasts cab, bus and private-vehicle demand',
    version: 'v2.3',
    status: 'Validated',
    geo: 'Greater London',
  },
  {
    name: 'Healthcare Demand Model',
    purpose: 'Projects capacity vs demand under AI adoption',
    version: 'v1.8',
    status: 'Validated',
    geo: 'England',
  },
  {
    name: 'UBI Fiscal Model',
    purpose: 'Models funding gap and distributional effects',
    version: 'v1.4',
    status: 'Validated',
    geo: 'UK',
  },
  {
    name: 'Employment Transition Model',
    purpose: 'Estimates job displacement and creation',
    version: 'v1.1',
    status: 'Review pending',
    geo: 'UK',
  },
  {
    name: 'Energy Demand Model',
    purpose: 'Grid load under electrification scenarios',
    version: 'v0.9',
    status: 'Draft',
    geo: 'Greater London',
  },
  {
    name: 'Chronos-2 Forecasting',
    purpose: 'General-purpose time-series forecasting',
    version: 'v2.0',
    status: 'Validated',
    geo: 'UK',
  },
]

/* -------------------------------------------------------------------- Agents */

export const agentCatalog = [
  { name: 'Data Intelligence Agent', desc: 'Retrieves and validates official datasets' },
  { name: 'Policy Analysis Agent', desc: 'Evaluates policy instrument impact pathways' },
  { name: 'Mobility Agent', desc: 'Runs transport demand and congestion models' },
  { name: 'Healthcare Agent', desc: 'Runs capacity and demand projections' },
  { name: 'Economic Agent', desc: 'Evaluates fiscal and growth effects' },
  { name: 'Employment Agent', desc: 'Assesses labour-market transitions' },
  { name: 'UBI Agent', desc: 'Models UBI funding and distributional impact' },
  { name: 'Risk Agent', desc: 'Flags material risks across outputs' },
  { name: 'Audit Agent', desc: 'Records evidence and parameters for review' },
]

/* --------------------------------------------------------------------- Audit */

export type AuditRow = {
  user: string
  org: string
  action: string
  subject: string
  when: string
  status: 'Approved' | 'Pending'
}

export const auditRows: AuditRow[] = [
  {
    user: 'J. Delacroix',
    org: 'GLA Transport',
    action: 'Run simulation',
    subject: 'London AI Transition',
    when: '2h ago',
    status: 'Approved',
  },
  {
    user: 'A. Okafor',
    org: 'GLA Health',
    action: 'Export policy brief',
    subject: 'Healthcare Capacity Review',
    when: '5h ago',
    status: 'Approved',
  },
  {
    user: 'M. Reyes',
    org: 'HM Treasury',
    action: 'Publish model',
    subject: 'UBI Fiscal Model v1.4',
    when: '1d ago',
    status: 'Pending',
  },
  {
    user: 'J. Delacroix',
    org: 'GLA Transport',
    action: 'Modify scenario',
    subject: 'London AI Transition',
    when: '1d ago',
    status: 'Approved',
  },
  {
    user: 'S. Whitfield',
    org: 'DfT',
    action: 'Run simulation',
    subject: 'UK Housing Acceleration',
    when: '2d ago',
    status: 'Approved',
  },
]

/* ---------------------------------------------------------------- Governance */

export const governanceRoles = [
  { role: 'Analyst', desc: 'Create and run simulations' },
  { role: 'Data steward', desc: 'Manage dataset governance' },
  { role: 'Model developer', desc: 'Publish and version models' },
  { role: 'Policy reviewer', desc: 'Review scenario configurations' },
  { role: 'Approver', desc: 'Approve high-impact simulations' },
  { role: 'Auditor', desc: 'Read-only audit access' },
  { role: 'Administrator', desc: 'Manage organisation and permissions' },
]

/* ------------------------------------------------------------------- Reports */

export const reportTypes = [
  'Policy brief',
  'Regulatory-impact assessment',
  'Spending options paper',
  'Dataset-quality report',
  'Model-evaluation report',
  'Autonomous-mobility sandbox report',
  'Complete audit package',
]

/* -------------------------------------------------------------------- Viewer */

export const organisation = {
  name: 'Greater London Authority',
  clearance: 'Clearance: OFFICIAL-SENSITIVE',
  residency: 'Data residency: UK South',
}

export const viewer = {
  initials: 'JD',
  name: 'J. Delacroix',
}
