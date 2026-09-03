# Building with CivicOS

CivicOS is a government decision-intelligence design system: institutional, calm, precise and
auditable. Screens read as records that survive scrutiny, not dashboards that impress. Avoid
glassmorphism, gradients, neon, oversized cards and drop shadows — borders are thin, radii are 8px,
and shadows barely exist.

## Wrapping and setup

Only one wrapper is required: **`TooltipProvider`**. `Tooltip`, `ClassificationBadge` and `KpiCard`
all render tooltips, and without the provider they throw at render. Wrap the whole design once:

```jsx
<TooltipProvider delayDuration={200}>
  <YourScreen />
</TooltipProvider>
```

There is no theme provider and no theme prop. Colour comes from CSS custom properties defined in
`styles.css`, so anything inside it is already themed. The system is light-only; do not invent a
dark variant.

## Styling idiom: Tailwind utilities over CivicOS tokens

Style with Tailwind utility classes whose names come from this system's tokens. Use these names —
they resolve; generic Tailwind palette classes (`bg-slate-100`, `text-gray-500`, `bg-blue-600`) do
not exist here and will render unstyled.

| Role | Utilities |
| --- | --- |
| Surfaces | `bg-canvas` (page), `bg-surface` (cards), `bg-navy` / `bg-midnight` (shell, sign-in) |
| Text | `text-ink` (primary), `text-muted` (secondary), `text-faint` (tertiary) |
| Borders | `border-line`, `border-line-soft`, `border-line-softer`, `border-line-strong` |
| Brand | `bg-civic`, `text-civic`, `bg-civic-tint`, `border-civic-ring`, `text-civic-deep` |
| Positive | `text-teal`, `bg-teal-tint`, `border-teal-line` |
| Warning | `text-warning`, `text-warning-ink`, `bg-warning-tint`, `border-warning-line` |
| Danger | `text-danger`, `bg-danger-tint`, `border-danger-line` |
| Numbers | `tabular` — always use it on figures, so columns of numbers align |

Spacing follows an 8px rhythm (`p-4`, `gap-3`, `mt-6`). The application shell is a 224px sidebar
(`w-sidebar`) and a 64px top bar (`h-topbar`).

## Composition rules that carry meaning

- **Every modelled figure is labelled with its provenance.** Pair a number with
  `<ClassificationBadge classification="OBSERVED | DERIVED | IMPUTED | SYNTHETIC | FORECAST |
  SCENARIO_ASSUMPTION" />`. Never show a forecast without one.
- **Statuses never rely on colour alone.** `AgentStatusBadge`, `SimulationStatusBadge` and
  `ClassificationBadge` each render a glyph plus a word; keep both.
- **Any screen showing modelled outcomes carries `<HumanDecisionBanner />`** — the standing
  reminder that CivicOS models and people decide.
- Use `KpiCard` for a metric, not a bespoke stat tile: it renders the value, the change against
  baseline, the P10–P90 band, the model that produced it and the provenance badge.
- States are components, not improvisations: `Skeleton` / `LoadingBlock` while loading, `EmptyState`
  when there is nothing, `ErrorState` when a fetch fails.

## Where the truth lives

Read `_ds/<folder>/styles.css` and the files it imports for the full token list before styling, and
each component's `components/<group>/<Name>/<Name>.prompt.md` for its API and examples. The shipped
files are authoritative; this page is a summary.

## An idiomatic screen

```jsx
<TooltipProvider>
  <div className="min-h-dvh bg-canvas p-6">
    <PageHeader title="London AI Transition" description="Expected scenario · confidence: High" />
    <HumanDecisionBanner className="mb-4" />

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {forecasts.map((forecast) => (
        <KpiCard key={forecast.metricId} forecast={forecast} />
      ))}
    </div>

    <Card className="mt-6 p-5">
      <CardTitle>Recommended interventions</CardTitle>
      <CardDescription className="mt-0.5">Options for consideration — not decisions.</CardDescription>
      <div className="mt-4 flex gap-2">
        <Button variant="primary">Export policy brief</Button>
        <Button>Compare scenarios</Button>
      </div>
    </Card>
  </div>
</TooltipProvider>
```
