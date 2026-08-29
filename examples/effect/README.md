# Effect + enumwaii

This example models a small job worker workflow with Effect 3:

- `jobStatuses` owns the branded `JobStatus` values (`QUEUED`, `RUNNING`,
  `SUCCEEDED`, and `FAILED`).
- `jobCommands` owns the branded `JobCommand` values (`START`, `SUCCEED`,
  `FAIL`, and `RETRY`).
- `derive` supplies exhaustive status metadata. `deriveTo` supplies the
  exhaustive status-to-command capability table and command-to-status result
  table. Transition code therefore receives only enumwaii-owned members.
- `decodeJobCommand` is the external boundary. It calls enumwaii's
  `safeParse` for both unknown fields and translates failures into the typed
  `InvalidJobInput` Effect error. Raw strings do not reach transition logic.
- `JobRepository` is an Effect `Context` service. `JobRepositoryLive` builds a
  process-local `Ref<Map<string, Job>>` through a `Layer`; the stored `Job`
  keeps its branded status type through service composition.
- `IllegalJobTransition`, `JobStateConflict`, and `JobNotFound` are separate
  tagged errors. Callers can recover with `Effect.catchTag` without catching
  malformed input as if it were a workflow rule violation.

The repository is intentionally an educational in-memory layer. It has no
HTTP boundary, database adapter, queue, timer-based retry, or production
persistence. A real application would put the same decoder at its transport
boundary and replace the repository layer with a durable implementation.

From the repository root:

```sh
pnpm --filter enumwaii-examples exec vitest run effect
pnpm --filter enumwaii-examples run test:types
```
