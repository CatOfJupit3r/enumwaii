---
title: Documentation
description: Learn enumwaii's ownership model, API, integrations, and tooling.
---

These pages document enumwaii's public API, ownership guarantees, integrations, and tooling. Start with [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started/) to declare a vocabulary and validate its first external value.

## API map

| API | Purpose | Detailed guide |
| --- | --- | --- |
| `em([...])` | Declare a non-empty closed string set | [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/) |
| `.enum` | Branded application members | [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) |
| `.rawEnum`, `.rawValues` | Canonical unbranded integration values | [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) |
| `.cases` | Raw discriminants for native union narrowing | [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) |
| `.parse`, `.safeParse`, `.is` | Validate untrusted values at a boundary | [Runtime boundaries and integrations](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) |
| `.pick`, `.omit`, `.extend`, `em.combine` | Compose related declarations | [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/#composition-and-identity) |
| `.derive`, `.deriveTo` | Build exhaustive lookups while preserving provenance | [Derivation](https://catofjupit3r.github.io/enumwaii/docs/derivation/) |
| `~type`, `~keys`, `~safeParseResult` | Declaration-local TypeScript utilities | [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/#type-only-properties) |
| `eslint-plugin-enumwaii` | Enforce source-level ownership conventions | [Enforcement model](https://catofjupit3r.github.io/enumwaii/docs/linting/) |

## Design foundations

Enumwaii centers one guarantee: application code receives members from the declaration that owns them.

Five foundations carry that guarantee across application code and integrations:

1. Required TypeScript brands attach ownership to each member while runtime values remain ordinary strings.
2. `.enum` is the application surface; raw views serve literal-only integrations and native union discriminants.
3. Provenance-sensitive APIs accept members in value positions so their ownership survives inference.
4. Frozen plain objects provide predictable behavior across frameworks, serializers, inspectors, and test tools.
5. Runtime parsing and optional lint rules extend the ownership model to external data and source conventions.

The [branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/) guide explains the type contract and records the alternatives tested during API design. [Runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries/) establish trust for external values, and the [enforcement model](https://catofjupit3r.github.io/enumwaii/docs/linting/) maps each source convention to TypeScript or lint.

## Guarantees by layer

| Layer | Responsibility |
| --- | --- |
| TypeScript | Carries declaration ownership through branded members and composition. |
| Runtime parsing | Establishes membership when values enter from JSON, forms, URLs, databases, providers, or agent output. |
| Standard Schema | Lets compatible consumers use the declaration as their validation contract. |
| ESLint | Guides casing, member extraction, comparisons, subsets, `.cases`, and union authoring. |
| Plain runtime values | Preserve native string equality, serialization, persistence, and framework interoperability. |

## For coding agents

The [AI agents guide](https://catofjupit3r.github.io/enumwaii/docs/agents/) provides a packaged `SKILL.md`, an [`llms.txt`](https://catofjupit3r.github.io/enumwaii/llms.txt) discovery index, an [`llms.md`](https://catofjupit3r.github.io/enumwaii/llms.md) library brief, and prompts for both initial setup and read-only repository migration analysis. Every documentation page is also available as Markdown at the same path with a `.md` suffix.
