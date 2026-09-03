/**
 * The CivicOS design system, as a library.
 *
 * The application imports these components directly from `components/`; this
 * entry exists so the same components can be bundled for tooling that needs a
 * single compiled artifact — notably the Claude Design sync, which builds
 * every preview against this bundle.
 *
 * Only presentational parts belong here. Anything that reaches for the
 * repository, the run engine or route handlers stays in the app.
 */

export { Button, buttonVariants } from '../components/ui/button'
export type { ButtonProps } from '../components/ui/button'

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export { Badge } from '../components/ui/badge'
export type { BadgeProps } from '../components/ui/badge'

export { FieldError, Input, Label, Textarea } from '../components/ui/input'
export { Checkbox } from '../components/ui/checkbox'
export { Slider } from '../components/ui/slider'
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  SheetContent,
} from '../components/ui/dialog'

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip'

export {
  EmptyState,
  ErrorState,
  HumanDecisionBanner,
  LoadingBlock,
  Skeleton,
} from '../components/ui/feedback'

export { cn } from '../components/ui/utils'

/* Domain components: the parts that carry CivicOS's guarantees. */
export { ClassificationBadge } from '../components/classification'
export {
  AgentStatusBadge,
  SimulationStatusBadge,
  StatusDot,
  agentStatusLabel,
} from '../components/status'
export { PageHeader } from '../components/page-header'
export { KpiCard } from '../components/results/kpi-card'
