---
title: API reference
description: Complete API documentation generated from enumwaii's source JSDoc.
---

Every page below is generated at build time from the JSDoc attached to the published TypeScript exports. The source comments are the authority: changes to an export and its documentation are reviewed and released together.

## Choose by task

| Goal | Main API | Detailed guide |
| --- | --- | --- |
| Declare an enumwaii | [`em`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#em-2), [`Enumwaii`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#enumwaii) | [Core API](https://catofjupit3r.github.io/enumwaii/docs/core-api/) |
| Use owned members | [`.enum`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#property-enum), [`.values`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#property-values) | [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) |
| Validate external input | [`.parse`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#parse), [`.safeParse`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#safeparse), [`.is`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#is) | [Runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) |
| Compose declarations | [`.pick`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#pick), [`.omit`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#omit), [`.extend`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#extend), [`em.combine`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#combine) | [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/#composition-and-identity) |
| Build exhaustive lookups | [`.derive`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#derive), [`.deriveTo`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/#deriveto) | [Derivation](https://catofjupit3r.github.io/enumwaii/docs/derivation/) |
| Integrate schemas | [Standard Schema](https://catofjupit3r.github.io/enumwaii/docs/adapters/#standard-schema-is-the-default), [Zod](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/adapters/zod/), [Valibot](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/adapters/valibot/) | [Schemas and adapters](https://catofjupit3r.github.io/enumwaii/docs/adapters/) |

## Entry points

- [`enumwaii`](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/) — package map for the core entry point, schema adapters, and optional derivation helpers.
- [Core API](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/core/) — the primary declaration, parsing, composition, error, and type reference on one searchable page.
- [Zod adapter](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/adapters/zod/) and [Valibot adapter](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/adapters/valibot/) — optional adapter entry points.
- [Derivation helpers](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/derive-with/) — optional reusable transformations.

The reference is intentionally organized by entry point instead of creating a separate navigation branch for every class, method, and type. Use the page table of contents or search to jump to an individual symbol. Start with [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started/) when choosing a member surface or deciding where validation belongs.
