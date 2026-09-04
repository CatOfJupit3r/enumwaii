# shipctl — Effect + enumwaii

A tiny deploy orchestrator CLI: a pocket ArgoCD for `checkout-api`, `email-worker`, and `web`.

```sh
pnpm --dir examples/effect dev -- list
pnpm --dir examples/effect dev -- deploy checkout-api
pnpm --dir examples/effect dev -- retry email-worker
pnpm --dir examples/effect dev -- promote checkout-api --version 2
```

Running `pnpm --dir examples/effect dev` starts a short story: it lists seeded services, deploys `checkout-api`, retries a failed worker, and surfaces a stale-version write. `deploy`, `promote`, `retry`, and `rollback` are real subcommands rather than flags pretending to be a CLI.

`src/deployment-pipeline.ts` owns branded `DeployStatus` and `DeployCommand` members. `safeParse` handles the untrusted CLI command boundary; `.derive()` creates the label, terminal/retryable state, glyph, and ANSI color for the table; `.deriveTo()` provides both the legal command graph and the command-to-status route. Illegal transitions, missing deploys, malformed input, and stale versions are distinct tagged Effect errors.

The `DeployRepository` Effect service uses a `Ref<Map<…>>`, keeping branded values in the workflow while making the CLI testable. It is intentionally in-memory: database and provider integration are outside this focused example.

```sh
pnpm --dir examples/effect build
pnpm --dir examples/effect test
pnpm --dir examples/effect test:types
```
