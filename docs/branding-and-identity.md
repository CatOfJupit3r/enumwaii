---
title: Branding and identity
description: Why enumwaii requires branded values, what alternatives were tested, and how declaration identity behaves.
---

> **Decision:** enumwaii keeps a required, compile-time-only brand because rejecting raw strings is the library's defining behavior. The brandless and lint-only prototypes could not provide that guarantee.

## The required brand

Enumwaii members are string literals intersected with a declaration identity:

```ts
// @noErrors: false
// @errors: 2322
import { em } from "enumwaii";
// ---cut---
const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];

const role: Role = ROLE.ADMIN; // valid
const rawRole: Role = "ADMIN"; // TypeScript error
```

At runtime, `ROLE.ADMIN === "ADMIN"`. The brand has no runtime property and adds no serialization cost. Its job is to stop an unvalidated string from entering a position that promises an owned enumwaii member.

We keep the brand required because rejecting raw strings is the library's defining guarantee. A brandless default would feel closer to a native string union, but it would also permit exactly the accidental raw-string flow enumwaii exists to prevent.

## What the design experiments established

The API was prototyped with brandless unions, lint-only enforcement, instance-specific identity, and runtime wrapper values. The temporary probes were removed once the direction was chosen; their lasting assertions live in the package's type tests and the public behavior described here.

| Candidate | Rejects a matching raw literal | Remains a string at runtime | Equivalent declarations interoperate | Main cost |
| --- | --- | --- | --- | --- |
| Brandless string union | No | Yes | Yes | Loses the defining ownership guarantee |
| Lint-only enforcement | Sometimes | Yes | Yes | Cannot follow every value flow or protect consumers without the plugin |
| Instance token or required name | Yes | Yes | Only with a shared token | Restores API ceremony and makes equivalent independent declarations incompatible |
| Runtime wrapper object | Yes | No | By explicit design | Changes equality, serialization, framework, and database ergonomics |
| Required set-derived brand | Yes | Yes | Yes | Needs narrow escape surfaces for a few TypeScript limitations |

### Why not a brandless union

A brandless declaration can infer the pleasant native union `"ADMIN" | "USER"`, but TypeScript must then accept the same literal anywhere that union is expected:

```ts
type BrandlessRole = "ADMIN" | "USER";

function acceptRole(role: BrandlessRole): void {
  console.log(role);
}

acceptRole("ADMIN"); // valid, but this is the flow enumwaii must reject
```

That design improves compatibility by removing provenance entirely. It cannot distinguish a validated member from a coincidentally matching string, so it is not a viable default for enumwaii.

### Why lint cannot be the authority

Lint rules improve source authoring and catch raw literals in common enumwaii flows. They can still be disabled or omitted, and static lint analysis cannot reliably trace every alias, re-export, generic, generated file, JavaScript consumer, or deliberately laundered value. A library type must remain safe when the consumer does not install the companion plugin.

The ESLint package therefore complements the brand instead of replacing it. See [linting boundaries](https://catofjupit3r.github.io/enumwaii/docs/linting/#why-lint-cannot-replace-branding).

### Why identity is not instance-specific

An instance-local `unique symbol` would distinguish every declaration, but its identity could not be reproduced by another module without sharing an explicit token or name. That would bring the removed name argument back under another form and make independently declared equivalent sets incompatible.

Set-derived identity keeps the values-only `em([...])` API while still rejecting members from overlapping but different sets.

### Why members are not wrapper objects

A runtime object can carry genuine provenance, but it stops behaving like the string protocols, database values, form values, URL parameters, and framework props enumwaii is intended to model. Required branding preserves ordinary runtime strings and pays no serialization or allocation cost per member.

The trade-off is explicit: runtime code cannot recover erased provenance, and some TypeScript narrowing paths need the deliberately raw `.cases` view.

## How identity is chosen

`em()` derives identity from the complete union of declared members. There is no name argument.

```ts
import { em } from "enumwaii";
// ---cut---
const first = em(["ON", "OFF"]);
const second = em(["OFF", "ON"]);
const FIRST = first.enum;

const value: (typeof second)["~type"] = FIRST.ON; // valid
```

Declarations with the same complete member set are intentionally compatible, regardless of order. Declarations with different sets are distinct, even when an individual raw value overlaps:

```ts
// @noErrors: false
// @errors: 2322
import { em } from "enumwaii";
// ---cut---
const roles = em(["ADMIN", "USER"]);
const legacyRoles = em(["ADMIN"]);
const LEGACY_ROLE = legacyRoles.enum;

// TypeScript error: the declarations have different identities.
const role: (typeof roles)["~type"] = LEGACY_ROLE.ADMIN;
```

This is set identity, not instance identity. Enumwaii cannot distinguish two separately-created declarations with exactly the same members without asking users to supply an additional nominal token or name. We chose values-only declarations because they are easier to keep synchronized and because independently declared equivalent sets should interoperate.

## Composition and identity

Composition preserves or deliberately creates identity as follows:

- `pick` and `omit` retain the source declaration's identity. Their members remain a subset of the original domain.
- `extend` retains the source identity while adding members to that domain.
- `em.combine` creates an identity from the combined member set.
- Duplicate runtime values are removed in first-seen order.

Use these operations instead of reconstructing declarations from `.rawValues`; reconstruction creates identity from the new complete set and discards the relationship TypeScript knew about the source.

## Limitations

The brand is a TypeScript constraint, not a security boundary.

- `as`, `any`, `unknown` casts, `@ts-ignore`, or plain JavaScript can bypass it.
- Runtime strings contain no provenance. If two declarations both contain `"ADMIN"`, runtime code cannot determine which declaration produced the string.
- Values loaded from JSON, a database, a URL, or a provider must enter through `parse`, `safeParse`, `is`, or Standard Schema validation.
- Some TypeScript control-flow features do not narrow branded string intersections correctly. `.cases` exists for one important instance of this limitation.

See [member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) for `.cases` and [runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) for safely introducing external values.
