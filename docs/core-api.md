---
title: API essentials
description: Create declarations, choose member views, parse input, compose sets, and derive exhaustive data.
---

The base API gives a closed string set an owner, validates unknown input, and carries member identity through TypeScript.

## Create a declaration

```ts twoslash
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
const STATE = states.enum;
type State = (typeof states)["~type"];
```

The values tuple must be non-empty. Duplicate values are removed in first-seen order, including values introduced by `extend` or `em.combine`.

When API-facing keys need to differ from canonical wire values, use the object overload:

```ts twoslash
import { em } from "enumwaii";

const orderStatuses = em({
  ORDER_PAID: "order-paid",
  ORDER_PENDING: "order-pending",
});
const ORDER_STATUS = orderStatuses.enum;

ORDER_STATUS.ORDER_PAID; // branded "order-paid"
orderStatuses.parse("order-paid");
```

This is an escape hatch; prefer tuple declarations when keys and values can be identical. Object keys are the developer-facing names on `.enum`, `.rawEnum`, and `.cases`. The mapped values are canonical everywhere else, including identity, parsing, Standard Schema, adapters, iteration, and derivation. Object declarations must be non-empty and cannot contain duplicate values.

## Surface map

| Surface | Use it for |
| --- | --- |
| `enum` | Named, branded application members. This is the default. |
| `values` | Iterating branded members. |
| `rawEnum` | Named unbranded values for integration APIs that cannot accept branded types. |
| `rawValues` | An unbranded tuple for schema, database, or provider metadata. |
| `cases` | Native discriminated-union tags when TypeScript cannot narrow a branded string. |
| `~type` | The branded member union, available only to TypeScript. |
| `~keys` | The raw value union for `Record` and `satisfies`, available only to TypeScript. |
| `~safeParseResult` | This declaration's discriminated parse result, available only to TypeScript. |
| `~standard` | The Standard Schema v1 contract. |

`.enum`, `.rawEnum`, and `.cases` are referentially the same frozen object at runtime, but their static types serve different jobs. Extract each view before using its members; the type-aware lint preset can enforce that convention.

## Validate values

```ts
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
declare const input: unknown;
// ---cut---
states.is(input); // type guard
states.parse(input); // State or EnumwaiiParseError
states.safeParse(input); // success/failure result
```

Both parse methods accept `{ default, fallback }`. `default` covers only `null` and `undefined`; `fallback` covers every otherwise-invalid input.

Members are strings at runtime and serialize directly through JSON, URLs, form data, database drivers, and structured cloning.

## Compose declarations

```ts
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
const STATE = states.enum;
// ---cut---
const PUBLIC_STATE = states.pick([STATE.READY, STATE.ARCHIVED]);
const MUTABLE_STATE = states.omit([STATE.ARCHIVED]);
const extendedStates = states.extend(["DELETED"]);

const priorities = em(["LOW", "HIGH"]);
const stateOrPriority = em.combine([states, priorities]);
```

`pick` and `omit` retain the source identity and any surviving aliased keys. `extend` retains the source identity while widening its domain; new tuple members use identity keys where key equals value. `combine` derives a new identity from the complete combined value set and exposes identity keys because input keys are declaration-local cosmetics.

## Derive exhaustive data

```ts
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
const STATE = states.enum;
// ---cut---
const labels = states.derive(
  [STATE.DRAFT, "Draft"],
  [STATE.READY, "Ready"],
  [STATE.ARCHIVED, "Archived"],
);

labels.get(STATE.READY);
labels.record.READY;
```

Tuple entries preserve source-member provenance in a way object keys cannot. Use `states.derive<Metadata>()(...)` to contextually type every entry once, callback derivation for uniform transforms, and `deriveTo` when every output must belong to another declaration.

## Type utilities

Prefer declaration-local utilities when the declaration is already in scope:

```ts
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
// ---cut---
type State = (typeof states)["~type"];
type StateKey = (typeof states)["~keys"];
type StateParseResult = (typeof states)["~safeParseResult"];

const labels = {
  DRAFT: "Draft",
  READY: "Ready",
  ARCHIVED: "Archived",
} as const satisfies Record<StateKey, string>;
```

`InferEnumwaii<T>` and `InferEnumwaiiCase<T>` are also exported for generic or cross-module code where naming the declaration-local properties is less useful. See the [generated API reference](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/) for every exported signature, class member, error property, and type parameter.
