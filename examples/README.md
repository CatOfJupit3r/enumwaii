# Runnable examples

These are independent applications, not a shared fixture suite. Every folder has its own package manifest, commands, tests, type contracts, and a focused README. The root install intentionally excludes their dependency trees. Prepare one application from the repository root with:

```sh
pnpm install
pnpm --filter enumwaii build
pnpm --dir examples/effect install --no-frozen-lockfile
```

Replace `effect` with the example you want, then use the command listed below. The generated example lockfile is intentionally ignored.

| Example | What it shows | Run it |
| --- | --- | --- |
| [Byline · Next.js](./nextjs) | A newsroom publishing desk with Server Components, status tabs, review reducer cases, CMS webhooks, public-status `.pick()`, and explained filter recovery | `pnpm --dir examples/nextjs dev` |
| [Statuswaii · TanStack Start + Solid](./tanstack-start-solid) | A public status page plus internal ops room with SSR loaders, TanStack Form, versioned mutations, typed Slack links, and an honest branded-value RPC bridge | `pnpm --dir examples/tanstack-start-solid dev` |
| [Crewboard · Vue](./vue) | A members-and-permissions screen with typed role events, a live `.deriveTo()` matrix, invitation-safe `.omit()`, and URL/localStorage recovery | `pnpm --dir examples/vue dev` |
| [Counter · Hono + Drizzle + PGlite](./hono) | A café order board backed by embedded Postgres, aliased wire values, drink-size pricing, strict hydration, and optimistic barista moves across Node/Bun/Deno | `pnpm --dir examples/hono dev` |
| [Waybill · Elysia](./elysia) | A parcel-tracking API and public timeline with object-form couriers, status slugs, Valibot scan bodies, and legacy-scanner fallback | `pnpm --dir examples/elysia dev` |
| [Tablewaii · oRPC](./orpc) | A contract-first restaurant reservation service with host audit context, Zod contracts, Standard Schema scalar I/O, and real typed conflict errors | `pnpm --dir examples/orpc dev` |
| [shipctl · Effect](./effect) | A pocket deployment orchestrator CLI with subcommands, seeded services, derived terminal presentation, exhaustive routing, and tagged transition failures | `pnpm --dir examples/effect dev` |
| [Helpdesk · NestJS + Mongoose](./nestjs) | A ticket-and-SLA service with decorated pipes, severity derivation, internal `.extend()`, response `.omit()`, strict legacy hydration, and versioned status updates | `pnpm --dir examples/nestjs dev` |

The database examples live with the server architecture that uses them. Hono runs against embedded PGlite with no external service. NestJS uses MongoDB; start its checked-in Compose service first:

```sh
pnpm --dir examples/nestjs db:up
pnpm --dir examples/nestjs dev
```

Each application is a named fictional product with seeded data and one obvious first action. Invalid and ambiguous inputs appear in realistic product moments—a stale deep link, scanner firmware, corrupt storage, a migrated database row, or a concurrent update—instead of a standalone boundary lab.

The [Hono showcase](./hono) also owns the runtime compatibility suite. Node, Bun, and Deno run the complete PGlite + Drizzle application. Cloudflare workerd runs the same database-free status routes with both Node compatibility modes disabled. Bun, Deno, and workerd execute one shared HTTP contract, so their results remain directly comparable. Run locally installed hosts with `pnpm test:runtimes`; CI installs and checks the pinned versions independently.

## Everyday application work

The showcases deliberately cover the ordinary seams where enum-like values tend to lose their ownership—not only framework setup:

| Concern | Runnable example |
| --- | --- |
| Form state, errors, submit, and reset | TanStack Form drives incident intake in [TanStack Start + Solid](./tanstack-start-solid), while [Vue](./vue) shows a dependency-free native form. |
| Searchable and sortable data grids | [Byline](./nextjs) renders its branded editorial pipeline through TanStack Table v9 with semantic markup and an empty state. |
| URL and persistence hydration | Next.js and TanStack Start parse search params, while Vue rehydrates URL and localStorage state. |
| Loading, success, failure, and retry | The frontend examples expose pending mutations, validation failures, empty results, live announcements, and conflict-safe recovery paths. |
| Database defaults and row hydration | [Hono](./hono) uses Drizzle + PGlite; [NestJS](./nestjs) uses Mongoose, with strict parsing when persistence returns to the domain. |
| HTTP forms, JSON, and typed contracts | Hono, Elysia, oRPC, NestJS, and Next.js cover form data, request/response schemas, route handlers, errors, and serialized enum values. |

Feature coverage is intentionally distributed: Byline owns `.pick()`, Crewboard and Helpdesk own `.omit()`, Helpdesk owns `.extend()`, Waybill owns the Valibot adapter and `derive-with` transformers, and Byline keeps the native `.cases` reducer example.
