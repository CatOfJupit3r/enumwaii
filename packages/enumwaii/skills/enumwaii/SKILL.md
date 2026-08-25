---
name: enumwaii
description: Declare, deserialize, compose, and consume closed string sets with enumwaii. Use for statuses, roles, modes, kinds, event types, and other enum-like values; do not use for open-ended strings.
metadata:
  type: core
  library: enumwaii
  library_version: 0.0.0
sources:
  - CatOfJupit3r/enumwaii:README.md
  - CatOfJupit3r/enumwaii:packages/enumwaii/src
---

# Enumwaii

Use `enumwaii` for closed string sets that cross boundaries or drive behavior. Keep open-ended text as `string`.

## Declare once

```ts
import { em, type InferEnumwaii } from "enumwaii";

const modes = em(["REGULAR", "READER", "CINEMATIC"]);

export const MODE = modes.enum;
export const RAW_MODE = modes.rawEnum;
export type Mode = InferEnumwaii<typeof modes>;
export const modeSchema = modes.schema;
```

Pass only the closed set of values to `em`. Enumwaii derives its type identity from that complete set; declarations with identical members are intentionally type-compatible.

## Use owned members

Use `MODE.REGULAR` for known values, defaults, comparisons, fixtures, and object construction. A raw literal is not a branded enumwaii value.

Use `modes.rawEnum` or `modes.rawValues` only when an integration explicitly needs canonical unbranded values.

```ts
const mode: Mode = MODE.REGULAR;

// Wrong: bypasses ownership and does not type-check.
const rawMode: Mode = "REGULAR";
```

Use `parse`, `safeParse`, or `is` for unknown database, JSON, form, URL, and provider input.

```ts
const mode = modes.parse(payload.mode);

const defaultedMode = modes.parse(query.mode, { default: MODE.REGULAR });
const recoveredMode = modes.parse(provider.mode, {
  fallback: MODE.REGULAR,
});

const result = modes.safeParse(query.mode);
if (result.success) useMode(result.value);
```

The declaration implements Standard Schema v1; pass `modes` or `modes.schema` to consumers that accept the standard. Use `enumwaii/zod` or `enumwaii/valibot` only when an API specifically requires that library.

## Compose and derive

Use `pick`, `omit`, and `extend` instead of duplicating related sets. Use `derive` for exhaustive metadata with computed owned keys.

```ts
const labels = modes.derive({
  [MODE.REGULAR]: "Regular",
  [MODE.READER]: "Reader",
  [MODE.CINEMATIC]: "Cinematic",
});
```

Declarations and compositions automatically remove duplicate values. Use `deriveTo` when values belong to another enumwaii; each result may be one owned target member or an array of owned target members. Use `typeof modes["~keys"]` for external records that use `satisfies` instead of `derive`.

Do not build derived maps with bare keys; that launders raw strings and prevents the lint rules from checking ownership.

`.cases` is reserved for raw discriminants where TypeScript needs native union narrowing. Use `.enum` everywhere else.

## Lint boundary

Install `eslint-plugin-enumwaii`. Internal values normally use `CONSTANT_CASE`, enforced by lint rather than runtime because external wire formats may be lowercase or kebab-case. The type-aware config also catches raw comparisons, raw derived keys, `.cases` misuse, and structural object-union narrowing.
