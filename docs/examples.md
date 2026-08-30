---
title: Runnable examples
description: Full applications covering frontend, server, forms, tables, SQL, MongoDB, and framework integrations.
---

The repository examples are independent applications rather than artificial
snippets. Each has a package manifest, runnable commands, tests, type contracts,
and a README explaining its boundary and failure cases.

Run commands from a cloned repository after `pnpm install`.

| Application                                                                                                | Highlights                                                                                                             | Command                                                    |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Next.js](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/nextjs)                              | App Router, Server Components, Server Actions, route handlers, TanStack Table, reducer cases, defaults, and fallbacks. | `pnpm --filter @enumwaii/example-nextjs dev`               |
| [TanStack Start + Solid](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/tanstack-start-solid) | SSR loaders, typed search, TanStack Form, server functions, Standard Schema, Zod objects, and RPC branding boundaries. | `pnpm --filter @enumwaii/example-tanstack-start-solid dev` |
| [Vue](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/vue)                                     | Composition API, native forms, typed events, URL/localStorage hydration, and `deriveTo`.                               | `pnpm --filter @enumwaii/example-vue dev`                  |
| [Hono + Drizzle + PGlite](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/hono)                | Standard Schema middleware, PostgreSQL enum metadata, row hydration, transitions, and optimistic conflicts.            | `pnpm --filter @enumwaii/example-hono-drizzle dev`         |
| [Elysia](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/elysia)                               | Native request/response validation, scalar and object boundaries, lifecycle errors, and content-type behavior.         | `pnpm --filter @enumwaii/example-elysia dev`               |
| [oRPC](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/orpc)                                   | Native contracts and procedures, direct scalar schemas, Zod objects, typed errors, and real HTTP calls.                | `pnpm --filter @enumwaii/example-orpc dev`                 |
| [Effect](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/effect)                               | Context, Layer, Ref, tagged failures, exhaustive workflow derivation, and external input decoding.                     | `pnpm --filter @enumwaii/example-effect dev`               |
| [NestJS + Mongoose](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/nestjs)                    | Modules, controllers, pipes, injected models, Mongo enum/default metadata, document hydration, and versioned writes.   | `pnpm --filter @enumwaii/example-nestjs-mongoose dev`      |

## Everyday development seams

- Forms use TanStack Form in the Solid application and a dependency-free native
  approach in Vue.
- TanStack Table drives a searchable and sortable operations grid in Next.js.
- Next.js, TanStack Start, and Vue all parse URL or persistence state rather
  than asserting it.
- Hono uses Drizzle with embedded PGlite; NestJS uses Mongoose with a checked-in
  MongoDB Compose service.
- Server examples cover JSON, form data, route parameters, request/response
  schemas, error mapping, and serialized branded strings.

Every application exposes invalid and ambiguous inputs instead of demonstrating
only its happy path.
