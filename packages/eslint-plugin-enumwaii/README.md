# eslint-plugin-enumwaii

ESLint rules for [enumwaii](https://github.com/CatOfJupit3r/enumwaii). It includes a syntax-only recommended config and a stricter config that requires TypeScript parser services. The syntax rule can also run as an Oxlint JavaScript plugin.

The type-checked rules include `no-direct-enumwaii-reference`, which requires `.enum`, `.rawEnum`, and `.cases` to be extracted before their members are used. Other Enumwaii instance APIs remain available directly.
