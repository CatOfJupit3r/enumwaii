---
title: Runtime boundaries and integrations
description: Validate JSON, forms, URLs, databases, and other untrusted values safely.
---

Enumwaii brands exist only in TypeScript. External strings must be validated before application code treats them as owned members.

## Parsing

```ts
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

Runtime validation checks string membership. It cannot determine which declaration originally produced an equal string.

## Defaults and fallbacks

`default` and `fallback` intentionally cover different cases:

```ts
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
consumer.acceptSchema(roles);
roles["~standard"].validate(input);
```

The public types come from `@standard-schema/spec`. No local copy of the protocol is maintained, and the specification package contributes no runtime implementation.

Use `enumwaii/zod` or `enumwaii/valibot` only when a consumer specifically requires that library's schema type. Those adapters are optional entry points with optional peer dependencies.

## Serialization

There is no `serialize` method. Branded members are already strings at runtime:

```ts
JSON.stringify({ role: ROLE.ADMIN });
new URLSearchParams({ role: ROLE.ADMIN });
```

Validation is needed when data enters the trusted application domain, not when an already-owned value leaves it.

## Plain runtime objects

Enum member objects and derived records are frozen plain objects. Enumwaii intentionally does not throw when arbitrary properties are read.

This decision avoids collisions with object-probing behavior in React, promise resolution, serializers, inspectors, equality matchers, and other tools. TypeScript prevents unknown property access in typed code; JavaScript receives normal object semantics.

## What runtime validation cannot guarantee

- It cannot distinguish equal strings produced by different declarations.
- It cannot detect a TypeScript brand after compilation.
- It cannot undo `any`, unsafe assertions, or ignored type errors.
- It cannot force downstream JavaScript consumers to use `.enum` rather than raw literals.

Use parsing at data boundaries and the [lint package](./linting.md) for authoring patterns TypeScript alone does not cover.
