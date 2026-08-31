---
title: Runtime boundaries and integrations
description: Validate JSON, forms, URLs, databases, and other untrusted values safely.
---

Enumwaii brands exist only in TypeScript. External strings must be validated before they enter trusted application code as owned members.

## Parsing

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
declare const payload: { role: unknown };
declare function useRole(role: (typeof roles)["~type"]): void;
declare function report(error: unknown): void;
// ---cut---
const role = roles.parse(payload.role);

const result = roles.safeParse(payload.role);
if (result.success) {
  useRole(result.value);
} else {
  report(result.error);
}
```

- `parse` returns a branded member or throws `EnumwaiiParseError`.
- `safeParse` returns a discriminated success or failure result.
- `is` is a type guard for control-flow validation.

The failure keeps the exact rejected input in `error.received` and provides a non-throwing diagnostic in `error.receivedText`. The diagnostic is safe for values JSON cannot represent, including `bigint`, circular structures, and hostile proxies:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
declare const input: unknown;
declare function audit(value: unknown): void;
declare function show(value: string): void;
// ---cut---
const result = roles.safeParse(input);
if (!result.success) {
  audit(result.error.received);
  show(result.error.receivedText);
}
```

Runtime validation establishes string membership. It cannot distinguish equal strings that originated from different declarations because declaration provenance is erased at runtime.

## Defaults and fallbacks

`default` and `fallback` intentionally cover different cases:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
declare const input: unknown;
// ---cut---
roles.parse(input, { default: ROLE.USER });
roles.parse(input, { fallback: ROLE.GUEST });
```

- `default` applies only when the input is `null` or `undefined`.
- `fallback` applies to any otherwise-invalid input.
- If both apply to a nil input, `default` wins.
- Both options require an owned branded member.

This keeps absence distinct from malformed data while supporting both strict and recovery-oriented boundaries.

## Standard Schema

Every declaration implements Standard Schema v1 directly:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
declare const input: unknown;
declare const consumer: { acceptSchema(schema: unknown): void };
// ---cut---
consumer.acceptSchema(roles);
roles["~standard"].validate(input);
```

The public protocol types come directly from the official `@standard-schema/spec` package. Each enumwaii declaration supplies its own validation implementation.

Use `enumwaii/zod` or `enumwaii/valibot` only when a consumer specifically requires that library's schema type. Those adapters are optional entry points with optional peer dependencies.

## Serialization

Owned members are strings at runtime and serialize directly through platform APIs:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
// ---cut---
JSON.stringify({ role: ROLE.ADMIN });
new URLSearchParams({ role: ROLE.ADMIN });
```

Validate data as it enters the trusted application domain; owned values can leave through ordinary string serialization.

## Plain runtime objects

Enumwaii intentionally does not throw when arbitrary properties are read. Enum member objects and derived records are frozen plain objects, so an unknown property returns `undefined` under normal JavaScript semantics. This avoids collisions with React, promise resolution, serializers, inspectors, equality matchers, and other tools that probe objects while TypeScript checks known properties in typed code.

## Validation scope

Runtime validation can establish membership, but it cannot recover erased TypeScript provenance:

- Equal strings from different declarations are indistinguishable at runtime.
- Brands are erased during compilation.
- JavaScript, `any`, assertions, and ignored type errors can bypass compile-time ownership.
- Downstream JavaScript can still construct matching raw literals.

Treat values that cross one of those paths as external data and parse them again. The [lint package](https://catofjupit3r.github.io/enumwaii/docs/linting/) adds source conventions around member extraction, comparisons, subsets, and `.cases`.
