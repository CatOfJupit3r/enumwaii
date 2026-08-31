# oRPC + enumwaii jobs console

Run the independently packaged service from the repository root:

```sh
pnpm --filter @enumwaii/example-orpc dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The responsive console loads the current process-local jobs and sends every interaction through the real oRPC `OpenAPIHandler`; the UI has no fixtures or proxy endpoints.

## What the console demonstrates

- `POST /api/v1/jobs/status` gives oRPC the enumwaii declaration directly as both its input and output Standard Schema. Try a valid member, an unknown string, a wrong primitive, and a deliberately corrupted handler output.
- `GET /api/v1/jobs` shows the live store and the next statuses obtained from the exhaustive `deriveTo` graph.
- `POST /api/v1/jobs/{jobId}/transitions` uses a REST-shaped path and JSON body. Try a legal edge, a valid-but-illegal edge, a stale version, and a missing job.
- `POST /api/v1/jobs/reset` restores the three seeded jobs so the scenarios remain repeatable.
- The `x-actor` middleware rejects missing identity and appends `:middleware` to the request ID returned in a successful transition audit.

The service is contract-first: `src/contract.ts` describes the routes before `src/router.ts` implements them. Object inputs, outputs, and typed error data are ordinary Zod 4 schemas. Their nested status fields use the official `zodSchema` adapter from `enumwaii/zod`; there is no local Standard Schema facade. The scalar status procedure intentionally uses enumwaii itself so the integration stays honest about what each schema validates.

Hono hosts the official Fetch adapter at `/api` and static assets at `/`. `src/server.ts` is the only module that opens a listener. The production build bundles that entry as `dist/server.mjs`; the package-level `public` directory is resolved from `import.meta.url` in both development and production.

## API tour with curl

List the live jobs:

```sh
curl http://127.0.0.1:3000/api/v1/jobs \
  -H 'x-actor: curl-operator' \
  -H 'x-request-id: curl-list'
```

Validate one scalar status through enumwaii's Standard Schema:

```sh
curl -X POST http://127.0.0.1:3000/api/v1/jobs/status \
  -H 'content-type: application/json' \
  -H 'x-actor: curl-operator' \
  --data '"RUNNING"'
```

Apply `QUEUED -> RUNNING` with optimistic concurrency:

```sh
curl -X POST http://127.0.0.1:3000/api/v1/jobs/job-7/transitions \
  -H 'content-type: application/json' \
  -H 'x-actor: curl-operator' \
  -H 'x-request-id: curl-transition' \
  --data '{"to":"RUNNING","expectedVersion":0}'
```

Submit the same request with `expectedVersion: 9` to see typed `VERSION_CONFLICT` data. Use `to: "SUCCEEDED"` against a freshly reset `job-7` for `ILLEGAL_TRANSITION`, or replace the path ID with `missing` for `NOT_FOUND`.

## Build, run, and validate

```sh
pnpm --filter @enumwaii/example-orpc test
pnpm --filter @enumwaii/example-orpc test:types
pnpm --filter @enumwaii/example-orpc build
pnpm --filter @enumwaii/example-orpc start
pnpm exec prettier --check examples/orpc
```

`test` covers both local `call(...)` execution and Hono/OpenAPI HTTP requests, including pre-handler validation, typed business errors, context middleware, and output validation. Stop the started production service with `Ctrl+C`.
