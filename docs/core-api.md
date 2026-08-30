---
title: Core API
description: A practical map of declarations, member views, parsing, composition, and derivation.
---

The base API is intentionally small. A declaration owns a closed set of strings,
validates them at runtime, and carries their identity through TypeScript.

## Create a declaration

```ts
import { em } from "enumwaii";

const states = em(["DRAFT", "READY", "ARCHIVED"]);
const STATE = states.enum;
type State = (typeof states)["~type"];
```

The values tuple must be non-empty. Duplicate values are removed in first-seen
order, including values introduced by `extend` or `em.combine`.

## Surface map

| Surface            | Use it for                                                                      |
| ------------------ | ------------------------------------------------------------------------------- |
| `enum`             | Named, branded application members. This is the default.                        |
| `values`           | Iterating branded members.                                                      |
| `rawEnum`          | Named unbranded values for an integration that rejects branded types.           |
| `rawValues`        | An unbranded tuple for schema, database, or provider metadata.                  |
| `cases`            | Native discriminated-union tags when TypeScript cannot narrow a branded string. |
| `~type`            | The branded member union, available only to TypeScript.                         |
| `~keys`            | The raw key union for `Record` and `satisfies`, available only to TypeScript.   |
| `~safeParseResult` | This declaration's discriminated parse result, available only to TypeScript.    |
| `~standard`        | The Standard Schema v1 contract.                                                |

`.enum`, `.rawEnum`, and `.cases` are referentially the same frozen object at
runtime, but their static types serve different jobs. Extract each view before
using its members; the type-aware lint preset can enforce that convention.

## Validate values

```ts
states.is(input); // type guard
states.parse(input); // State or EnumwaiiParseError
states.safeParse(input); // success/failure result
```

Both parse methods accept `{ default, fallback }`. `default` covers only `null`
and `undefined`; `fallback` covers every otherwise-invalid input.

There is no serializer. Members already are strings at runtime and work with
JSON, URLs, form data, database drivers, and structured cloning.

## Compose declarations

```ts
const PUBLIC_STATE = states.pick([STATE.READY, STATE.ARCHIVED]);
const MUTABLE_STATE = states.omit([STATE.ARCHIVED]);
const extendedStates = states.extend(["DELETED"]);

const priorities = em(["LOW", "HIGH"]);
const stateOrPriority = em.combine([states, priorities]);
```

`pick` and `omit` retain the source identity. `extend` retains the source
identity while widening its domain. `combine` derives a new identity from the
complete combined member set.

## Derive exhaustive data

```ts
const labels = states.derive(
  [STATE.DRAFT, "Draft"],
  [STATE.READY, "Ready"],
  [STATE.ARCHIVED, "Archived"],
);

labels.get(STATE.READY);
labels.record.READY;
```

Tuple entries preserve source-member provenance in a way object keys cannot.
Use `states.derive<Metadata>()(...)` to contextually type every entry once,
callback derivation for uniform transforms, and `deriveTo` when every output
must belong to another declaration.

## Type utilities

Prefer declaration-local utilities when the declaration is already in scope:

```ts
type State = (typeof states)["~type"];
type StateKey = (typeof states)["~keys"];
type StateParseResult = (typeof states)["~safeParseResult"];

const labels = {
  DRAFT: "Draft",
  READY: "Ready",
  ARCHIVED: "Archived",
} as const satisfies Record<StateKey, string>;
```

`InferEnumwaii<T>` and `InferEnumwaiiCase<T>` are also exported for generic or
cross-module code where naming the declaration-local properties is less useful.
See the [generated API reference](./api/enumwaii/index.md) for every exported
signature, class member, error property, and type parameter.
