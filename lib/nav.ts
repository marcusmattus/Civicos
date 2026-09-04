import {
  Bot,
  BarChart3,
  Boxes,
  Database,
  Car,
  FileText,
  FlaskConical,
  Factory,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'

export type NavItem = {
  label: string
  href: Route
  icon: LucideIcon
  breadcrumb: string[]
}

export const navItems: NavItem[] = [
  { label: 'Command Centre', href: '/command-centre' as Route, icon: LayoutDashboard, breadcrumb: ['Command Centre'] },
  {
    label: 'Model Canvas',
    href: '/model' as Route,
    icon: Workflow,
    breadcrumb: ['Simulations', 'London AI Transition', 'Model'],
  },
  {
    label: 'Scenarios',
    href: '/scenarios' as Route,
    icon: SlidersHorizontal,
    breadcrumb: ['Simulations', 'London AI Transition', 'Scenarios'],
  },
  { label: 'Simulations', href: '/simulations' as Route, icon: FlaskConical, breadcrumb: ['Simulations'] },
  {
    label: 'Results',
    href: '/results' as Route,
    icon: BarChart3,
    breadcrumb: ['Simulations', 'London AI Transition', 'Results'],
  },
  { label: 'Industries', href: '/industries' as Route, icon: Factory, breadcrumb: ['Industries'] },
  { label: 'MobilitySim', href: '/mobility' as Route, icon: Car, breadcrumb: ['MobilitySim'] },
  { label: 'Datasets', href: '/datasets' as Route, icon: Database, breadcrumb: ['DataFoundry'] },
  { label: 'Models', href: '/models' as Route, icon: Boxes, breadcrumb: ['Model registry'] },
  { label: 'Agents', href: '/agents' as Route, icon: Bot, breadcrumb: ['Agents'] },
  { label: 'Audit', href: '/audit' as Route, icon: ScrollText, breadcrumb: ['Audit Centre'] },
  {
    label: 'Governance',
    href: '/governance' as Route,
    icon: ShieldCheck,
    breadcrumb: ['Governance & permissions'],
  },
  { label: 'Reports', href: '/reports' as Route, icon: FileText, breadcrumb: ['Reports'] },
  { label: 'Settings', href: '/settings' as Route, icon: Settings, breadcrumb: ['Settings'] },
]

const extraBreadcrumbs: Record<string, string[]> = {
  '/run': ['Simulations', 'London AI Transition', 'Run'],
  '/industries/select': ['Simulations', 'London AI Transition', 'Industries & instruments'],
}

export function breadcrumbFor(pathname: string): string[] {
  const item = navItems.find((n) => n.href === pathname)
  if (item) return item.breadcrumb
  const extra = extraBreadcrumbs[pathname]
  if (extra) return extra
  // Dataset detail and other nested routes fall back to path segments.
  const segments = pathname.split('/').filter(Boolean)
  return segments.length ? segments.map((s) => s.replace(/-/g, ' ')) : ['Command Centre']
}
