---
title: AI agents
description: Give coding agents current enumwaii knowledge, or prompt them to set up and assess a repository safely.
---

Enumwaii publishes agent guidance in two complementary forms. Use the one that
matches how the agent consumes project knowledge.

| Resource                                                                             | Use it when                                                                                               |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`llms.txt`](https://catofjupit3r.github.io/enumwaii/llms.txt)                       | A crawler or agent needs the standard concise discovery index for the documentation.                      |
| [`llms.md`](https://catofjupit3r.github.io/enumwaii/llms.md)                         | The agent needs the product model, API boundaries, limitations, safe workflow, and links to deeper pages. |
| [`enumwaii` skill](https://catofjupit3r.github.io/enumwaii/skills/enumwaii/SKILL.md) | A coding agent supports `SKILL.md`-style task instructions and should implement or review enumwaii usage. |

`llms.txt` follows the standard discovery format: a short project summary and
curated lists of Markdown resources. `llms.md` is deliberately authored as the
deeper guide rather than generated from the navigation tree or every page. It
gives an agent enough context to reason correctly before it follows a
task-specific link. Every documentation page is separately available as
Markdown by replacing its trailing slash with `.md`, such as
[`/docs/runtime-boundaries.md`](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries.md).

The npm package contains the same skill at
`node_modules/enumwaii/skills/enumwaii/SKILL.md`. It is generated and validated
with TanStack Intent as part of the repository checks. The hosted skill is read
from that packaged source during the documentation build, so the two copies
cannot drift.

## Quick-start implementation prompt

Copy this prompt into a coding agent when enumwaii is new to a repository. It
asks the agent to follow the repository's existing tooling rather than assuming
Node.js, pnpm, ESLint, or a particular application framework.

```text
Set up enumwaii in this repository and migrate one representative closed string
vocabulary end to end.

Before editing:
1. Inspect the repository's package manager, runtime targets, workspace layout,
   TypeScript configuration, lint setup, test commands, and local agent rules.
2. Load the enumwaii skill from the installed package or from
   https://catofjupit3r.github.io/enumwaii/skills/enumwaii/SKILL.md.
3. Identify a genuinely closed vocabulary that crosses an application boundary
   or drives behavior. Do not convert open-ended user text or generated code.

Implementation requirements:
- Install enumwaii using the repository's existing package manager. It supports
  npm, pnpm, Yarn, Bun, Deno, and Cloudflare Workers projects.
- Declare the complete value set with em([...]), extract the branded `.enum`
  object once, and derive the application type from `typeof declaration["~type"]`.
- Replace authored raw literals with members from the extracted object.
- Parse unknown JSON, route, form, database, environment, provider, or agent
  input at the boundary with parse, safeParse, is, or the Standard Schema
  declaration itself.
- Keep `.rawEnum`, `.rawValues`, and `.cases` out of ordinary application code.
  Use one only when its documented integration or discriminated-union edge case
  actually applies.
- Reuse pick, omit, extend, combine, derive, or deriveTo when they express an
  existing relationship; do not add wrappers around enumwaii.
- If the repository already uses ESLint, add eslint-plugin-enumwaii using the
  matching existing configuration style. Do not introduce ESLint solely to
  satisfy this step.
- Preserve public wire values and database values unless a change is explicitly
  requested.

Update focused tests for valid members, invalid external input, and any default
or fallback behavior. Run the repository's relevant formatting, type, lint,
test, and build commands. Finish with the files changed, the boundary chosen,
validation results, and any remaining raw-string call sites that intentionally
stay outside this first migration.
```

## Refactor blast-area prompt

Use this before a broad adoption. It is intentionally read-only: the output is
an evidence-backed migration map rather than a speculative automated rewrite.

```text
Analyze this repository for an enumwaii migration. Do not modify files, install
dependencies, or create commits.

First inspect the repository's workspace graph, package manager, runtime targets,
TypeScript and lint configuration, generated-code boundaries, database layer,
API contracts, schemas, tests, and build commands. Read the enumwaii skill at
https://catofjupit3r.github.io/enumwaii/skills/enumwaii/SKILL.md and use
https://catofjupit3r.github.io/enumwaii/llms.txt to locate the detailed docs you
need. Read https://catofjupit3r.github.io/enumwaii/llms.md when you need the full
ownership model and safe workflow.

Find candidate closed vocabularies represented by TypeScript enums, string-literal
unions, `as const` objects or arrays, repeated raw literals, Zod or Valibot enums,
database enums and constraints, GraphQL/OpenAPI/protobuf contracts, form options,
route or query values, state-machine states, permissions, event names, fixtures,
and exhaustive lookup objects. Exclude open-ended strings and generated files,
but trace their generated or external source of truth.

For every candidate, report:
- its defining files and current source of truth;
- the exact member set and whether values are public wire or persisted data;
- every producer, parser, consumer, comparison, switch, lookup, serializer,
  schema, database mapping, test fixture, and cross-package export you found;
- duplicate declarations and whether their complete sets are intentionally
  identical, overlapping, or unrelated;
- the likely enumwaii declaration owner and which uses need `.enum`, parsing,
  Standard Schema, an adapter, composition, derivation, or the narrow `.cases`
  escape hatch;
- migration risk, public compatibility constraints, and focused tests needed.

Call out TypeScript-specific hazards: object-key provenance loss, discriminated
union narrowing, branded values crossing package declarations, partial sets,
raw database/transport values, and assertions or `any` that can bypass ownership.
Also estimate lint impact from member extraction, raw comparisons, casing, direct
declaration references, and `.cases` usage.

Present the result as:
1. an executive summary with counts by confidence and risk;
2. a candidate inventory table with file references;
3. a dependency/blast-area map for high-risk candidates;
4. a phased migration order that starts with one low-risk vertical slice;
5. validation commands and rollback boundaries for each phase;
6. unresolved questions that require a maintainer decision.

Do not recommend enumwaii merely because a field is typed as string. Every
recommendation must be tied to evidence that the vocabulary is closed.
```

## Agent boundaries

Agent instructions improve generated code, but they do not replace TypeScript,
runtime parsing, or linting. The required brand is still the ownership authority;
the ESLint package handles source-level conventions; and external values remain
untrusted until a runtime boundary validates them.
