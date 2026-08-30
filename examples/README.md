# Runnable examples

These are independent applications, not a shared fixture suite. Every folder
has its own package manifest, commands, tests, type contracts, and a focused
README. Run one application at a time from the repository root after
`pnpm install`.

| Example                                          | What it shows                                                                                                                                                 | Run it                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Next.js](./nextjs)                              | App Router, Server Components, Server Actions, Route Handlers, React reducer cases, nil defaults, and explicit fallbacks                                      | `pnpm --filter @enumwaii/example-nextjs dev`               |
| [TanStack Start + Solid](./tanstack-start-solid) | SSR loaders, typed search, server functions, Standard Schema, Zod object input, mutations, and an honest branded-value RPC bridge                             | `pnpm --filter @enumwaii/example-tanstack-start-solid dev` |
| [Vue](./vue)                                     | Composition API state, typed props/events, URL and localStorage hydration, `deriveTo`, and an interactive policy lab                                          | `pnpm --filter @enumwaii/example-vue dev`                  |
| [Hono + Drizzle + PGlite](./hono)                | A persistent order console, direct Standard Schema middleware, PostgreSQL enum metadata/defaults, strict row hydration, transitions, and optimistic conflicts | `pnpm --filter @enumwaii/example-hono-drizzle dev`         |
| [Elysia](./elysia)                               | Native request/response validation, scalar versus object boundaries, lifecycle errors, content-type behavior, and a live HTTP console                         | `pnpm --filter @enumwaii/example-elysia dev`               |
| [oRPC](./orpc)                                   | Native contracts and procedures, Zod object schemas, direct enumwaii scalar input/output, context, typed errors, and real HTTP calls                          | `pnpm --filter @enumwaii/example-orpc dev`                 |
| [Effect](./effect)                               | A runnable operator CLI with Context, Layer, Ref, tagged failures, exhaustive workflow derivation, and external input decoding                                | `pnpm --filter @enumwaii/example-effect dev`               |
| [NestJS + Mongoose](./nestjs)                    | Decorated modules/controllers/pipes, injected models, Mongo enum/default configuration, strict document hydration, and versioned writes                       | `pnpm --filter @enumwaii/example-nestjs-mongoose dev`      |

The database examples live with the server architecture that uses them. Hono
runs against embedded PGlite with no external service. NestJS uses MongoDB;
start its checked-in Compose service first:

```sh
pnpm --filter @enumwaii/example-nestjs-mongoose db:up
pnpm --filter @enumwaii/example-nestjs-mongoose dev
```

Each application makes invalid and ambiguous inputs visible rather than only
showing its happy path. Its local README explains which controls exercise raw
integration values, nominal domain values, missing-input defaults, malformed
fallbacks, strict rejection, foreign ownership, persistence hydration, or
transport serialization.
