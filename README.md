# enumwaii

> String enums that know where they belong.

[![npm package](https://img.shields.io/badge/npm-enumwaii-cb3837?logo=npm)](https://www.npmjs.com/package/enumwaii) [![CI](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/ci.yml/badge.svg)](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/ci.yml) [![extended validation](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/extended-validation.yml/badge.svg)](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/extended-validation.yml) [![documentation](https://img.shields.io/badge/docs-GitHub%20Pages-c8f45d)](https://catofjupit3r.github.io/enumwaii/) [![license](https://img.shields.io/github/license/CatOfJupit3r/enumwaii)](LICENSE)

[Documentation](https://catofjupit3r.github.io/enumwaii/) · [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started/) · [API reference](https://catofjupit3r.github.io/enumwaii/docs/api/) · [Examples](https://catofjupit3r.github.io/enumwaii/docs/examples/) · [ESLint](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/)

Enumwaii gives a closed string vocabulary a type-level owner. Members remain ordinary strings at runtime, while TypeScript rejects raw look-alikes and same-text members from distinct value sets.

```ts
import { em } from "enumwaii";

const workspaceRoles = em(["ADMIN", "MEMBER"]);
const billingRoles = em(["ADMIN", "VIEWER"]);

const WORKSPACE_ROLE = workspaceRoles.enum;
const BILLING_ROLE = billingRoles.enum;
type WorkspaceRole = (typeof workspaceRoles)["~type"];

function canInviteToWorkspace(role: WorkspaceRole): boolean {
  return role === WORKSPACE_ROLE.ADMIN;
}

canInviteToWorkspace(WORKSPACE_ROLE.ADMIN); // valid
canInviteToWorkspace(BILLING_ROLE.ADMIN); // TypeScript error: wrong owner
canInviteToWorkspace("ADMIN"); // TypeScript error: raw string

declare const externalRole: unknown;
canInviteToWorkspace(workspaceRoles.parse(externalRole)); // validate, then trust
```

Use enumwaii for authored, behavior-driving vocabularies such as permissions, workflow states, event kinds, access levels, provider codes, form options, and persisted statuses. Keep free-form user text, names, identifiers, and intentionally open-ended values as plain strings.

## Install

```sh
npm install enumwaii
```

OR

```sh
pnpm add enumwaii
```

OR

```sh
yarn add enumwaii
```

OR

```sh
bun add enumwaii
```

OR

```sh
deno add npm:enumwaii
```

The package ships ESM and CommonJS entry points with declarations and source maps. Node.js 18 or newer is supported; the ESM build is also tested under Bun, Deno, and Cloudflare Workers without Node compatibility flags.

## What it gives you

- Raw literals cannot enter an owned enum position accidentally.
- Same-text members from distinct value sets remain incompatible.
- Members serialize naturally through JSON, URLs, forms, databases, and structured cloning.
- `parse`, `safeParse`, and `is` validate unknown values where they enter.
- Every declaration implements [Standard Schema v1](https://standardschema.dev/) directly.
- `pick`, `omit`, `extend`, and `combine` preserve or deliberately create identity; `derive` and `deriveTo` build exhaustive data from owned members.
- Optional ESLint rules enforce authoring conventions that TypeScript cannot express reliably.

The ownership brand exists only in TypeScript. Assertions, `any`, plain JavaScript, and unvalidated external data can still bypass it, so parse JSON, route values, form fields, database rows, provider payloads, and agent output at their boundary.

## Boundary behavior

```ts
declare const input: unknown;

const strictRole = workspaceRoles.parse(input);
canInviteToWorkspace(strictRole);

const result = workspaceRoles.safeParse(input);
if (result.success) {
  canInviteToWorkspace(result.value);
} else {
  throw result.error;
}
```

Parsing also distinguishes absence from malformed input:

```ts
workspaceRoles.parse(input, { default: WORKSPACE_ROLE.MEMBER });
workspaceRoles.parse(input, { fallback: WORKSPACE_ROLE.MEMBER });
```

`default` handles only `null` and `undefined`; `fallback` handles every other invalid value. See [runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) for complete behavior and error handling.

## Standard Schema first

An enumwaii declaration already is a Standard Schema schema. Compatible form, RPC, routing, and validation libraries can consume `workspaceRoles` directly, without another wrapper or validator dependency.

Use an adapter only when an API specifically requires its native schema type:

```ts
import { zodSchema } from "enumwaii/zod";

export const workspaceRoleSchema = zodSchema(workspaceRoles);
```

Zod and Valibot are optional peers with separate `enumwaii/zod` and `enumwaii/valibot` entry points. Read [schemas and adapters](https://catofjupit3r.github.io/enumwaii/docs/adapters/) for installation and type-preserving examples.

## Compose and derive

```ts
const adminRoles = workspaceRoles.pick([WORKSPACE_ROLE.ADMIN]);
adminRoles.is(WORKSPACE_ROLE.ADMIN);

const labels = workspaceRoles.derive(
  [WORKSPACE_ROLE.ADMIN, "Administrator"],
  [WORKSPACE_ROLE.MEMBER, "Member"],
);

labels.get(WORKSPACE_ROLE.ADMIN);
```

Tuple derivation is deliberate: object keys erase branded provenance in TypeScript. The [derivation guide](https://catofjupit3r.github.io/enumwaii/docs/derivation/) covers contextual output types, callback transforms, `deriveTo`, and arrays of target members.

Use `.enum` for normal application code. `.rawEnum`, `.rawValues`, and `.cases` are narrow integration and discriminated-union escape hatches, not parallel general-purpose APIs. See [member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) before adopting one.

## Optional lint enforcement

The lightweight preset requires no TypeScript project and enforces declaration casing:

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [...enumwaii.configs["flat/recommended"]];
```

The `flat/recommended-type-checked` preset additionally catches direct member view access, raw comparisons, raw subset members, `.cases` misuse, and unsafe union-narrowing patterns. It requires TypeScript parser services; follow the [complete ESLint setup](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/).

## Tested in real applications

| Area | Checked-in examples |
| --- | --- |
| Web applications | [Next.js](examples/nextjs), [TanStack Start + Solid](examples/tanstack-start-solid), and [Vue](examples/vue) |
| Mobile | [React Native + Expo](examples/react-native) across Android, iOS, and web |
| Servers | [Hono](examples/hono), [Elysia](examples/elysia), [oRPC](examples/orpc), [Effect](examples/effect), and [NestJS](examples/nestjs) |
| Runtimes | Node.js, Bun, Deno, and Cloudflare Workers through the shared [Hono](examples/hono) boundary contract |
| Data and everyday UI | Drizzle + PGlite, Mongoose, TanStack Form, native forms, TanStack Table, URL state, persistence hydration, request validation, and visible failure paths across the examples above |

Every example is independently runnable and exercises invalid or ambiguous input instead of demonstrating only a happy path. Open the [example catalog](https://catofjupit3r.github.io/enumwaii/docs/examples/) for commands and hosted StackBlitz or Codespaces links.

## Learn more

- [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started/) — install, declare, extract, and parse.
- [API essentials](https://catofjupit3r.github.io/enumwaii/docs/core-api/) — the practical surface map.
- [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/) — guarantees, tradeoffs, and why the brand is required.
- [Documentation map](https://catofjupit3r.github.io/enumwaii/docs/) — API guides, validation, integrations, and tooling.
- [Generated API reference](https://catofjupit3r.github.io/enumwaii/docs/api/) — signatures generated from public JSDoc.
- [AI agents](https://catofjupit3r.github.io/enumwaii/docs/agents/) — `llms.txt`, the full agent brief, and the packaged skill.

## Packages

| Package | Purpose |
| --- | --- |
| [`enumwaii`](packages/enumwaii) | Runtime declarations, Standard Schema, adapters, types, and derivation helpers. |
| [`eslint-plugin-enumwaii`](packages/eslint-plugin-enumwaii) | Syntax-only and type-aware authoring rules. |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests, documentation, and Changesets. Release and repository administration live in [MAINTAINERS.md](MAINTAINERS.md). Usage questions belong in [SUPPORT.md](SUPPORT.md), and security reports should follow [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © CatOfJupit3r
