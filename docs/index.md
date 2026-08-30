---
title: Documentation
description: Learn enumwaii's API, guarantees, integrations, and deliberate escape hatches.
---

These pages document enumwaii's public API and the decisions behind it. Start
with [Getting started](./getting-started.md) for the practical path; the design
guides explain the parts that are intentionally stricter or less conventional.

## API map

| API                                       | Purpose                                              | Detailed guide                                                               |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `em([...])`                               | Declare a non-empty closed string set                | [Branding and identity](./branding-and-identity.md)                          |
| `.enum`                                   | Branded application members                          | [Member surfaces](./member-surfaces.md)                                      |
| `.rawEnum`, `.rawValues`                  | Canonical unbranded integration values               | [Member surfaces](./member-surfaces.md)                                      |
| `.cases`                                  | Raw discriminants for native union narrowing         | [Member surfaces](./member-surfaces.md)                                      |
| `.parse`, `.safeParse`, `.is`             | Validate untrusted values at a boundary              | [Runtime boundaries and integrations](./runtime-boundaries.md)               |
| `.pick`, `.omit`, `.extend`, `em.combine` | Compose related declarations                         | [Branding and identity](./branding-and-identity.md#composition-and-identity) |
| `.derive`, `.deriveTo`                    | Build exhaustive lookups while preserving provenance | [Derivation](./derivation.md)                                                |
| `~type`, `~keys`, `~safeParseResult`      | Declaration-local TypeScript utilities               | [Member surfaces](./member-surfaces.md#type-only-properties)                 |
| `eslint-plugin-enumwaii`                  | Enforce conventions TypeScript cannot express        | [Linting boundaries](./linting.md)                                           |

## Design decisions

Enumwaii optimizes for one central guarantee: application code should use a member from the declaration that owns it, rather than an indistinguishable raw string.

That leads to four decisions:

1. Values are required branded strings in TypeScript, but remain ordinary strings at runtime.
2. `.enum` is the default surface. Raw surfaces exist only for specific TypeScript or integration limitations.
3. APIs that must retain member provenance accept members as values, not object keys.
4. Runtime objects are plain and frozen. Enumwaii does not use proxy traps to police arbitrary property access.

The resulting API is not magic. Type assertions, `any`, plain JavaScript, and unvalidated external data can bypass its static guarantees. [Runtime validation](./runtime-boundaries.md) and [lint rules](./linting.md) cover different parts of that boundary.

## Why not the alternatives?

| Alternative                | Why it is not the default                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain string unions        | Any matching raw string is assignable, which loses the ownership guarantee.                                                                 |
| TypeScript `enum`          | Adds generated runtime semantics, is less natural at serialization boundaries, and does not provide enumwaii's parsing and composition API. |
| Brandless values plus lint | Lint cannot reliably follow aliases, re-exports, generic flows, laundering, or every consumer configuration.                                |
| Object-key derivation      | TypeScript erases the provenance of string keys, including computed branded keys.                                                           |
| Runtime wrappers           | Preserve identity but stop behaving like normal strings in JSON, URLs, databases, and third-party APIs.                                     |
| Proxy member guards        | Arbitrary object probing by React, test libraries, serializers, and future tooling makes throwing `get` traps an integration hazard.        |

These are pre-1.0 decisions, but changes should preserve the central ownership guarantee unless a replacement can demonstrate the same behavior across TypeScript and common tooling.
