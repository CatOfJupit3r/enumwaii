# Runnable examples

These are independent applications, not a shared fixture suite. Every folder has its own package manifest, commands, tests, type contracts, and a focused README. Run one application at a time from the repository root after `pnpm install`.

| Example | What it shows | Run it |
| --- | --- | --- |
| [Next.js](./nextjs) | App Router, Server Components, Server Actions, Route Handlers, TanStack Table v9, React reducer cases, nil defaults, and explicit fallbacks | `pnpm --filter @enumwaii/example-nextjs dev` |
| [TanStack Start + Solid](./tanstack-start-solid) | SSR loaders, typed search, TanStack Form, server functions, Standard Schema, Zod object input, mutations, and an honest branded-value RPC bridge | `pnpm --filter @enumwaii/example-tanstack-start-solid dev` |
| [Vue](./vue) | Composition API state, a native validated form, typed props/events, URL and localStorage hydration, `deriveTo`, and an interactive policy lab | `pnpm --filter @enumwaii/example-vue dev` |
| [React Native + Expo](./react-native) | Expo Router, native forms, AsyncStorage hydration, deep links, repeated query params, array-valued derivation, Android/iOS/web, and visible recovery policies | `pnpm --filter @enumwaii/example-react-native start` |
| [Hono + Drizzle + PGlite](./hono) | Persistent orders with Standard Schema, PostgreSQL enum metadata/defaults, strict hydration, transitions, and conflicts on Node/Bun/Deno; shared status routes in workerd | `pnpm --filter @enumwaii/example-hono-drizzle dev` |
| [Elysia](./elysia) | Native request/response validation, scalar versus object boundaries, lifecycle errors, content-type behavior, and a live HTTP console | `pnpm --filter @enumwaii/example-elysia dev` |
| [oRPC](./orpc) | Native contracts and procedures, Zod object schemas, direct enumwaii scalar input/output, context, typed errors, and real HTTP calls | `pnpm --filter @enumwaii/example-orpc dev` |
| [Effect](./effect) | A runnable operator CLI with Context, Layer, Ref, tagged failures, exhaustive workflow derivation, and external input decoding | `pnpm --filter @enumwaii/example-effect dev` |
| [NestJS + Mongoose](./nestjs) | Decorated modules/controllers/pipes, injected models, Mongo enum/default configuration, strict document hydration, and versioned writes | `pnpm --filter @enumwaii/example-nestjs-mongoose dev` |

The database examples live with the server architecture that uses them. Hono runs against embedded PGlite with no external service. NestJS uses MongoDB; start its checked-in Compose service first:

```sh
pnpm --filter @enumwaii/example-nestjs-mongoose db:up
pnpm --filter @enumwaii/example-nestjs-mongoose dev
```

Each application makes invalid and ambiguous inputs visible rather than only showing its happy path. Its local README explains which controls exercise raw integration values, nominal domain values, missing-input defaults, malformed fallbacks, strict rejection, foreign ownership, persistence hydration, or transport serialization.

The [Hono showcase](./hono) also owns the runtime compatibility suite. Node, Bun, and Deno run the complete PGlite + Drizzle application. Cloudflare workerd runs the same database-free status routes with both Node compatibility modes disabled. Bun, Deno, and workerd execute one shared HTTP contract, so their results remain directly comparable. Run locally installed hosts with `pnpm test:runtimes`; CI installs and checks the pinned versions independently.

## Everyday application work

The showcases deliberately cover the ordinary seams where enum-like values tend to lose their ownership—not only framework setup:

| Concern | Runnable example |
| --- | --- |
| Form state, errors, submit, and reset | TanStack Form drives incident intake in [TanStack Start + Solid](./tanstack-start-solid); [Vue](./vue) and [React Native](./react-native) show dependency-free platform-native forms. |
| Searchable and sortable data grids | [Next.js](./nextjs) renders its branded operations queue through TanStack Table v9 with semantic markup and an empty state. |
| URL and persistence hydration | Next.js and TanStack Start parse search params; Vue rehydrates URL/localStorage state; Expo validates deep links and AsyncStorage. |
| Loading, success, failure, and retry | The frontend examples expose pending mutations, validation failures, empty results, live announcements, and conflict-safe recovery paths. |
| Database defaults and row hydration | [Hono](./hono) uses Drizzle + PGlite; [NestJS](./nestjs) uses Mongoose, with strict parsing when persistence returns to the domain. |
| HTTP forms, JSON, and typed contracts | Hono, Elysia, oRPC, NestJS, and Next.js cover form data, request/response schemas, route handlers, errors, and serialized enum values. |
