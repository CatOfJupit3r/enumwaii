---
title: Member surfaces
description: Choose between .enum, .values, .rawEnum, .rawValues, and .cases.
---

An enumwaii declaration exposes several typed views of the same closed set. Each view serves a specific application or integration role.

```ts
import { em } from "enumwaii";
// ---cut---
const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
const ROLE_CASE = roles.cases;

ROLE.ADMIN; // branded application value
roles.values; // branded member tuple
RAW_ROLE.ADMIN; // raw literal "ADMIN"
roles.rawValues; // raw literal tuple
ROLE_CASE.ADMIN; // raw discriminant "ADMIN"
```

## `.enum`: the default

Use `.enum` for application values, comparisons, defaults, fixtures, function arguments, and derivation.

```ts
// @noErrors: false
// @errors: 2345
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
// ---cut---
const ROLE = roles.enum;

function acceptRole(role: (typeof roles)["~type"]) {}

acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // TypeScript error
```

`.enum` is the standard surface for trusted application code.

For the object overload, property names and canonical values may differ:

```ts
import { em } from "enumwaii";

const statuses = em({
  ORDER_PAID: "order-paid",
  ORDER_PENDING: "order-pending",
});
const STATUS = statuses.enum;

STATUS.ORDER_PAID; // branded "order-paid"
statuses.parse("order-paid"); // valid
statuses.parse("ORDER_PAID"); // throws
```

The keys are only the developer-facing object surface. `.values`, `.rawValues`, parsing, schemas, adapters, and derivation all use the mapped values.

Extract member views once and reference members through the extracted constant:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
// ---cut---
const ROLE = roles.enum;

ROLE.ADMIN; // preferred
roles.enum.ADMIN; // lint error
```

The same convention applies to `.rawEnum` and `.cases`. It makes the owning vocabulary visually stable and prevents instance expressions from leaking throughout application code. Other instance APIs such as `roles.parse(...)`, `roles.derive(...)`, and `roles.values` remain direct APIs.

## `.values`: branded iteration

Use `.values` when iterating over owned application members:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
declare function acceptRole(role: (typeof roles)["~type"]): void;
// ---cut---
for (const role of roles.values) {
  acceptRole(role);
}
```

The tuple carries declaration provenance. Do not pass it back into `em()` to reconstruct another declaration; use `pick`, `omit`, `extend`, or `em.combine` to preserve the intended identity relationship.

## `.rawEnum` and `.rawValues`: integration escapes

Some APIs require literal strings or literal arrays and cannot preserve enumwaii's brand. `.rawEnum` and `.rawValues` provide canonical unbranded values without making raw literals the normal authoring style. With an object declaration, `.rawEnum` retains the supplied developer-facing keys while `.rawValues` contains only the mapped values.

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
declare const provider: {
  configure(options: { defaultRole: string }): void;
};
declare const database: {
  defineEnum(name: string, values: readonly string[]): void;
};
// ---cut---
const RAW_ROLE = roles.rawEnum;

provider.configure({ defaultRole: RAW_ROLE.USER });
database.defineEnum("role", roles.rawValues);
```

Keep these surfaces at the integration boundary, then parse values returning from that boundary to establish application ownership.

## `.cases`: native discriminated-union narrowing

TypeScript does not reliably narrow discriminated unions when the discriminant is a branded string intersection. `.cases` supplies raw literal tags for union definitions, `switch`, and equality narrowing:

```ts
import { em } from "enumwaii";
// ---cut---
const EVENT_TYPE = em(["CREATED", "DELETED"]);
const EVENT_CASE = EVENT_TYPE.cases;

type Event =
  | { type: typeof EVENT_CASE.CREATED; record: Record<string, unknown> }
  | { type: typeof EVENT_CASE.DELETED; id: string };

function handle(event: Event) {
  switch (event.type) {
    case EVENT_CASE.CREATED:
      event.record; // correctly narrowed
      break;
    case EVENT_CASE.DELETED:
      event.id; // correctly narrowed
  }
}
```

`.cases` is not a second general-purpose enum. Treat `.enum` as the application-value surface and `.cases` as the narrow compatibility surface for discriminated unions. The `.cases` object carries a type marker so enumwaii's lint rules can recognize its provenance and keep its members in union definitions and narrowing positions.

## Runtime identity and object behavior

`.enum`, `.rawEnum`, and `.cases` are different static views of one canonical frozen object:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
// ---cut---
Object.is(roles.enum, roles.rawEnum); // true
Object.is(roles.enum, roles.cases); // true
```

They are frozen plain objects rather than proxies. Unknown properties therefore return `undefined`, which lets React, serializers, assertion libraries, inspectors, and promise detection probe them without triggering member-access errors.

The distinction between the surfaces exists entirely in TypeScript. Runtime code cannot recover which view a consumer used.

## Type-only properties

Three declaration-local properties provide compile-time utilities. They are not emitted at runtime:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
// ---cut---
type Role = (typeof roles)["~type"];
type RoleKey = (typeof roles)["~keys"];
type RoleParseResult = (typeof roles)["~safeParseResult"];
```

- `~type` is the branded member union.
- `~keys` is the raw value union, useful for external value-keyed records with `satisfies`. Despite its historical name, it does not become the object-overload's developer-facing property-key union.
- `~safeParseResult` is the exact discriminated result returned by this declaration's `safeParse` method.

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
// ---cut---
const labels = {
  ADMIN: "Administrator",
  USER: "Member",
} as const satisfies Record<(typeof roles)["~keys"], string>;
```

Use `derive` instead when the record is part of enumwaii-controlled application behavior and source-member provenance matters.
