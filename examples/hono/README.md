# Orderline: Hono + Drizzle + enumwaii

This is an independently runnable application, not a test fixture. Its complete
order console runs on Node, Bun, and Deno with the host's native Hono server,
Hono JSX for a responsive operations dashboard, Drizzle for every application
query, and PGlite for a real Postgres-compatible database without Docker.

Cloudflare workerd runs the same database-free order-status routes. That keeps
the Worker bundle focused on enumwaii, Standard Schema, and Hono's Web Standards
surface instead of presenting an isolate-local PGlite database as durable
Cloudflare persistence.

## Runtime matrix

| Host                 | Native boundary            | What runs                                                                | Development command                                           |
| -------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Node.js              | `@hono/node-server`        | Complete dashboard, API, Drizzle repository, migrations, and PGlite.     | `pnpm --filter @enumwaii/example-hono-drizzle dev`            |
| Bun                  | `Bun.serve`                | Complete dashboard and the same Drizzle + PGlite database application.   | `pnpm --filter @enumwaii/example-hono-drizzle dev:bun`        |
| Deno                 | `Deno.serve`               | Complete dashboard and the same Drizzle + PGlite database application.   | `pnpm --filter @enumwaii/example-hono-drizzle dev:deno`       |
| Cloudflare `workerd` | Hono Worker default export | Shared status catalog, parsing, and Standard Schema routes without a DB. | `pnpm --filter @enumwaii/example-hono-drizzle dev:cloudflare` |

The Wrangler configuration explicitly enables `no_nodejs_compat` and
`no_nodejs_compat_v2`. The Cloudflare development server and compatibility test
therefore prove that the portable route slice does not acquire Node polyfills
accidentally.

## Run the complete dashboard

From the repository root:

```sh
# Node.js
pnpm --filter @enumwaii/example-hono-drizzle dev

# Bun
pnpm --filter @enumwaii/example-hono-drizzle dev:bun

# Deno
pnpm --filter @enumwaii/example-hono-drizzle dev:deno
```

Open <http://localhost:3000>. The dashboard lists persisted orders and exposes:

- a create form whose blank status exercises the PostgreSQL `PENDING` default;
- transition controls with an editable expected version, so legal, illegal,
  and stale writes can all be tried;
- a boundary lab for a valid scalar, unknown member, wrong primitive, missing
  query default, and malformed query;
- live JSON responses from the same API that curl or fetch callers use.

PGlite stores Node data in `.data/orders`, Bun data in `.data/orders-bun`, and
Deno data in `.data/orders-deno` by default. Override the active host's location
with `PGLITE_DATA_DIR`, or set `PORT` to change its HTTP port.

## Run the Cloudflare boundary worker

```sh
pnpm --filter @enumwaii/example-hono-drizzle dev:cloudflare
```

Wrangler serves the Worker locally, normally at <http://localhost:8787>. It does
not require a Cloudflare account. The Worker exposes `GET /api/statuses`,
`GET /api/status`, and `POST /api/status/inspect`, which are the exact routes
mounted by the complete database application.

