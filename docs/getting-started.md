---
title: Getting started
description: Install enumwaii, declare a vocabulary, and validate your first external value.
---

Enumwaii is for string vocabularies that cross application boundaries: roles,
states, event types, permissions, provider values, and other sets where a raw
string is easy to mistype or source from the wrong place.

## Install

```sh
pnpm add enumwaii
```

The package ships ESM and CommonJS builds with declarations and requires Node.js
18 or newer. Its only runtime dependency is the type-focused official Standard
Schema specification package. Zod, Valibot, and ESLint are opt-in.

## Declare and extract

```ts
import { em } from "enumwaii";

export const roles = em(["ADMIN", "USER", "GUEST"]);
export const ROLE = roles.enum;
export type Role = (typeof roles)["~type"];
```

Use the extracted member object in application code:

```ts
function canDelete(role: Role): boolean {
  return role === ROLE.ADMIN;
}

canDelete(ROLE.ADMIN); // valid
canDelete("ADMIN"); // TypeScript error
```

Enumwaii deliberately requires this brand. At runtime `ROLE.ADMIN` is still the
ordinary string `"ADMIN"`; at compile time it proves that the value came from a
compatible declaration.

## Parse external input

JSON, form fields, route parameters, database rows, and agent output are
untrusted even when TypeScript gives their container a convenient shape.

```ts
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
roles.parse(input, { default: ROLE.GUEST });
roles.parse(input, { fallback: ROLE.USER });
roles.parse(input, {
  default: ROLE.GUEST,
  fallback: ROLE.USER,
});
```

For a nil input, `default` wins. For any other non-member input, `fallback`
applies. With neither option, `parse` throws `EnumwaiiParseError` and
`safeParse` returns its failure branch.

## Pass it as a schema

Every declaration implements Standard Schema v1, so compatible libraries can
accept it directly:

```ts
registerField({ schema: roles });

const result = await roles["~standard"].validate(input);
```

If an integration requires a library-specific schema type, use the optional
[Zod or Valibot adapter](./adapters.md).

## Continue

- [Core API](./core-api.md) is the practical surface map.
- [Member surfaces](./member-surfaces.md) explains the narrow uses of
  `.rawEnum`, `.rawValues`, and `.cases`.
- [Runtime boundaries](./runtime-boundaries.md) covers validation and
  serialization.
- [Runnable examples](./examples.md) show the library in full applications.
