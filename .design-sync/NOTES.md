# design-sync notes

Working notes for syncing the CivicOS design system to claude.ai/design. Read this and
`config.json` before re-running — both carry decisions that are expensive to rediscover.

## Status

Bundle **built, validated and graded locally; nothing has been uploaded.** `DesignSync` could not
authorize in the session that produced it (claude.ai/code web, where `/design-login` cannot run), so
there is **no `projectId` pinned** in `config.json`. The next run with design authorization picks a
target per the skill's §1 and uploads; everything before that step is already done.

Closing driver receipt: `ok: true`, `pendingGrade: []`, 13 components ready to upload.

## This repo is an application, not a component library

CivicOS is a Next.js app. The converter needs a compiled entry and type declarations, so two pieces
exist purely to provide them:

- `design-system/index.ts` — re-exports the presentational components. Anything reaching for the
  repository, run engine or route handlers is deliberately excluded.
- `scripts/build-design-system.mjs` + `tsconfig.ds.json` — `npm run build:ds` emits
  `dist/index.mjs` (esbuild, React external) and `dist/design-system/index.d.ts`.
- `package.json` `types` points at those declarations. **The converter reads exports from the
  `.d.ts`, not the JS** — with `types` unset it walks candidate directories, lands on `lib/`, finds
  nothing, and reports `exported PascalCase symbols: 0` with every story `[TITLE_UNMAPPED]`.

Always run `npm run build:ds` before the converter, or it bundles a stale surface.

## Decisions recorded in config.json

- `titleMap` — story titles are human labels, so four are mapped to export names. Note the key for
  the KPI card is **`KPIcard`**: the converter normalises "KPI card" before matching, and a
  `"KPI card"` key silently does nothing.
- `overrides` — `cardMode: "column"` for AgentStatusBadge, KpiCard, EmptyState, Input and Slider
  (their stories are wider than a grid cell); `cardMode: "single"` with `primaryStory: "Default"`
  for Tooltip, whose content portals outside any cell.
- `extraFonts` — Inter woff2 (400/500/600/700) plus `fonts/inter.css`, copied from
  `@fontsource/inter` into `.design-sync/fonts/`. A rendered design must not depend on a CDN.
  "Geist" was removed from `--font-sans` in `app/globals.css`: it was named in the stack but never
  shipped, which is exactly what `[FONT_MISSING]` is for.

## Grades

45 story verdicts across 13 components: **44 `match`, 1 `close`**, all judged from the compare
sheets.

- **KpiCard / Grid — `close`.** Card content is identical; the gallery reflows because the component
  renders in `cardMode: "column"`, so lower rows fall past the card height and are cropped. Framing
  from the card mode, not a component delta, and grid width is not a knob the DS exposes.
- **Tooltip / Default — `match`, with the reference as the gated side.** Storybook screenshots its
  root element, which excludes the portalled tooltip, so only the trigger appears on the reference
  panel. The preview renders trigger *and* tooltip, both correct. Per the rubric, a preview that
  renders more than a gated reference is not `close`.
- **Dialog — `match` in the closed state.** Both panels show the trigger; the dialog body is behind
  a click in both, so this grade does not vouch for the open state.

## Environment

The sandbox that built this ships Chromium 1194 while `@playwright/test` expects a newer build, so
both the validator's render check and `compare.mjs` need `DS_CHROMIUM_PATH` pointed at it:

```bash
DS_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node .ds-sync/package-validate.mjs ./ds-bundle
```

Without it the render check reports `[RENDER_SKIPPED]` and the bundle is unverified.

## Re-sync risks

- **`_ds_bundle.css` comes from the storybook reference**, not from a DS stylesheet
  (`[CSS_FROM_STORYBOOK]` — the app has no standalone compiled CSS artifact). The source is a
  hash-named asset inside `.design-sync/sb-reference/assets/`, so it changes on every storybook
  build. If the reference is stale, **stale styling ships** while the bundle looks current. Rebuild
  `.design-sync/sb-reference` whenever tokens or component styles change.
- **The `dist/` entry and `.d.ts` are generated, not committed.** A clone without `npm run build:ds`
  produces an empty component set rather than an error that names the cause.
- **Grades follow story sources.** Editing any `*.stories.tsx`, the preview-affecting config
  (`titleMap`, `overrides`, `provider`, `storyImports`) or an owned preview clears those grades and
  requires re-grading from fresh sheets. Styling and bundle churn does not.
- **Story caps.** Everything was captured with `--max-stories 8`, which covers all 45 stories today.
  Adding a ninth story to any component silently drops it from capture — raise the flag.
- **Not in the design system, by choice:** the MobilitySim map (MapLibre, browser-only, needs a
  worker asset), the React Flow canvas, and every screen-level component. They are application
  composition, not reusable parts, and bundling them would drag the data and engine layers in.
- **`TooltipProvider` is a required wrapper** for Tooltip, ClassificationBadge and KpiCard. It is
  documented in `conventions.md` rather than `cfg.provider` because previews render it via the story
  decorators. If previews ever lose tooltips, set `cfg.provider` explicitly and re-grade those three.
