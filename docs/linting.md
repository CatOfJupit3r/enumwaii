---
title: Enforcement model
description: See how TypeScript, runtime validation, and ESLint divide ownership responsibilities.
---

Enumwaii uses three cooperating enforcement layers: TypeScript owns assignability, runtime parsing establishes membership, and `eslint-plugin-enumwaii` guides source conventions.

## Separation by concern

The runtime package contains declarations and validation. The ESLint package is a separate development dependency for repositories that want source-level guidance.

The syntax-only preset checks declaration casing and restricts object inputs to documented external-contract or compatibility exceptions with `no-object-em`. The type-checked preset uses `typescript-eslint` parser services for provenance-sensitive rules and detects imported or dynamic object inputs too.

## Rule coverage

The lint package covers:

- manual string vocabularies assembled through unions, discriminants, or const-container type extraction;
- `CONSTANT_CASE` conventions for internal declarations;
- comparisons and `switch` cases that use raw literals instead of owned members;
- direct member access through `roles.enum`, `roles.rawEnum`, or `roles.cases` instead of an extracted constant;
- raw members passed to subset and targeted-derivation APIs;
- reconstruction from another declaration's member or value collection;
- misuse of `.cases` outside discriminated-union flows;
- structural `in` narrowing patterns that undermine enum-driven unions.

`CONSTANT_CASE` is the default authoring convention. The casing rule's `valueCasing` option can instead require `"kebab"` or `"snake"` values in tuple and object declarations. Object-overload keys always remain `CONSTANT_CASE`, letting application code use names such as `ORDER_PAID` while canonical URL or protocol values stay `"order-paid"`. Use `ignoredNamePatterns` and `ignoredFilePatterns` only when a declaration or generated-file boundary should skip both checks entirely.

```js
{
  rules: {
    "enumwaii/enforce-enum-casing": [
      "error",
      {
        valueCasing: "kebab",
        ignoredFilePatterns: ["**/generated/**"],
      },
    ],
  },
}
```

## Branding and lint together

Lint rules may be disabled or omitted and cannot reliably follow every alias, re-export, generic, generated file, JavaScript consumer, or deliberately laundered value. Required branding provides ownership wherever TypeScript checks assignability. Lint adds repository-level conventions for casing, extraction, comparisons, subsets, derivation, and discriminated unions. Runtime parsing completes the model at external boundaries.

## `.cases` enforcement

`.cases` supplies the raw literal members used by native discriminated-union narrowing. That raw representation is type-correct outside its intended control-flow role, so TypeScript alone cannot keep it scoped there.

The `.cases` container carries a type marker used by the type-aware lint rule. The rule identifies case members and keeps them in their control-flow role:

- TypeScript performs the actual union narrowing.
- The brand remains required for ordinary application values.
- Lint keeps raw case values scoped to discriminated-union authoring and narrowing.

See [member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/#cases-native-discriminated-union-narrowing) for the intended pattern.
