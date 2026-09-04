# TanStack Start + Solid release control room

This is a complete TanStack Start application built with the official Solid adapter. It presents a release/incident control room rather than a synthetic test surface: the first request is server-rendered, route data comes from a loader-backed server function, incident transitions execute as server mutations, and the UI updates inside a Solid transition.

## Route tour

### `/` — control room

The dashboard loader calls `getIncidentBoard` during SSR and hydrates the same snapshot on the client. Every incident carries an owned `IncidentState`, and the cards render presentation metadata from an exhaustive `derive` table. Their action buttons come from an exhaustive `deriveTo` transition graph.

The typed `focus` search parameter is also an interactive boundary demo:

- **Nil default** removes `focus`; only the missing value defaults to `MITIGATING`.
- **Valid member** requests `MONITORING` and keeps the parsed branded member through the loader and component props.
- **Malformed fallback** opens `?focus=PAUSED`; that unknown value deliberately recovers to `TRIAGE` and the UI labels the result as a fallback, not a valid request or a default.

Use the transition buttons on incident cards to run the real POST server function. The mutation uses an optimistic version, validates its object input with Zod plus `zodSchema` from `enumwaii/zod`, and rejects illegal lifecycle moves before updating the in-memory example store.

The inline **Open an incident** panel uses TanStack Form's Solid `createForm`, `Field`, and `Subscribe` APIs for required-field errors, submit state, reset, and an aria-live result. Its state select intentionally holds an untrusted DOM string; the enumwaii declaration is attached as the field's Standard Schema validator, then the value is parsed at submit before the validated POST mutation creates a branded version-zero record in the process-local store.

### `/validation` — boundary lab

The lab sends a scalar candidate to `inspectIncidentState`. Its `createServerFn().validator(...)` receives the enumwaii declaration directly as a Standard Schema. Owned members return derived guidance; `PAUSED` demonstrates strict rejection. The policy cards contrast that strict seam with the dashboard's nil-only default and explicitly chosen malformed-input fallback.

The server store is intentionally process-local demo data. Restarting the app returns the board to its seed state.

## TanStack Start serialization bridge

Enumwaii values are strings at runtime, but their TypeScript ownership brand is nominal metadata. TanStack Start's strict server-function serializer correctly refuses to promise that nominal provenance survives an RPC transport. The scalar inspection function therefore keeps the enumwaii declaration directly in `.validator(...)`, re-parses the handler data to restore its owned domain type, and returns an explicitly plain DTO whose `state` is a `string`.

The boundary-lab client then parses that serialized string again before passing it to enum-derived domain presentation. This is intentionally symmetric: validate on entry to the server, serialize honest wire data, and validate again when the client needs domain ownership. Strict serialization remains enabled; there is no cast, validator wrapper, or branded output hidden behind `strict: false`.

The incident-creation mutation follows the same boundary discipline: the form parses its raw state before calling `createIncident`, while the server function also validates the complete object with Zod and enumwaii's `zodSchema` adapter before `IncidentStore.create` appends the snapshot.

## Project shape

- `src/routes/__root.tsx` provides the document shell, metadata, navigation, hydration, and scripts.
- `src/routes/index.tsx` owns typed search validation, loader dependencies, SSR data, and interactive mutations.
- `src/routes/validation.tsx` demonstrates direct Standard Schema server validation.
- `src/routeTree.gen.ts` follows TanStack Router's generated route-tree convention and is refreshed by the Vite plugin when routes change.
- `src/domain/` owns declarations, extracted member views, derivations, boundary policies, branded records, and Zod schemas.
- `src/server/` separates Start server-function wrappers from server-only store behavior.
- `src/type-contract.test-d.ts` proves raw and foreign values cannot enter domain records, UI props, or transition calls.

The package's `tsconfig.json` intentionally does not enable `verbatimModuleSyntax`; TanStack Start's Solid setup warns that enabling it can leak server bundles into client output.

## Commands

Run from the repository root after installing workspace dependencies:

```sh
pnpm --dir examples/tanstack-start-solid dev
pnpm --dir examples/tanstack-start-solid test
pnpm --dir examples/tanstack-start-solid test:types
pnpm --dir examples/tanstack-start-solid build
pnpm --dir examples/tanstack-start-solid start
```

`dev` serves the application at `http://localhost:3000`. `build` emits the Nitro production server to `.output`; `start` runs that server. `preview` is also available for Vite preview workflows.
