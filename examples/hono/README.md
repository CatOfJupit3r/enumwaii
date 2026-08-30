# Orderline: Hono + Drizzle + enumwaii

This is an independently runnable Node application, not a test fixture. It uses
Hono 4 and the official Node adapter, Hono JSX for a responsive operations
dashboard, Drizzle for every application query, and PGlite for a real
Postgres-compatible database that persists locally without Docker.

## Run the dashboard

From the repository root:

```sh
pnpm --filter @enumwaii/example-hono-drizzle dev
```

Open <http://localhost:3000>. The dashboard lists persisted orders and exposes:

- a create form whose blank status exercises the PostgreSQL `PENDING` default;
- transition controls with an editable expected version, so legal, illegal,
  and stale writes can all be tried;
- a boundary lab for a valid scalar, unknown member, wrong primitive, missing
  query default, and malformed query;
- live JSON responses from the same API that curl or fetch callers use.

PGlite stores its files in `.data/orders` by default. Override that location
with `PGLITE_DATA_DIR`, or set `PORT` to change the HTTP port.

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

# Apply the checked-in migration, inspect schema drift, or open Drizzle Studio
pnpm --filter @enumwaii/example-hono-drizzle db:migrate
pnpm --filter @enumwaii/example-hono-drizzle db:push
pnpm --filter @enumwaii/example-hono-drizzle db:studio
```

Tests construct the app through `createApp`, use `app.request`, and connect to
an isolated in-memory PGlite database. They cover persistence, PostgreSQL enum
metadata/defaults, scalar boundary failures, transition conflicts, stale
versions, and strict historical-row rejection.
