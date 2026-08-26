# Brandless native-literal investigation v2

This directory documents an isolated investigation. It does not change the published `enumwaii` implementation.

> Access note: the connected GitHub `main` branch did not contain the local/staged `experiments/brandless/*`, `brandless-prototype-*`, `brandless-*.fixture.ts`, or `tmp-*.mts` files named in the task. The experiments here reconstruct the problem independently. They do not replace, modify, or claim to review those local-only files.

## Conclusion

A pure library type whose value type is exactly the native literal `"ADMIN"` cannot also carry nominal ownership through normal TypeScript flow. Once two expressions have the same primitive literal type, TypeScript's structural type system has no remaining information that can distinguish a raw literal or a value from an incompatible enumwaii declaration.

No container-only, optional-brand, alias, phantom, overload, or unique-symbol metadata representation tested preserved all of these simultaneously:

1. exact native literal member types;
2. exhaustive computed object keys and native narrowing;
3. raw-string rejection;
4. incompatible complete-set rejection through arbitrary generic and collection flow.

Three designs remain defensible:

1. **Generated canonical string-enum carriers** — strongest compiler-only brandless runtime design, but requires code generation and exposes enum-member types rather than exact literal-union display types.
2. **Native public program plus a shadow branded TypeScript program** — keeps the exact native API and lets TypeScript propagate provenance through arbitrary libraries, but enforcement depends on a mandatory whole-project checker and approximately doubles checking work.
3. **Dual native/strict surface** — pure-library and predictable, but strict boundaries must accept explicit owned tokens rather than `ROLE.ADMIN` from the native surface.

For enumwaii before 1.0, do not make an ordinary lint-enforced brandless API the only/default strict mode. Keep the current strict value-brand guarantee or introduce an explicit strict token surface. Treat generated carriers or the shadow checker as experimental project modes until their deployment and declaration-file trust model are proven downstream.

## Experiment files

- `packages/eslint-plugin-enumwaii/test/brandless-investigation/harness.ts`
  - creates virtual TypeScript projects;
  - defines native and shadow-brand declarations;
  - runs a provenance analyzer over contextual assignments, calls, returns, assertions, comparisons, and switch cases;
  - records compiler counts and timing.
- `packages/eslint-plugin-enumwaii/test/brandless-investigation.test.ts`
  - contains the representation matrix, mandatory stress fixtures, cross-file/JavaScript cases, generated-carrier and dual-surface designs, runtime checks, and measurements.

## Commands

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter eslint-plugin-enumwaii exec vitest run test/brandless-investigation.test.ts
pnpm --filter eslint-plugin-enumwaii exec tsc --noEmit
pnpm format:check
pnpm lint
pnpm check
```

The full `pnpm check` workflow passed on GitHub Actions with TypeScript 6.0.3, Node 22, Vitest 4.1.11, Oxlint 1.80.0, and `oxlint-tsgolint` 7.0.2001.

## Designs tested

### 1. Container-only native values

```ts
const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
type Role = typeof roles["~type"]; // "ADMIN" | "USER" | "GUEST"
```

Result: native keys, derive exhaustiveness, switch narrowing, and runtime interop all work. TypeScript also accepts both `acceptRole("ADMIN")` and an overlapping foreign `actors.enum.ADMIN`. Container identity disappears as soon as a member is read.

### 2. Optional or soft value brands

An optional unique-symbol property does not reject raw literals because a value without the optional property remains assignable. It also still turns computed branded keys into widened computed properties. Phantom generic aliases and container variance have the same ownership-erasure boundary once the primitive member is extracted.

### 3. Required intersection brands

Required unique-symbol intersections with complete-set invariance reject raw and foreign values and flow through arbitrary generics. They reproduce the current disadvantages: computed keys cease to be native literal properties, object derivation loses exhaustiveness, and branded switch cases do not narrow the union to `never`.

### 4. Native program plus shadow branded program

The application is checked twice:

- the normal program sees native literal values;
- a second program substitutes enumwaii declarations whose member types carry a required invariant complete-set brand.

The second TypeScript program performs the difficult propagation. It naturally preserves ownership through user-defined and library generics, arrays, sets, maps, iterators, promises, callbacks, destructuring, spreads, imports, re-exports, overload selection, conditional types, and schema-output inference. The analyzer reports only where the shadow program proves a source is not assignable to an owned target.

This gives a defensible laundering distinction:

```ts
function identity<T>(value: T): T {
  return value;
}

