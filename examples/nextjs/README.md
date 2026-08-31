# Next.js operations dashboard

This is an independently runnable Next.js 16 App Router application, not a test fixture. “Signal Desk” presents a responsive operations queue and an interactive boundary lab that makes enum parsing policy visible.

## Route and interaction tour

- `GET /` is an async Server Component. It awaits `searchParams`, parses the external `status` value, and renders a production-shaped queue using branded domain values.
- The status tabs use Next.js `Link` navigation. Try `/?status=IN_PROGRESS`, `/?status=BLOCKED`, or `/?status=COMPLETE`.
- The selected queue is rendered by a TanStack Table v9 data-grid. Search the visible tasks by ID, title, account, owner, status, or note, and activate a column heading to sort it. The toolbar reports visible versus total tasks and offers a clear-search action.
- A missing status applies the nil-only `QUEUED` default. An invalid value such as `/?status=PAUSED` takes the visibly labeled fallback path instead.
- The table and boundary lab are the only Client Components. The lab reducer uses extracted `.cases` solely as native discriminants for real async UI events. Each scenario calls a typed Server Action with valid, missing, malformed, or wrong-type input.
- `POST /api/inspect` is a Route Handler for JSON consumers. It parses the request body as unknown and returns default-only and recovery-policy results side by side.

Example Route Handler request:

```sh
curl -X POST http://localhost:3000/api/inspect \
  -H "content-type: application/json" \
  -d '{"status":"PAUSED"}'
```

The response rejects `PAUSED` under the default-only policy and returns `QUEUED` with `source: "fallback"` under the recovery policy. Sending `{}` uses `source: "default"`, which demonstrates that absence and invalidity are not the same condition.

## enumwaii structure

- `lib/operations.ts` owns the status declaration, its one extracted `.enum` view, branded domain records, exhaustive `derive` metadata, URL resolution, and domain selectors.
- `components/operations-table.tsx` owns the client-side table interaction. The server passes it only the already validated, status-filtered `OperationTask[]`; TanStack handles search and sorting in the browser. The status column still receives each task's branded `TaskStatus` and resolves its label and colors through `statusMetadata`, so external query strings never masquerade as domain values.
- `lib/boundary.ts` parses unknown server input without coercion or handwritten enum wrappers.
- `lib/lab-events.ts` extracts `.cases` once for the boundary lab reducer and nowhere else.
- `type-contract.test-d.ts` proves raw strings cannot enter branded task APIs or hydrated records.
- `tests/` covers parser policies and Route Handler edge cases with native `Request` and `Response` objects.

## Commands

From the repository root:

```sh
pnpm --filter @enumwaii/example-nextjs dev
pnpm --filter @enumwaii/example-nextjs build
pnpm --filter @enumwaii/example-nextjs start
pnpm --filter @enumwaii/example-nextjs test
pnpm --filter @enumwaii/example-nextjs test:types
```

The app uses no remote fonts, images, database, or environment variables, so it can run locally immediately after workspace dependencies are installed.
