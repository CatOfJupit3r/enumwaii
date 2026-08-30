---
title: Linting boundaries
description: Understand what enumwaii's lint rules enforce and where TypeScript remains authoritative.
---

TypeScript enforces assignability, but it does not control every way raw strings can appear in source code. `eslint-plugin-enumwaii` handles conventions and suspicious patterns that are better expressed as lint rules.

## Why linting is separate

The runtime package remains small and does not require ESLint, TypeScript compiler services, or project configuration. Consumers opt into lint enforcement through a separate development dependency.

Syntax-only rules can run without type information. Provenance-sensitive rules require `typescript-eslint` parser services and should use the type-checked configuration.

## Current responsibilities

The lint package covers:

- `CONSTANT_CASE` conventions for internal declarations;
- comparisons and `switch` cases that use raw literals instead of owned members;
- direct member access through `roles.enum`, `roles.rawEnum`, or `roles.cases` instead of an extracted constant;
- raw members passed to subset and targeted-derivation APIs;
- reconstruction from another declaration's member or value collection;
- misuse of `.cases` outside discriminated-union flows;
- structural `in` narrowing patterns that undermine enum-driven unions.

`CONSTANT_CASE` is deliberately not a runtime restriction. External protocols may legitimately use lowercase, kebab-case, or another fixed wire format.

## Why lint cannot replace branding

Lint analysis is incomplete by nature. Rules may be disabled, not installed in a consumer, or unable to follow a value through aliases, re-exports, generics, generated code, or deliberate laundering.

Required branding provides the ownership guarantee wherever TypeScript checks assignability. Lint complements that guarantee by guiding source-level authoring; it is not the authority that makes raw strings safe.

## `.cases` enforcement

`.cases` exposes raw literal members because TypeScript needs them for native discriminated-union narrowing. That also makes accidental general use type-correct.

The `.cases` container therefore carries a type marker used by the type-aware lint rule. The rule can identify case members and restrict them to their intended control-flow role. This is a pragmatic division of responsibility:

- TypeScript performs the actual union narrowing.
- The brand remains required for ordinary application values.
- Lint discourages the narrow compatibility escape from spreading through the codebase.

See [member surfaces](./member-surfaces.md#cases-native-discriminated-union-narrowing) for the intended pattern.
