# Statuswaii — public status page and ops room

**Pitch:** A credible hosted-status product with a calm public page and a versioned internal incident control room.

This complete TanStack Start + Solid example keeps enumwaii ownership intact across SSR loaders, server functions, search parameters, TanStack Form, and the client/server serialization boundary.

## Product tour

### `/` — public status

The first screen is useful without explanation: seeded incidents produce a service-health banner, an active-incident list, and a recent-history timeline. The banner folds the severity metadata from the exhaustive incident-state `.derive()` table. When no incidents are open, it automatically renders “All systems operational.”

### `/ops` — internal control room

Operators can create incidents with TanStack Form and advance cards through the exhaustive `.deriveTo()` transition graph. Mutations carry an optimistic version, so concurrent updates surface as a real refresh-and-retry conflict.

The `?focus=` search parameter is framed as a link pasted from Slack:

- a fresh visit uses a nil-only default;
- a valid member is parsed and highlighted;
- `/ops?focus=PAUSED` deliberately falls back to triage and visibly explains that the pasted link contained a typo.

## Serialization bridge

Enumwaii members are strings at runtime, but the ownership brand is TypeScript metadata and cannot honestly survive an RPC transport.

```text
untrusted input
      │
      ▼
server validator ── parse ──► branded IncidentState
      │
      ▼ serialize honestly
plain { state: string } DTO
      │
      ▼ hydrate client
client parse ────────────────► branded IncidentState
```

`inspectIncidentState` uses the enumwaii declaration directly as a Standard Schema server-function validator. Its transport DTO deliberately contains a plain string, and `parseIncidentStateInspection` restores ownership on the receiving side. The domain and type-contract tests prove that the intermediate string cannot enter branded code without that second parse.

Incident creation follows the same discipline: the form validates its raw DOM value with enumwaii Standard Schema, then the server validates the full object with Zod and `zodSchema` before the process-local store is updated.

## Enumwaii coverage

- `.enum` and `.values` render owned state choices.
- `.derive()` owns presentation, severity, and the public status fold.
- `.deriveTo()` owns allowed incident transitions.
- Standard Schema validates the TanStack Form field and scalar server input.
- `zodSchema` composes branded states into mutation objects.
- `parse`, `safeParse`, `default`, and `fallback` cover realistic boundaries.

## Commands

```sh
pnpm --dir examples/tanstack-start-solid dev
pnpm --dir examples/tanstack-start-solid test
pnpm --dir examples/tanstack-start-solid test:types
pnpm --dir examples/tanstack-start-solid build
pnpm --dir examples/tanstack-start-solid start
```

`dev` serves the public page at `http://localhost:3000`; the ops room is at `http://localhost:3000/ops`. The in-memory incident store resets on restart.
