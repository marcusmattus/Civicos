# Backend integration guide

CivicOS ships with a typed mock backend so the whole workflow runs with zero configuration. Every
mock sits behind an interface; replacing one should not touch the UI.

There are four seams. Take them in whatever order the real services become available.

---

## 1. Persistence — `lib/services/repository.ts`

The `Repository` interface is the only thing route handlers know about:

```ts
interface Repository {
  listSimulations(): Promise<Simulation[]>
  getSimulation(id: string): Promise<Simulation | null>
  createSimulation(simulation: Simulation): Promise<Simulation>
  updateSimulation(id: string, patch: SimulationPatch): Promise<Simulation | null>
  deleteSimulation(id: string): Promise<boolean>
  saveResults(bundle: ResultBundle): Promise<void>
  getResults(simulationId: string, scenario: string): Promise<ResultBundle | null>
  listAudit(limit?: number): Promise<AuditEntry[]>
  appendAudit(entry: AuditEntry): Promise<AuditEntry>
}
```

Two implementations ship:

| Implementation | File | Selected when |
| --- | --- | --- |
| In-memory (seeded) | `lib/services/memory-repository.ts` | default |
| Firestore | `lib/services/firestore-repository.ts` | `CIVICOS_PERSISTENCE=firestore` **and** service-account credentials present |

`repository()` in `lib/services/index.ts` resolves one per process and falls back to memory with a
warning if Firestore is requested but not configured — the app never fails to boot on a missing
credential.

### Adding a third implementation (e.g. FastAPI)

```ts
// lib/services/http-repository.ts
export class HttpRepository implements Repository {
  constructor(private baseUrl: string, private token: string) {}

  async listSimulations() {
    const res = await fetch(`${this.baseUrl}/simulations`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Upstream returned ${res.status}`)
    return (await res.json()) as Simulation[]
  }
  // …
}
```

Then branch on it in `repository()`. Nothing else changes.

### Firestore setup

```
simulations/{simulationId}          → Simulation
results/{simulationId__scenario}    → ResultBundle
audit/{auditId}                     → AuditEntry
```

Suggested rules (server writes only; clients read through the API):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;   // service account bypasses rules
    }
  }
}
```

Audit entries are append-only by contract. If you enforce that in Firestore, grant `create` but not
`update`/`delete` on `audit/{id}` to whatever principal writes them.

---

## 2. The simulation engine — `lib/services/run-engine.ts`

The mock engine advances agent state on a timer and publishes it to subscribers. To use a real
orchestrator:

1. **Starting a run** — replace the body of `startRun` with a call to the upstream service. Keep
   returning a `RunState` so the UI has something to render immediately.
2. **Streaming** — forward upstream events into `publish(simulationId)` after updating the stored
   `RunState`. The SSE route (`app/api/simulations/[id]/events/route.ts`) needs no changes: it
   subscribes to the engine, not to any particular transport.
3. **Cancellation** — `cancelRun` should propagate the cancel upstream, then mark the run
   `cancelled` with `partial: true` so results are labelled as incomplete.

`CIVICOS_SIMULATION_API_URL` / `CIVICOS_SIMULATION_API_KEY` are reserved in `.env.example` for this.

**Contract to preserve:** events carry concise operational activity and evidence references only.
Chain-of-thought must not be exposed — `RunEvent.message` is rendered verbatim in the UI.

### Multi-instance deployments

The mock engine holds run state in process memory, which is fine for a single Node process. Behind
more than one instance, SSE subscribers may land on an instance that is not running the job. Move
run state into Firestore (or Redis) and have `subscribe` watch that store rather than a local `Map`.

---

## 3. Forecasts — `lib/engine/forecast.ts`

`buildResultBundle(simulation, scenario)` returns the `ResultBundle` the results screen renders.
Replace it with a call to the real model service. What the UI depends on:

- `kpis: Forecast[]` — each with `baseline`, `p10`, `p50`, `p90`, `unit`, `change`, `tone`,
  `sourceDatasetIds`, `modelId` and `classification`
- `trajectory: TrajectoryPoint[]` — per-year `p10/p50/p90/baseline`
- `risks`, `positivelyAffected`, `negativelyAffected`, `interventions`
- `evidence` — dataset versions, model versions, assumptions, parameters, approvals
- `partial` — true when the run did not complete

