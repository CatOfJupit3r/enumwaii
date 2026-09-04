---
"eslint-plugin-enumwaii": minor
---

Add the public `no-object-em` and type-aware `no-manual-enum` rules. All recommended presets now use `no-object-em` to prefer array declarations while allowing narrowly documented external-contract or compatibility exceptions. The type-checked presets now use `no-manual-enum` to report hand-built string unions, discriminants, and const-container vocabularies that should be owned by enumwaii. Both rules support shared, rationale-required declaration-name exceptions and intentionally provide no autofix.
