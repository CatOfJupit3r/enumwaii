---
title: Releases and compatibility
description: Runtime requirements, module formats, optional peers, versioning, and support policy.
---

## Runtime and modules

- Node.js 18 or newer is supported by both published packages. The ESLint plugin
  is specifically a Node-based development tool.
- The core package's ESM entry is additionally exercised under Bun 1.4, Deno
  2.9, and Cloudflare Workers. The Worker configuration explicitly disables
  both Node compatibility modes.
- Both packages publish ESM and CommonJS entry points, declarations, and source
  maps.
- Package exports define every supported subpath. Import internal files only at
  your own risk; they are not part of the compatibility contract.
- Runtime package code is marked side-effect free.

The [Hono compatibility application](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples/hono)
runs its complete Drizzle + PGlite order console through native Node, Bun, and
Deno servers. Its database-free status routes are also bundled and executed in
Cloudflare `workerd`, where both Node compatibility modes are disabled. Every
non-Node host exercises one shared HTTP contract, and a Wrangler dry-run checks
the production Worker bundle. These pinned CI versions are compatibility
canaries, not a promise that every older Bun or Deno release is supported.

## Dependencies

The core package has one regular dependency: `@standard-schema/spec`, whose
types are part of the public declaration surface. Zod and Valibot are optional
peer dependencies loaded only through `enumwaii/zod` and `enumwaii/valibot`.

The ESLint package supports ESLint 8, 9, and 10 and TypeScript 5.5 through the
current 6.x line. TypeScript is optional for the syntax-only preset and required
for the type-aware preset.

## Versioning

The project uses Changesets. A user-visible package change includes a changeset
that records the affected package and release level. Merging the generated
release pull request publishes npm packages from GitHub Actions with npm
provenance.

Before 1.0, a minor release may contain an API change that would be semver-major
after 1.0. Read the package changelog when updating across minor versions.

## Support and security

Only the latest published version receives fixes. For usage questions and bug
reports, follow the repository's [support guide](https://github.com/CatOfJupit3r/enumwaii/blob/main/SUPPORT.md).
Report vulnerabilities privately according to the [security policy](https://github.com/CatOfJupit3r/enumwaii/blob/main/SECURITY.md).
