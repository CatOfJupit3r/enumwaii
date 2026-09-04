# Counter — Hono + Drizzle + enumwaii

Counter is a barista-facing café order board backed by embedded Postgres. It runs the full dashboard on Node, Bun, and Deno; the Cloudflare Worker deliberately exposes only its portable menu and pricing catalog because an isolate-local PGlite database would not be durable edge storage.

```sh
pnpm --dir examples/hono dev
pnpm --dir examples/hono dev:bun
pnpm --dir examples/hono dev:deno
pnpm --dir examples/hono dev:cloudflare
```

Open <http://localhost:3000>. Seeded cards such as Marin’s oat latte are grouped by enumwaii-owned status values. `OrderStatus` uses constant-case values (`PLACED`) and produces the Drizzle PostgreSQL enum from `.rawValues`; `DrinkSize` is another database enum and its `.derive()` table owns each drink price. Card moves are constrained by `.deriveTo()` and versioned, so the API can honestly say “another barista already moved this order.”

The URL filter demonstrates a realistic deep-link policy: `/?status=ready` selects ready drinks, while an unknown shared filter visibly falls back to that column. `hydrateOrder` remains strict: a retired database enum value is a migration failure, never a silent fallback.

At the edge, `GET /api/menu` and `GET /api/menu/pricing/:size` reuse `DrinkSize` and its derived cents without opening a database. That gives the Worker a useful guest-facing job while the order board remains on durable hosts.

```sh
pnpm --dir examples/hono test
pnpm --dir examples/hono test:types
pnpm --dir examples/hono build
pnpm --dir examples/hono test:runtimes
```