`CIVICOS_FORECAST_MODEL_URL` / `CIVICOS_FORECAST_MODEL_KEY` are reserved for a Hugging Face or
in-house forecasting endpoint (the demo data references Amazon Chronos-2 for this role).

**Keep `classifyMetric` semantics.** Provenance is inherited from the weakest input: any
`SCENARIO_ASSUMPTION` makes the output an assumption, any `SYNTHETIC` input makes it synthetic. If
the upstream service returns its own classification, validate it against the lineage rather than
trusting it — the guarantee that observed and synthetic data are never silently combined is a
product requirement, not a display detail.

---

## 4. Authentication — `lib/auth/context.tsx`

Demo mode posts to `/api/auth/login` and accepts any 8+ character password. With the six
`NEXT_PUBLIC_FIREBASE_*` variables set, `signIn` calls `signInWithEmailAndPassword` instead.

To finish a production auth story:

1. **Government SSO** — replace `GoogleAuthProvider` with the OIDC/SAML provider your identity
   provider issues:
   ```ts
   const provider = new OAuthProvider('oidc.gov-sso')
   await signInWithPopup(firebaseAuth(), provider)
   ```
2. **MFA** — `verifyMfa` is currently a format check. Firebase multi-factor enrolment
   (`multiFactor(user).enroll(...)`) replaces it; the UI already models the `mfa_required` state.
3. **Roles** — `roleForEmail` derives a role from the email local part for demonstration. Replace it
   with a custom claim read from the ID token:
   ```ts
   const token = await credential.user.getIdTokenResult()
   const role = token.claims.role as Role
   ```
4. **Server-side enforcement** — route handlers currently trust the client. Before production, verify
   the Firebase ID token in each handler and check `can(role, action)` from
   `lib/auth/permissions.ts`. The role matrix is already defined; only the verification step is
   missing.

**Session handling** is client-side: a 30-minute idle timeout with a warning dialog at two minutes,
persisted to `sessionStorage`. With real auth, pair it with a short-lived token refresh.

---

## API surface

All routes return JSON and use conventional status codes. Errors are
`{ error, code, details? }`.

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Demo only; unused when Firebase Auth is configured |
| `GET` | `/api/simulations` | List |
| `POST` | `/api/simulations` | Create; seeds selection from `@` references in the prompt |
| `GET` | `/api/simulations/:id` | Fetch |
| `PATCH` | `/api/simulations/:id` | Partial update; writes an audit entry |
| `DELETE` | `/api/simulations/:id` | Remove |
| `POST` | `/api/simulations/:id/validate` | Returns a `ValidationReport` |
| `POST` | `/api/simulations/:id/run` | `202` on start; `409` if validation errors remain |
| `GET` | `/api/simulations/:id/run` | Current `RunState` |
| `DELETE` | `/api/simulations/:id/run` | Cancel; retains partial output |
| `GET` | `/api/simulations/:id/events` | **SSE** — `run`, `done`, `idle` events plus keep-alives |
| `GET` | `/api/simulations/:id/results` | `?scenario=` overrides the active scenario |
| `GET` | `/api/simulations/:id/evidence` | Resolved dataset/model detail |
| `POST` | `/api/simulations/:id/approve` | Approver sign-off |
| `POST` | `/api/simulations/:id/export` | `pdf` (print-ready HTML), `csv`, `json`; `403` while awaiting approval |
| `GET` | `/api/datasets` | `?q=` filter |
| `POST` | `/api/datasets` | `501` until a governed catalogue service exists |
| `GET` | `/api/models` | Model passports |
| `GET` | `/api/audit` | `?limit=` (max 200) |

Request bodies are validated with Zod (`lib/schemas.ts`); a failure returns `422` with the issue
list in `details`.

---

## Testing against a real backend

The unit tests (`tests/`) cover the pure engine — reference parsing, forecast maths, provenance
classification and validation — and stay valid regardless of backend.

The Playwright suite (`e2e/`) drives the UI against whatever the API returns. When you point it at a
real backend, seed a simulation equivalent to `lib/data/demo.ts` first; the specs assume the London
AI Transition demo exists and that a run completes within 40 seconds.