function launder(_role: Role): "ADMIN" {
  return "ADMIN";
}

acceptRole(identity(ROLE.ADMIN)); // accepted: T preserves the shadow brand
acceptRole(launder(ROLE.ADMIN)); // rejected: the return expression manufactures raw "ADMIN"
```

Assertions that manufacture ownership are reported separately. `.d.ts` declarations are an explicit trust boundary: `declare const externalRole: Role` is accepted. An incorrect external declaration, `any`, disabled checking, or an uninspected transform can therefore launder a value.

The prototype uses a manually supplied shadow declaration to isolate the inference question. A production checker still needs a robust module substitution/source-transform stage, project-reference caching, diagnostics mapping, and incremental invalidation.

### 5. Generated canonical string-enum carriers

A generator can emit one ambient string enum for each canonical complete member set and map every `em([...])` with that exact set to the same carrier:

```ts
declare enum RoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

// Generated registry maps both orderings to RoleCarrier.
const roles = em(["ADMIN", "USER", "GUEST"]);
const sameRoles = em(["GUEST", "ADMIN", "USER"]);
```

String-enum members are nominal in the required direction while remaining assignable to `string`. Runtime values can still be ordinary primitive strings because the ambient carrier is type-only. Raw strings and different generated carrier enums are rejected, while aliases, generics, collections, computed keys, derive exhaustiveness, and switch narrowing pass.

Limitations:

- a generic library call cannot synthesize a fresh native enum declaration, so generation or a compiler transform is mandatory;
- the generated registry must canonicalize and deduplicate complete member sets;
- public types display as enum-member unions, not exactly `"ADMIN" | "USER" | "GUEST"`;
- schema tools that rebuild a literal union erase the carrier unless their adapter preserves the generated output type;
- independent generated declarations for the same set are not automatically compatible.

### 6. Dual native/strict surface

```ts
const ROLE = roles.enum; // native literals
const ROLE_TOKEN = roles.token; // required-branded strings

type Role = typeof roles["~type"];
type OwnedRole = typeof roles["~owned"];

