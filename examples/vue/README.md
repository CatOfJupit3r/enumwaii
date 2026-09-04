# Vue 3 + enumwaii access console

This is a runnable Vue 3.5 + Vite application showing enumwaii inside a normal frontend boundary. It is an access-control console rather than a test fixture: choose a role, inspect its derived permissions, and feed persistence payloads through the boundary lab. A real native Vue invitation form shows the same ownership boundary in ordinary product work without adding a form library.

## Run it

From the repository root, after installing workspace dependencies:

```sh
pnpm --dir examples/vue dev
```

The package also exposes the usual Vite commands:

```sh
pnpm --dir examples/vue build
pnpm --dir examples/vue preview
pnpm --dir examples/vue test
pnpm --dir examples/vue test:types
```

## Tour

- **Current session** shows the reactive branded level, the active boundary policy, and the URL query/localStorage synchronization signal. Changing a level updates `?level=...` and `enumwaii-console-level`.
- **Choose a session lens** renders all four access members. Cards emit a typed `AccessLevel`; the parent never receives a plain string from a card.
- **Derived policy** uses `derive` for access metadata and `deriveTo` for an exhaustive access-level → permission mapping. The permission list is real UI state, not a static illustration.
- **Invite a teammate** uses normal Vue refs, native form controls, inline validation, a typed component event, reset behavior, an ARIA live result, and a recent-submission queue. The `<select>` remains a plain DOM string until strict parsing succeeds; only the branded result leaves the form.
- **Boundary lab** lets you inspect valid (`"EDITOR"`), missing (`null`), malformed (`"ARCHIVED"`), wrong-shaped (`{ level: "EDITOR" }`), and custom external values. Click a policy card to make it active, then apply only an accepted result to the console.

## Boundary behavior

The domain module creates `accessLevelEnum` once and extracts its `.enum` view once as `ACCESS_LEVELS`. The URL and localStorage adapters return `unknown` data; `parseAccessLevel` is the only function allowed to turn that data into a branded `AccessLevel`.

| Policy | Missing (`null`/`undefined`) | Malformed or wrong-shaped |
| --- | --- | --- |
| Strict rejection | rejected | rejected |
| Nil-only default | `VIEWER` | rejected |
| Invalid-input fallback | `GUEST` fallback | `GUEST` fallback |

The distinction is intentional: enumwaii's `default` option is nil-only, whereas `fallback` is for every otherwise-invalid input. Under strict policy, rejected input leaves the current reactive level unchanged. No adapter coerces objects, numbers, or unknown strings.

## Source layout

- `src/domain/access-control.ts` owns the enums, branded types, exhaustive metadata, permission derivation, and boundary parser.
- `src/composables/useAccessLevelPersistence.ts` owns reactive refs, `watch` synchronization, URL/localStorage reads, and the last boundary outcome.
- `src/components/AccessLevelCard.vue` demonstrates typed props/events.
- `src/components/AccessRequestForm.vue` demonstrates the dependency-free form approach: raw draft state in, a strictly parsed `AccessInvitation` event out.
- `src/components/BoundaryPlayground.vue` keeps unknown fixtures outside state until the selected enumwaii policy accepts them.
- `src/domain/access-control.test.ts`, `src/composables/useAccessLevelPersistence.test.ts`, and `src/components/AccessRequestForm.test.ts`, and `src/components/BoundaryPlayground.test.ts` cover domain, persistence, forms, and DOM interactions. `src/type-contract.test-d.ts` proves raw strings cannot enter the domain, invitation, or component prop contracts.

The test suite uses Vitest's normal `jsdom` environment only for the browser composable and SFC interaction tests; the application itself is the primary showcase.