PGlite's `worker` entry point is a client for running Postgres in a browser Web
Worker; it is not a Cloudflare Worker deployment target. PGlite's documented
[filesystems](https://pglite.dev/docs/filesystems) also do not provide durable
Cloudflare storage, while a Worker isolate has a
[128 MB memory limit](https://developers.cloudflare.com/workers/platform/limits/#memory).
Keeping persistence out of this Worker makes the compatibility claim honest. A
production Cloudflare variant would put data in D1 or external PostgreSQL via
Hyperdrive while retaining these portable enum boundary routes.

## API tour

```sh
# List persisted orders
curl http://localhost:3000/api/orders

# Let PostgreSQL apply its canonical enum default
curl -X POST http://localhost:3000/api/orders \
  -H "content-type: application/json" \
  -d '{"memo":"Pack with reusable insulation"}'

# Create an explicitly paid order
curl -X POST http://localhost:3000/api/orders \
  -H "content-type: application/json" \
  -d '{"status":"PAID","memo":"Release to warehouse"}'

# Transition a real row; replace the id and version with list output
curl -X POST http://localhost:3000/api/orders/demo-pending/transition \
  -H "content-type: application/json" \
  -d '{"to":"PAID","expectedVersion":1}'

# Direct Standard Schema scalar boundary
curl -X POST http://localhost:3000/api/status/inspect \
  -H "content-type: application/json" \
  -d '"PAID"'

# Unknown member and wrong primitive both return 400
curl -X POST http://localhost:3000/api/status/inspect \
  -H "content-type: application/json" \
  -d '"REFUNDED"'
curl -X POST http://localhost:3000/api/status/inspect \
  -H "content-type: application/json" \
  -d '42'

# Missing is nil and defaults; supplied malformed input does not
curl http://localhost:3000/api/status
curl 'http://localhost:3000/api/status?status=REFUNDED'
```

The transition graph is exhaustive: pending orders may become paid or
cancelled; paid orders may become shipped or cancelled; shipped and cancelled
orders are terminal. A legal write increments `version`. A stale version or an
illegal transition returns 409 without overwriting the row.

## Database and brand boundary

`src/domain/order-status.ts` owns the single enumwaii declaration. Application
code imports its branded member and value views. Its raw enum/value views are
extracted as `ORDER_STATUS_DB_ENUM` and `ORDER_STATUS_DB_VALUES`, then consumed
only by `src/db/schema.ts`, where PostgreSQL needs unbranded enum migration
metadata and a raw default. `ORDER_STATUS_DB_VALUES` copies the canonical
values into a plain non-empty tuple because Drizzle's generic overload treats
enumwaii's source-provenance marker on `rawValues` as schema metadata.

The checked-in Drizzle migration creates the PostgreSQL enum and `orders`
table. Startup applies that migration before serving traffic. Drizzle's select
type is still only a structural string union, so `hydrateOrder` accepts unknown
driver output and strictly validates every field. PostgreSQL prevents new
out-of-enum values; if schema drift or a historical/corrupt result reaches the
application, hydration throws `InvalidOrderRowError`. Normal reads never map it
to a fallback.

`POST /api/status/inspect` passes the enumwaii declaration directly to
`@hono/standard-validator`; there is no hand-written Standard Schema wrapper.
The query route demonstrates enumwaii's separate nil-default policy.

## Commands

```sh
pnpm --filter @enumwaii/example-hono-drizzle dev
pnpm --filter @enumwaii/example-hono-drizzle build
pnpm --filter @enumwaii/example-hono-drizzle start
pnpm --filter @enumwaii/example-hono-drizzle test
pnpm --filter @enumwaii/example-hono-drizzle test:types

# Execute the shared HTTP contract in each native runtime
pnpm --filter @enumwaii/example-hono-drizzle test:bun
pnpm --filter @enumwaii/example-hono-drizzle test:deno
pnpm --filter @enumwaii/example-hono-drizzle test:cloudflare
pnpm --filter @enumwaii/example-hono-drizzle test:runtimes

# Root shortcut for the same cross-runtime suite
pnpm test:runtimes

# Apply the checked-in migration, inspect schema drift, or open Drizzle Studio
pnpm --filter @enumwaii/example-hono-drizzle db:migrate
pnpm --filter @enumwaii/example-hono-drizzle db:push
pnpm --filter @enumwaii/example-hono-drizzle db:studio
```

The Node-focused tests construct the app through `createApp`, use `app.request`,
and connect to an isolated in-memory PGlite database. They cover persistence,
PostgreSQL enum metadata/defaults, scalar boundary failures, transition
conflicts, stale versions, and strict historical-row rejection.

The opt-in runtime suites execute one shared HTTP contract through real Bun and
Deno servers and inside Cloudflare workerd. Bun and Deno additionally exercise
the complete PGlite + Drizzle application. The Cloudflare suite generates
configuration-matched runtime types and runs a production Wrangler dry-run while
both Node compatibility modes remain disabled. The generated
`worker-configuration.d.ts` is intentionally ignored; Cloudflare documents
[generation during CI](https://developers.cloudflare.com/workers/languages/typescript/#generate-types-that-match-your-workers-configuration)
as an alternative to committing more than 15,000 lines of derived runtime
declarations.