acceptOwnedRole(ROLE_TOKEN.ADMIN);
roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});
```

This preserves native ergonomics for ordinary domain logic and strong ownership at selected boundaries. It does not satisfy the preferred strict syntax `acceptRole(ROLE.ADMIN)` because the native and strict surfaces are intentionally distinct.

## Stress-matrix result

The shadow-program fixture marks 22 expected diagnostics:

- 13 raw-string flows;
- 7 incompatible complete-set flows;
- 2 ownership-manufacturing assertions.

On the marked matrix, TypeScript 6.0.3 produced exactly those 22 findings: no marked false positives and no marked false negatives.

Accepted flows include direct members, aliases, parser results, same-complete-set declarations, identity helpers, arrays, `Set`, `Map`, iterators, generators, promises, async functions, callbacks, object/array spreads, destructuring, conditional expressions containing only owned values, overloads, constrained generics, custom generic containers, schema-inferred outputs, assignments, cross-file imports, re-exports, and JavaScript/JSDoc.

Rejected flows include direct/raw aliases, overlapping foreign members, raw or foreign contextual properties, raw returns, laundering returns, generic raw calls, raw overloads, raw constrained calls, reassignment, comparisons, switch cases, unsafe assertions, foreign schema outputs, and JavaScript raw/foreign arguments.

Intentional trust/escape cases:

- declared/external values typed as `Role` are trusted;
- `any`, unchecked JavaScript, suppression comments, and disabled project checking bypass enforcement;
- a dishonest third-party declaration can launder raw strings;
- dynamic runtime values are safe only after an enumwaii parser or another trusted validator assigns the owned type.

## TypeScript 6.0.3 measurements

Fixture: 32 declarations, four members each, with identity calls, copied value arrays, `Set` callbacks, promises, and generic consumers. Timings are one CI-run semantic-check sample and are noisy; type, symbol, and instantiation counts are the more stable comparison.

| Program | Check time | Types | Instantiations | Symbols | Diagnostics |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native brandless | 255.90 ms | 2,674 | 5,569 | 40,279 | 0 |
| Shadow required-brand | 236.88 ms | 3,067 | 6,507 | 40,423 | 0 |
| Generated carrier registry | 304.12 ms | 4,485 | 18,332 | 41,088 | 0 |

Additional provenance analyzer traversal: **46.59 ms**.

Native program + shadow program + analyzer: **539.37 ms**, or **2.11×** the native semantic-check sample. The shadow type representation added about **14.7% types** and **16.8% instantiations** over native. The generated carrier registry added about **67.7% types** and **229.2% instantiations** in this deliberately broad 32-entry registry fixture.

Repository-level CI observations for this branch:

- Oxlint type-aware pass: 599 ms on 33 files with 111 rules;
- focused brandless investigation tests: 4.38 s for six tests;
- full eslint-plugin test package: 7.96 s for twelve tests.

The 46.59 ms number is analyzer-core traversal, not a completed ESLint rule benchmark. A production ESLint rule should reuse one project/shadow program per project service; constructing a second program per file or per rule visitor would be unacceptable.

## Linter and tool deployment

### ESLint

A typed ESLint rule can obtain the backing TypeScript program and checker from typescript-eslint parser services. For the shadow design, the practical architecture is a project-scoped service or separate `enumwaii check` CLI that builds one shadow program, then maps diagnostics back into ESLint. Per-file provenance graphs should not reimplement generic/collection semantics that TypeScript already knows.

### Oxlint

Syntax-only custom rules can still reject obvious direct literals, assertions, comparisons, and switch cases. They cannot reliably distinguish imported aliases, foreign overlapping members, or erased collection provenance. Oxlint's current custom JavaScript plugin API is still alpha; its separate type-aware path is implemented through `tsgolint`/typescript-go. A reliable enumwaii ownership rule therefore needs either a first-class type-aware/native Oxlint rule or the separate project checker. Running the existing ESLint-style JS rule in Oxlint is not equivalent to receiving arbitrary TypeScript checker services.

### Downstream consumers without enforcement

For exact native literals, downstream users who do not install and run the checker receive ordinary structural TypeScript behavior: raw strings and overlapping foreign literals compile. This must be stated as a weaker mode, not hidden behind “type safe” language.

## Requirement scorecard

Legend: **Pass**, **Conditional**, **Fail**.

| Requirement | Native + ordinary lint | Native + shadow checker | Generated carriers | Dual surface |
| --- | --- | --- | --- | --- |
| Reject raw literals | Conditional / high escape risk | Pass when checker is mandatory | Pass | Pass at strict-token boundaries |
| Preserve generic and collection ownership | Fail after provenance erasure | Pass | Pass | Pass for tokens |
| Reject different complete sets | Conditional | Pass | Pass | Pass for tokens |
| Native computed keys | Pass | Pass in public program | Pass | Pass on native surface |
| Exhaustive object derive | Pass | Pass | Pass | Pass on native surface |
| Native switch/discriminated narrowing | Pass | Pass | Pass | Pass on native surface |
| Primitive runtime strings | Pass | Pass | Pass | Pass |
| JSON/URL/database/structured clone unchanged | Pass | Pass | Pass | Pass |
| Exact displayed literal union | Pass | Pass | Fail: enum-member union | Pass for native type |
| No mandatory project tooling | Pass, but weak | Fail | Fail | Pass |
| No library-specific propagation cases | Fail for provenance lint | Pass: TypeScript propagates | Pass: TypeScript propagates | Pass: TypeScript propagates tokens |
| Consumers without plugin remain protected | Fail | Fail | Pass after generated declarations are present | Pass at token boundaries |
| Preferred `acceptRole(ROLE.ADMIN)` strict syntax | Conditional | Pass | Pass | Fail |

## Recommendation before 1.0

1. Do not replace the published strict API with container-only native values plus the current style of provenance linting.
2. Keep value branding as the strict default unless enumwaii is willing to make a project checker or code-generation step part of the contract.
3. Improve strict ergonomics independently: isolate brands from derive keys, offer native views where interoperability is needed, improve diagnostics, and minimize escape APIs.
4. Optionally prototype two explicit modes:
   - `enumwaii/native`: exact literals, documented weaker ownership without the checker;
   - `enumwaii/strict` or `.token`: compiler-enforced owned boundaries.
5. Continue the generated-carrier and shadow-checker designs as experiments. Of the two, generated carriers provide the strongest downstream compiler guarantee; the shadow checker preserves the cleanest source and declaration types but is only as strong as its mandatory deployment and trust boundary.

There is no default-brandless migration outline here because no pure-library exact-native design met every acceptance criterion. Shipping a migration would overstate the guarantee.
