# enumwaii

[![npm version](https://img.shields.io/npm/v/enumwaii?logo=npm&color=cb3837)](https://www.npmjs.com/package/enumwaii)
[![npm downloads](https://img.shields.io/npm/dm/enumwaii?logo=npm)](https://www.npmjs.com/package/enumwaii)
[![CI](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/ci.yml/badge.svg)](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/ci.yml)
[![runtime compatibility](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/runtime-compatibility.yml/badge.svg)](https://github.com/CatOfJupit3r/enumwaii/actions/workflows/runtime-compatibility.yml)
[![documentation](https://img.shields.io/badge/docs-GitHub%20Pages-c8f45d)](https://catofjupit3r.github.io/enumwaii/)
[![license](https://img.shields.io/github/license/CatOfJupit3r/enumwaii)](LICENSE)

String enums that are difficult for humans—and especially code-generating
agents—to misuse.

Enumwaii keeps values as ordinary strings at runtime while TypeScript tracks the
declaration that owns them. It adds boundary parsing, Standard Schema support,
composition, exhaustive derivation, optional Zod and Valibot adapters, and a
separate lint package for authoring conventions.

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];

function authorize(role: Role): boolean {
  return role === ROLE.ADMIN;
}

authorize(ROLE.ADMIN); // valid
authorize("ADMIN"); // TypeScript error
```

## Why enumwaii?

- Raw strings cannot enter an enum-typed position by accident.
- Members from declarations with different value sets remain incompatible.
- Values serialize naturally through JSON, URLs, forms, and database drivers.
- `parse`, `safeParse`, and `is` validate external values where they enter.
- Every declaration is a Standard Schema v1 schema.
- Composition and derivation retain source-member provenance.
- Optional lint rules catch raw comparisons and misuse of narrow escape hatches.

The brand is a TypeScript guarantee, not runtime magic. Its exact behavior and
known limitations are documented in [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/).

## Install

```sh
npm install enumwaii
```

Node.js 18 or newer is the npm engine. The package publishes ESM and CommonJS
entry points with declarations and source maps. Its ESM entry is also tested
under Bun 1.4, Deno 2.9, and Cloudflare Workers without Node compatibility
flags.

## Parse at boundaries

```ts
const role = roles.parse(payload.role);

const result = roles.safeParse(searchParams.get("role"));
if (result.success) {
  authorize(result.value);
} else {
  report(result.error);
}
```

Parsing can distinguish absence from malformed input:

```ts
roles.parse(input, { default: ROLE.GUEST }); // null or undefined
roles.parse(input, { fallback: ROLE.USER }); // any invalid value
```

If both options apply to a nil value, `default` wins. Without recovery,
`parse` throws `EnumwaiiParseError` and `safeParse` returns a failure result.

There is no `serialize` method: branded members already are strings at runtime.

## Standard Schema and adapters

Pass a declaration directly to any Standard Schema-compatible consumer:

```ts
consumer.acceptSchema(roles);
await roles["~standard"].validate(input);
```

Use an optional adapter only when an integration requires a library-specific
schema type:

```ts
import { zodSchema } from "enumwaii/zod";
import { valibotSchema } from "enumwaii/valibot";

const zRole = zodSchema(roles);
const vRole = valibotSchema(roles);
```

Install only the adapter peer dependency you use. See [Schemas and adapters](https://catofjupit3r.github.io/enumwaii/docs/adapters/).

## Compose and derive

```ts
const STAFF = roles.pick([ROLE.ADMIN, ROLE.USER]);
const NON_GUEST = roles.omit([ROLE.GUEST]);
const serviceRoles = roles.extend(["BOT"]);

const modes = em(["READ", "WRITE"]);
const roleOrMode = em.combine([roles, modes]);

const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
  [ROLE.GUEST, "Guest"],
);

labels.get(ROLE.ADMIN);
```

Duplicates are removed in first-seen order. Tuple derivation is deliberate:
object keys erase branded provenance in TypeScript.

For uniform transforms, optional helpers live outside the main entry point:

```ts
import { lowercase } from "enumwaii/derive-with";

const wireRoles = roles.derive(lowercase);
```

## Member surfaces

| Surface                  | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `.enum`                  | Branded application members; use this by default.      |
| `.values`                | Branded iteration.                                     |
| `.rawEnum`, `.rawValues` | Canonical unbranded values for integration boundaries. |
| `.cases`                 | Raw tags for native discriminated-union narrowing.     |
| `~type`, `~keys`         | Declaration-local TypeScript utilities.                |

Extract `.enum`, `.rawEnum`, and `.cases` before referencing their members.
Although those three views share one frozen runtime object, their static types
carry different contracts. [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) explains every escape hatch and its intended scope.

## ESLint

```sh
npm install --save-dev eslint eslint-plugin-enumwaii
```

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [...enumwaii.configs["flat/recommended"]];
```

The syntax-only preset enforces `CONSTANT_CASE`. The type-aware preset adds
member extraction, provenance-sensitive comparisons and composition, `.cases`
boundaries, and discriminated-union guidance. It requires TypeScript parser
services. See the complete [ESLint setup](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/).

## Documentation and examples

- [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started/)
- [Core API guide](https://catofjupit3r.github.io/enumwaii/docs/core-api/)
- [Generated API reference](https://catofjupit3r.github.io/enumwaii/docs/api/)
- [Design decisions and limitations](https://catofjupit3r.github.io/enumwaii/docs/)
- [Runnable example applications](examples/README.md)

The examples cover Next.js, TanStack Start with Solid, Vue, Hono across
Node/Bun/Deno/Cloudflare workerd, Elysia, oRPC, Effect, and NestJS with Mongoose.
The Hono showcase runs its complete Drizzle + PGlite application on Node, Bun,
and Deno, while workerd executes its shared database-free boundary routes. The
examples also include forms, TanStack Table, URL and persistence hydration, SQL
and MongoDB metadata, request/response validation, and visible failure paths.

## Packages

| Package                                                     | Purpose                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`enumwaii`](packages/enumwaii)                             | Runtime declarations, Standard Schema, adapters, types, and derivation helpers. |
| [`eslint-plugin-enumwaii`](packages/eslint-plugin-enumwaii) | Syntax-only and type-aware authoring rules.                                     |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests, documentation, and
Changesets. Usage questions belong in the support flow described by
[SUPPORT.md](SUPPORT.md). Please report vulnerabilities privately according to
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © CatOfJupit3r
