# Effect + enumwaii job control room

Run the operator console directly from the repository root:

```sh
pnpm --filter @enumwaii/example-effect dev
```

With no arguments it prints a control-room overview and executes a small, in-memory scenario:

```text
ENUMWAII / EFFECT JOB CONTROL ROOM
State model: QUEUED → RUNNING → SUCCEEDED | FAILED → QUEUED
  success       OK → RUNNING
  malformed     ERROR / InvalidJobInput
  illegal       ERROR / IllegalJobTransition
  stale state   ERROR / JobStateConflict
  missing job   RECOVERED / JobNotFound
  persisted     RUNNING (terminal=false, retryable=false)
```

The console also accepts external command input so edge cases can be tried without changing source:

```sh
# accepted: exit 0
pnpm --filter @enumwaii/example-effect dev -- --state QUEUED --command START

# malformed enum input: exit 1
pnpm --filter @enumwaii/example-effect dev -- --state WAITING --command START

# valid command, but illegal from QUEUED: exit 1
pnpm --filter @enumwaii/example-effect dev -- --state QUEUED --command RETRY

# valid state/command, but stale versus the seeded QUEUED job: exit 1
pnpm --filter @enumwaii/example-effect dev -- --state RUNNING --command START

# JSON is decoded as unknown at the same boundary
pnpm --filter @enumwaii/example-effect dev -- --json '{"state":"QUEUED","command":"START"}' --id build-42
```

`--help` lists all options. Usage errors return exit code 2; malformed input, illegal transitions, stale state, and missing jobs return exit code 1. The default scenario catches and reports expected workflow failures so the overview itself completes successfully.

## Architecture

- `src/job-workflow.ts` owns two enumwaii declarations: branded `JobStatus` values and branded `JobCommand` values. It extracts their member constants once, derives exhaustive status metadata, derives the allowed status-to-command capabilities, and derives command-to-status destinations.
- `decodeJobCommand` treats external values as `unknown` and uses enumwaii's `safeParse` before transition logic. Invalid fields become the typed `InvalidJobInput` Effect error.
- `JobRepository` is an Effect `Context` service. `JobRepositoryLive` builds a process-local `Ref<Map<string, Job>>` with a `Layer`, so branded jobs remain branded while they move through dependency injection and persistence.
- `IllegalJobTransition`, `JobStateConflict`, and `JobNotFound` are separate tagged errors. The CLI and tests compose them with `Effect.either` and `Effect.catchTag` instead of conflating malformed input with domain rules.
- `src/cli.ts` owns argv/JSON parsing and presentation. It is an application console, not a generic workflow wrapper or a replacement schema library.

The repository is deliberately in-memory and synchronous. It does not include HTTP, queues, timers, a database adapter, tracing, or production persistence; those are integration choices for a real application.

## Scripts and validation

```sh
pnpm --filter @enumwaii/example-effect dev
pnpm --filter @enumwaii/example-effect build
pnpm --filter @enumwaii/example-effect start
pnpm --filter @enumwaii/example-effect test
pnpm --filter @enumwaii/example-effect run test:types
```

`build` uses tsdown to produce the Node ESM bundle in `dist/`. The full workspace may need its root install/build step first when workspace importers have changed; the package intentionally keeps its own manifest, TypeScript config, and build config.
