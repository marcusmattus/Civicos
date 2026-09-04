# CivicOS

Government decision-intelligence platform for modelling public spending, regulation, industries
and infrastructure **before** decisions are taken.

The workflow the product is built around:

```
Landing → Login → AI Command Centre → Industries & instruments → Model Canvas
        → Scenario configuration → Agent run → Results → Evidence → Export
```

`/` is a public landing page. The authenticated application starts at `/command-centre`; every
application route redirects to `/login` when there is no session.

Every figure in this repository is **illustrative demonstration data** produced by a deterministic
mock forecast engine. Nothing here is an official statistic, and the UI says so on every screen.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration is required. With no environment variables set, the app runs in **demo mode**:
authentication is mocked and all data comes from a seeded in-memory store.

### Signing in (demo mode)

| Field | Value |
| --- | --- |
| Email | any address, e.g. `j.delacroix@london.gov.uk` |
| Password | any 8+ characters |
| MFA code | any 6 digits **except** `000000` (which demonstrates rejection) |

Two reserved inputs exercise edge states:

- `locked@gov.uk` → account-locked screen
- MFA code `000000` → invalid-code error

**Roles** are derived from the email local part so each can be explored without a directory:
`approver@…`, `auditor@…`, `steward@…`, `developer@…`, `reviewer@…`, `admin@…`; anything else is an
Analyst. The role matrix is enforced in `lib/auth/permissions.ts` and shown in **Governance**.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | TypeScript type-check (strict) |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end suite (builds first) |
| `npm run storybook` | Component workshop on port 6006 |
| `npm run build-storybook` | Static Storybook build |

The e2e suite runs against a production build on port 3100 and covers the full vertical slice plus
the access-control states, on desktop and mobile viewports.

---

## Architecture

```
app/
  page.tsx          Public landing page (the only unauthenticated app route)
  (app)/            Authenticated shell + every application route
  api/              Typed route handlers (the mock backend)
  login/            Sign-in, MFA, forgot password, request access
components/
  ui/               Radix + cva primitives (shadcn-style)
  marketing/        The public landing page
  shell/            Sidebar, top bar, global search, session handling
  command-centre/   Prompt composer with @-reference menu
  canvas/           React Flow model canvas + node inspector
  scenarios/        Lever controls and validation surface
  run/              Live agent orchestration
  results/          KPI cards, comparison, export
  evidence/         Evidence drawer
  mobility/         MobilitySim map, controls and outcomes
.storybook/         Storybook config, previewing against app/globals.css
lib/
  types.ts          The domain model — the contract for everything
  data/             Catalogues (industries, instruments, datasets, models) + demo seed
  engine/           Forecast, validation, graph building, reference parsing
  services/         Repository interface, in-memory + Firestore implementations, run engine
  auth/             Auth context, Firebase adapter, role matrix
  client/           Typed API client and the SSE run-stream hook
  store/            Zustand workspace state (autosave to sessionStorage)
```

### Provenance is a first-class concept

Every number carries a `DataClassification`:

`OBSERVED · DERIVED · IMPUTED · SYNTHETIC · FORECAST · SCENARIO_ASSUMPTION`

A metric inherits the **weakest** provenance of its inputs, so a scenario assumption anywhere in the
lineage makes the output a `SCENARIO_ASSUMPTION` and synthetic input makes it `SYNTHETIC`. Observed
and synthetic data are never silently combined — the validator raises `mixed_provenance` and the
badge on the figure changes. Classifications are shown with a glyph as well as a colour, so the
distinction survives greyscale and colour-blind viewing.

### Forecasts

Each forecast reports baseline, P10, P50, P90, unit, change, source datasets, model and
classification. The engine (`lib/engine/forecast.ts`) is deterministic — no randomness — so results
are reproducible and testable, and every relationship is monotone in its drivers.

### The run engine

`lib/services/run-engine.ts` advances a run through weighted agent stages
(`queued → retrieving → validating → running → complete | warning | failed`) and publishes state
over Server-Sent Events at `/api/simulations/:id/events`. It reports **operational activity and
evidence references only** — never model reasoning. High-impact runs (investment ≥ £15bn or UBI ≥
£800/month) finish in `awaiting_approval`, and export is blocked until an Approver signs off.

The client hook falls back to polling if the stream cannot connect.

---

## MapLibre worker

