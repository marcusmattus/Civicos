/** Sidebar navigation and the breadcrumb shown in the topbar for each route. */
export type NavItem = {
  label: string
  to: string
  dot: string
  breadcrumb: string
}

export const navItems: NavItem[] = [
  { label: 'Command Centre', to: '/', dot: '#2563eb', breadcrumb: 'Command Centre' },
  {
    label: 'Model Canvas',
    to: '/model',
    dot: '#06b6d4',
    breadcrumb: 'Simulations / London AI Transition / Model',
  },
  {
    label: 'Scenarios',
    to: '/scenarios',
    dot: '#0f9d83',
    breadcrumb: 'Simulations / London AI Transition / Scenarios',
  },
  { label: 'Simulations', to: '/simulations', dot: '#2563eb', breadcrumb: 'Simulations' },
  {
    label: 'Results',
    to: '/results',
    dot: '#1d70b8',
    breadcrumb: 'Simulations / London AI Transition / Results',
  },
  { label: 'Industries', to: '/industries', dot: '#0f9d83', breadcrumb: 'Industries' },
  { label: 'Datasets', to: '/datasets', dot: '#06b6d4', breadcrumb: 'Datasets' },
  { label: 'Models', to: '/models', dot: '#2563eb', breadcrumb: 'Model Registry' },
  { label: 'Agents', to: '/agents', dot: '#0f9d83', breadcrumb: 'Agents' },
  { label: 'Audit', to: '/audit', dot: '#98a2b3', breadcrumb: 'Audit Centre' },
  { label: 'Governance', to: '/governance', dot: '#98a2b3', breadcrumb: 'Governance & Permissions' },
  { label: 'Reports', to: '/reports', dot: '#98a2b3', breadcrumb: 'Reports' },
  { label: 'Settings', to: '/settings', dot: '#98a2b3', breadcrumb: 'Settings' },
]

/** The run screen has no sidebar entry but still needs a breadcrumb. */
const extraBreadcrumbs: Record<string, string> = {
  '/run': 'Simulations / London AI Transition / Run',
}

export function breadcrumbFor(pathname: string): string {
  const item = navItems.find((n) => n.to === pathname)
  return item ? item.breadcrumb : (extraBreadcrumbs[pathname] ?? '')
}
