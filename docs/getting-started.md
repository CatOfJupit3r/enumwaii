---
title: Getting started
description: Install enumwaii, declare a vocabulary, and validate your first external value.
---

Enumwaii is for string vocabularies that cross application boundaries: roles, states, event types, permissions, provider values, and other sets where a raw string is easy to mistype or source from the wrong place.

## Install

Use the package manager that owns the application:

```sh tab="npm" tab-group="enumwaii-package-manager"
npm install enumwaii
```

```sh tab="pnpm"
pnpm add enumwaii
```

```sh tab="yarn"
yarn add enumwaii
```

```sh tab="bun"
bun add enumwaii
```

```sh tab="deno"
deno add npm:enumwaii
```

The package ships ESM and CommonJS builds with declarations and source maps. Node.js 18 or newer is supported, and the ESM entry point is also tested under Bun, Deno, and Cloudflare Workers without Node compatibility flags. In a Cloudflare Workers project, use whichever package manager already owns the project and import `enumwaii` normally.

The only runtime dependency is the type-focused official Standard Schema specification package. Zod, Valibot, and ESLint are opt-in.

## Declare and extract

```ts twoslash
import { em } from "enumwaii";

export const roles = em(["ADMIN", "USER", "GUEST"]);
export const ROLE = roles.enum;
export type Role = (typeof roles)["~type"];
```

Hover an identifier in any TypeScript example in these guides to inspect the same inferred type and API documentation that an editor would show.

Use the extracted member object in application code:

```ts twoslash
// @noErrors: false
// @errors: 2345
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];
// ---cut---
function canDelete(role: Role): boolean {
  return role === ROLE.ADMIN;
}

canDelete(ROLE.ADMIN); // valid
canDelete("ADMIN"); // TypeScript error
```

Enumwaii deliberately requires this brand. At runtime `ROLE.ADMIN` is still the ordinary string `"ADMIN"`; at compile time it proves that the value came from a compatible declaration.

## Parse external input

JSON, form fields, route parameters, database rows, and agent output are untrusted even when TypeScript gives their container a convenient shape.

```ts
import { em, type EnumwaiiParseError } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
declare const payload: { role: unknown };
declare const searchParams: { get(name: string): string | null };
declare function renderFor(role: (typeof roles)["~type"]): void;
declare function reportInvalidRole(error: EnumwaiiParseError): void;
// ---cut---
const role = roles.parse(payload.role);

const result = roles.safeParse(searchParams.get("role"));
if (result.success) {
  renderFor(result.value);
} else {
  reportInvalidRole(result.error);
}
```

Use `default` for missing values and `fallback` for any invalid value:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
declare const input: unknown;
// ---cut---
roles.parse(input, { default: ROLE.GUEST });
roles.parse(input, { fallback: ROLE.USER });
roles.parse(input, {
  default: ROLE.GUEST,
  fallback: ROLE.USER,
});
```

For a nil input, `default` wins. For any other non-member input, `fallback` applies. With neither option, `parse` throws `EnumwaiiParseError` and `safeParse` returns its failure branch.

## Pass it as a schema

Every declaration implements Standard Schema v1, so compatible libraries can accept it directly:

```ts
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
declare const input: unknown;
declare function registerField<TOutput>(options: {
  schema: StandardSchemaV1<unknown, TOutput>;
}): void;
// ---cut---
registerField({ schema: roles });

const result = await roles["~standard"].validate(input);
```

If an integration requires a library-specific schema type, use the optional [Zod or Valibot adapter](https://catofjupit3r.github.io/enumwaii/docs/adapters/).

## Continue

- [Core API](https://catofjupit3r.github.io/enumwaii/docs/core-api/) is the practical surface map.
- [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) explains the narrow uses of `.rawEnum`, `.rawValues`, and `.cases`.
- [Runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) covers validation and serialization.
- [AI agents](https://catofjupit3r.github.io/enumwaii/docs/agents/) provides the packaged skill, machine-readable docs, and ready-to-run setup and migration-analysis prompts.
- [Runnable examples](https://catofjupit3r.github.io/enumwaii/docs/examples/) show the library in full applications.