MapLibre v6 spawns its GeoJSON worker as a separate ES module that Next's bundler does not emit.
`scripts/copy-maplibre-worker.mjs` copies it into `public/maplibre/` (wired to `predev` and
`prebuild`) and the map binds it with `setWorkerUrl`. Without that step the worker 404s, no source
finishes loading, and the map silently paints its background and nothing else.

The map style is self-contained — no tile server and no API key — so it renders offline. Swap the
`background` layer for a raster or vector source when a licensed basemap is available.

## Firebase

Firebase is optional and split in two:

**Authentication** (browser) — set the six `NEXT_PUBLIC_FIREBASE_*` variables and sign-in switches
from the mock provider to Firebase Auth. Government SSO is wired through
`signInWithPopup`; swap `GoogleAuthProvider` for the OIDC/SAML provider id your identity provider
issues (`new OAuthProvider('oidc.gov-sso')`) in `lib/auth/context.tsx`.

**Persistence** (server) — set `CIVICOS_PERSISTENCE=firestore` plus the three `FIREBASE_*`
service-account variables and API routes persist to Firestore instead of the in-memory store.
Collections: `simulations/{id}`, `results/{id__scenario}`, `audit/{id}`.

If Firestore is requested but credentials are missing, the app logs a warning and falls back to the
in-memory store rather than failing to boot.

See `.env.example` for every variable and `docs/backend-integration.md` for replacing the mock
services with real ones.

---

## What is implemented

**The priority vertical slice, in depth**

- A public landing page at `/` — the workflow, the provenance model, the capability set and the
  governance story, with every figure counted from the catalogue rather than typed in, so the page
  cannot drift from the product
- Login with password + show/hide, MFA, Government SSO, forgot password, request access,
  account-locked, session timeout with warning dialog, role-based access control
- AI Command Centre with a prompt composer, a searchable `@` reference menu
  (`@industry/transport`, `@policy/ubi`, `@dataset/…`, `@model/…`, `@geography/…`, `@metric/…`),
  visible chips, geography/horizon/budget controls and six starter prompts
- Industry (10) and policy-instrument (10) selection with a live connected-system diagram
- React Flow model canvas: add/remove nodes, connect dependencies, drag to rearrange, node
  inspector, undo/redo (⌘Z / ⇧⌘Z), save draft, validate, zoom/pan/minimap
- Scenario configuration across four scenarios with 15 levers, locked levers when the owning
  instrument is not selected, dependency preview, and validation for missing datasets, invalid
  assumptions and conflicts
- Live agent run over SSE with per-agent status, event stream, dataset/model versions, cancellation
  and partial results
- Results with nine KPI forecasts, an ECharts trajectory with P10–P90 confidence bands, risks,
  affected groups, interventions, scenario comparison and evidence summary
- Evidence drawer and PDF/CSV/JSON export, recorded in the audit log

**MobilitySim** — MapLibre autonomous-transport sandbox: approved, pilot and restricted zones,
pickup points, charging depots, congestion, accessibility coverage and safety incidents as
toggleable layers, ten licence and operating controls, the implied seven-class fleet mix, and eight
modelled outcomes with the licence conditions the settings would breach.

**Storybook** — 45 stories across 13 components, rendered against the app's own `globals.css` so
tokens cannot drift. Domain stories (KPI card, classification, status) pull real values from the
forecast engine.

**Supporting routes** — Simulations, Industries, DataFoundry (with dataset detail pages), Model
registry, Agents, Audit Centre, Governance, Reports, Settings.

## What is not implemented

Called out honestly, since the original brief is larger than one session:

- **Prisma/PostgreSQL** — superseded by the Firebase decision.
- **Real PDF rendering.** `format: 'pdf'` returns a print-ready HTML brief that opens in a new tab
  for print-to-PDF, so the server needs no PDF dependency. Swap in a renderer at
  `app/api/simulations/[id]/export/route.ts`.
- **Dataset registration** (`POST /api/datasets`) returns `501` while the catalogue is static.
- Accessibility work follows WCAG 2.2 AA (keyboard paths, visible focus, semantic tables and
  captions, chart text alternatives, reduced motion, 44px touch targets, colour-independent status)
  but has not been through an audit with assistive technology.

---

## Design

Institutional, calm and auditable: midnight/navy shell, civic blue accent, 8px spacing, 224px
sidebar, 64px top bar, thin borders, 8px radii, minimal shadows. Tokens live in `app/globals.css`
and are the single source of colour truth.

The original Claude Design prototype this grew from is preserved in `project/`, with the design
conversation in `chats/` and the handoff instructions in `docs/design-handoff.md`.
