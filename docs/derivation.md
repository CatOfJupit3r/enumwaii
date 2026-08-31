---
title: Derivation
description: Build exhaustive lookups without losing enum member provenance.
---

Derivation creates an exhaustive, frozen lookup from every source member to another value.

## Entry-based derivation

```ts twoslash
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;

const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
  [ROLE.GUEST, "Guest"],
);

labels.get(ROLE.ADMIN); // "Administrator" | "Member" | "Guest"
labels.record.ADMIN; // same runtime lookup through a raw-keyed record
```

TypeScript rejects missing entries, duplicate source members, raw source strings, and members from incompatible declarations.

## Contextually typed entries

When derived objects should all implement an existing application type, pass that type once and call the returned entry builder:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
interface RoleMetadata {
  readonly label: string;
  readonly rank: number;
}

const metadata = roles.derive<RoleMetadata>()(
  [ROLE.ADMIN, { label: "Administrator", rank: 3 }],
  [ROLE.USER, { label: "Member", rank: 2 }],
  [ROLE.GUEST, { label: "Guest", rank: 1 }],
);
```

Every output is contextually checked as `RoleMetadata`, so object literals do not need a repeated `satisfies RoleMetadata`. The extra call preserves exact tuple inference: missing, duplicate, raw, and foreign source members are still rejected. `metadata.get(...)` returns `RoleMetadata` rather than a union of the individual object literal shapes.

## Why tuples instead of an object?

The more familiar syntax would be:

```ts
// @noErrors: false
// @errors: 2769
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
// ---cut---
roles.derive({
  ADMIN: "Administrator",
  USER: "Member",
  GUEST: "Guest",
});
```

However, JavaScript object keys are property keys, and TypeScript reduces branded or computed string keys to their raw property names. By the time the object reaches `derive`, the type system cannot reliably tell whether `ADMIN` came from `ROLE.ADMIN`, a raw literal, or a member of another declaration.

A tuple keeps the source member in a value position. Its brand and declaration identity therefore survive inference:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
[ROLE.ADMIN, "Administrator"];
// ^ provenance is retained here
```

The syntax is slightly longer, but it preserves the ownership guarantee instead of making `derive` an exception to the rest of the API.

## Callback derivation

Use a callback when every member follows the same transformation:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
// ---cut---
const lowerRoles = roles.derive((role) => role.toLowerCase());
```

Optional reusable callbacks are available from `enumwaii/derive-with`:

```ts
import { em } from "enumwaii";
import { lowercase } from "enumwaii/derive-with";

const roles = em(["ADMIN", "USER", "GUEST"]);
// ---cut---
const lowerRoles = roles.derive(lowercase);
```

The callback receives a branded source member. Callback derivation is exhaustive by construction because enumwaii invokes it once for every member.

## `deriveTo`

`deriveTo` additionally checks that every result belongs to a target enumwaii. A result may be one target member or an array of target members:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

const grants = roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
  [ROLE.GUEST, []],
);
```

Both sides use `.enum`: the first tuple item proves source provenance, and the second proves target provenance.

## `.get` and `.record`

Derived results expose two views:

- `.get(member)` accepts a branded source member and is the default application API.
- `.record` is a frozen raw-keyed record for integrations and APIs that need object-shaped data.

For inferred entry derivation, `.get` returns the union of all derived value types. A contextually typed `derive<TValue>()(...)` builder returns `TValue`. Neither form correlates a particular source argument with one tuple result.

At runtime, `.get` is a direct property lookup. It assumes the branded input promised by its TypeScript signature. Plain JavaScript or an unsafe cast can pass an invalid key and receive `undefined`; enumwaii deliberately does not add a proxy or lookup guard because those mechanisms increase integration friction and cannot recover true string provenance anyway.

Entry construction still checks missing, duplicate, and unknown raw keys at runtime, and `deriveTo` checks target membership. Those checks protect JavaScript and unsafe casts where the runtime can establish membership, but two equal strings from different declarations remain indistinguishable at runtime.
