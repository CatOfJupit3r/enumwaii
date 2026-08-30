import type { EnumwaiiParseError } from "../errors/enumwaii-parse-error";

/**
 * Internal unique-symbol key used to carry an enumwaii identity in the
 * TypeScript brand. This declaration supports emitted types; it is not a
 * package-addressable consumer API and has no runtime property on members.
 */
export declare const ENUMWAII_BRAND: unique symbol;

/**
 * Internal unique-symbol key marking the static `.cases` view. It supports
 * enumwaii's type relationships but is not a package-addressable consumer API.
 */
export declare const ENUMWAII_CASES_BRAND: unique symbol;

/**
 * Internal unique-symbol key marking static member tuples. It supports
 * enumwaii's type relationships but is not a package-addressable consumer API.
 */
export declare const ENUMWAII_VALUES_BRAND: unique symbol;

/**
 * Compile-time declaration-identity marker intersected with each branded
 * member.
 *
 * The marker prevents an arbitrary raw string, or a member from a declaration
 * with a different complete member set, from entering a branded position. It
 * is erased at runtime: branded members remain ordinary serializable strings.
 * This type is exported from the source graph for inference and declaration
 * emission; use members from `.enum` rather than constructing the marker.
 *
 * @example
 * ```ts
 * type RoleRaw = "ADMIN" | "USER";
 * type RoleIdentity = EnumwaiiIdentity<RoleRaw>;
 * type RoleBrand = EnumwaiiBrand<RoleIdentity, RoleRaw>;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md
 */
export interface EnumwaiiBrand<
  TIdentity extends string,
  TRaw extends string = string,
> {
  /** Compile-time identity and raw-literal information; absent at runtime. */
  readonly [ENUMWAII_BRAND]: {
    /** The declaration identity carried by this branded member. */
    readonly identity: TIdentity;
    /** The underlying raw string literal carried by this branded member. */
    readonly raw: TRaw;
    /** Invariance marker preventing accidental identity substitution. */
    readonly invariant: (identity: TIdentity) => TIdentity;
  };
}

/**
 * A raw member literal branded with the identity of its declaration.
 *
 * Use the values exposed by an enumwaii declaration's `.enum` object instead
 * of asserting this type. The brand is compile-time only; at runtime a value
 * compares and serializes exactly like its underlying string. Two declarations
 * with the same complete raw member set intentionally produce compatible
 * identities, while a different set does not.
 *
 * @example
 * ```ts
 * type RoleRaw = "ADMIN" | "USER";
 * type Role = EnumwaiiValue<RoleRaw, EnumwaiiIdentity<RoleRaw>>;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#the-required-brand
 */
export type EnumwaiiValue<
  TRaw extends string,
  TIdentity extends string = string,
> = TRaw extends string ? TRaw & EnumwaiiBrand<TIdentity, TRaw> : never;

/**
 * A template-literal identity union derived from a declaration's complete raw
 * member union.
 *
 * This type is used internally by {@link EnumwaiiValue}; consumers normally
 * infer it from the declaration rather than spelling it. For a union such as
 * `"ADMIN" | "USER"`, the result is the union `"enumwaii:ADMIN" |
 * "enumwaii:USER"`; the invariant brand use represents the complete member
 * set rather than one handwritten identity string. Equal member sets are
 * compatible regardless of order, while overlapping but different sets are
 * distinct.
 *
 * @example
 * ```ts
 * type RoleIdentity = EnumwaiiIdentity<"ADMIN" | "USER">;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#how-identity-is-chosen
 */
export type EnumwaiiIdentity<TRaw extends string> = `enumwaii:${TRaw}`;

interface EnumwaiiCasesBrand<TIdentity extends string> {
  readonly [ENUMWAII_CASES_BRAND]: TIdentity;
}

interface EnumwaiiValuesBrand<TIdentity extends string> {
  readonly [ENUMWAII_VALUES_BRAND]: TIdentity;
}

/**
 * Raw-literal object view used for native discriminated-union narrowing.
 *
 * Each property remains an unbranded literal so `switch` and equality checks
 * narrow reliably. Use a declaration's `.enum` view for application values;
 * this type's identity marker exists only for static relationships and linting.
 * The runtime object is a frozen plain object shared with `.enum` and
 * `.rawEnum`.
 *
 * @example
 * ```ts
 * const EVENT_CASE = eventType.cases;
 * type Event = { type: typeof EVENT_CASE.CREATED } | { type: typeof EVENT_CASE.DELETED };
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#cases-native-discriminated-union-narrowing
 */
export type EnumwaiiCases<TRaw extends string, TIdentity extends string> = {
  readonly [K in TRaw]: K;
} & EnumwaiiCasesBrand<TIdentity>;

/**
 * A frozen, non-empty tuple of members carrying one declaration's static
 * identity.
 *
 * `EnumwaiiValues` describes both `.values` (branded members) and `.rawValues`
 * (raw literals). Use `.values` for owned application iteration and
 * `.rawValues` only at integrations; reconstructing an enum with a raw tuple
 * creates a new inferred relationship rather than preserving composition.
 *
 * @example
 * ```ts
 * type RoleRaw = "ADMIN" | "USER";
 * type RoleIdentity = EnumwaiiIdentity<RoleRaw>;
 * type RoleValue = EnumwaiiValue<RoleRaw, RoleIdentity>;
 * type RoleValues = EnumwaiiValues<RoleValue, RoleIdentity>;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#values-branded-iteration
 */
export type EnumwaiiValues<
  TValue extends string,
  TIdentity extends string,
> = readonly [TValue, ...TValue[]] & EnumwaiiValuesBrand<TIdentity>;

/**
 * Extracts an enumwaii declaration's branded member union.
 *
 * This is useful for naming a function parameter or a derived type without
 * repeating the raw member union. It accepts an `Enumwaii`-like source with the
 * declaration-only `~type` property and falls back to an
 * {@link EnumwaiiSource}'s inferred raw and identity parameters.
 *
 * @example
 * ```ts
 * type Role = InferEnumwaii<typeof roles>;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#type-only-properties
 */
export type InferEnumwaii<TEnum> = TEnum extends {
  readonly "~type": infer TValue;
}
  ? TValue
  : TEnum extends EnumwaiiSource<infer TRaw, infer TIdentity>
    ? EnumwaiiValue<TRaw, TIdentity>
    : never;

/**
 * Extracts an enumwaii declaration's raw member union.
 *
 * Use this for raw-keyed integration records. For discriminated unions, prefer
 * named members from a declaration's `.cases` view so the vocabulary's
 * provenance and lint guidance remain visible. This is a type helper only and
 * does not validate runtime strings; use `Enumwaii.is`, `Enumwaii.parse`, or
 * `Enumwaii.safeParse` at data boundaries.
 *
 * @example
 * ```ts
 * import { em } from "enumwaii";
 * const roleSet = em(["ADMIN", "USER"]);
 * type RoleKey = InferEnumwaiiCase<typeof roleSet>;
 * const labels: Record<RoleKey, string> = { ADMIN: "Admin", USER: "User" };
 * const ROLE_CASE = roleSet.cases;
 * type Event =
 *   | { type: typeof ROLE_CASE.ADMIN; record: unknown }
 *   | { type: typeof ROLE_CASE.USER; id: string };
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#cases-native-discriminated-union-narrowing
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md
 */
export type InferEnumwaiiCase<TEnum> = TEnum extends {
  readonly "~keys": infer TKeys;
}
  ? TKeys
  : TEnum extends EnumwaiiSource<infer TRaw, infer _TIdentity>
    ? TRaw
    : never;

/**
 * The minimal structural source accepted by `em.combine`.
 *
 * This interface is useful for generic helpers that consume an existing
 * declaration without depending on its class implementation. Its identity is
 * carried by the branded `rawValues` tuple; equal complete sets are compatible
 * by design.
 *
 * @example
 * ```ts
 * function members(source: EnumwaiiSource) {
 *   return source.rawValues;
 * }
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
 */
export interface EnumwaiiSource<
  TRaw extends string = string,
  TIdentity extends string = string,
> {
  /** Frozen raw member tuple owned by the source declaration. */
  readonly rawValues: EnumwaiiValues<TRaw, TIdentity>;
}

/**
 * Recovery options shared by `Enumwaii.parse` and `Enumwaii.safeParse`.
 *
 * Both values must already be branded members of the same declaration. A
 * `default` handles only `null` and `undefined`; a `fallback` handles any
 * otherwise-invalid input. If both apply to nil input, `default` wins.
 * TypeScript enforces member ownership; JavaScript and unsafe casts bypass
 * that check because recovery values are trusted rather than revalidated.
 *
 * @example
 * ```ts
 * const ROLE = roles.enum;
 * roles.parse(input, { default: ROLE.USER, fallback: ROLE.GUEST });
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#defaults-and-fallbacks
 */
export interface EnumwaiiParseOptions<TValue extends string> {
  /** Used only when the input is `null` or `undefined`; takes precedence over `fallback`. */
  readonly default?: TValue;
  /** Used for any otherwise-invalid input, including non-nil values. */
  readonly fallback?: TValue;
}

/**
 * Discriminated result returned by `Enumwaii.safeParse`.
 *
 * Check `success` before reading `value` or `error`; TypeScript then narrows to
 * the corresponding branch. A failure is an {@link EnumwaiiParseError}, while
 * recovery options turn an otherwise-invalid input into a success. Diagnostic
 * construction is safe for arbitrary inputs, including `bigint`, circular
 * objects, and proxies that reject inspection.
 *
 * @example
 * ```ts
 * const result = roles.safeParse(input);
 * if (result.success) useRole(result.value);
 * else report(result.error);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#parsing
 */
export type EnumwaiiSafeParseResult<
  TRaw extends string,
  TIdentity extends string,
> =
  | {
      /** `true` when `value` contains an owned member. */
      readonly success: true;
      /** Validated or recovered branded member on success. */
      readonly value: EnumwaiiValue<TRaw, TIdentity>;
    }
  | {
      /** `false` when validation failed without recovery. */
      readonly success: false;
      /** Parse failure describing the received value. */
      readonly error: EnumwaiiParseError;
    };

/**
 * Frozen exhaustive lookup produced by `Enumwaii.derive` or
 * `Enumwaii.deriveTo`.
 *
 * `get` is the branded application-facing lookup; `record` is a shallowly
 * frozen raw-keyed view for integrations. Derived output objects and arrays
 * are not cloned or frozen. `get` currently returns the union of all output
 * types rather than correlating a particular source argument with one tuple
 * entry. Runtime lookup assumes its branded input, so an unsafe cast or plain
 * JavaScript key can produce `undefined`.
 *
 * @example
 * ```ts
 * const ROLE = roles.enum;
 * const labels = roles.derive([ROLE.ADMIN, "Admin"], [ROLE.USER, "User"]);
 * labels.get(ROLE.ADMIN);
 * labels.record.ADMIN;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#get-and-record
 */
export interface EnumwaiiDerived<
  TRaw extends string,
  TIdentity extends string,
  TValue,
> {
  /** Looks up an output using an owned branded source member. */
  readonly get: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue;
  /** Shallowly frozen raw-keyed lookup for integrations and object-shaped consumers. */
  readonly record: Readonly<Record<TRaw, TValue>>;
}

/**
 * Contextually typed entry builder returned by `Enumwaii.derive<TValue>()`.
 *
 * Use this builder when every derived output should conform to an existing
 * application type. Each tuple's output is checked against `TValue` without a
 * repeated `satisfies` expression, while exact source-member inference keeps
 * the usual missing-member and duplicate-member validation.
 *
 * @example
 * ```ts
 * interface RoleMetadata { readonly label: string; readonly rank: number }
 * const metadata = roles.derive<RoleMetadata>()(
 *   [ROLE.ADMIN, { label: "Administrator", rank: 2 }],
 *   [ROLE.USER, { label: "Member", rank: 1 }],
 * );
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#contextually-typed-entries
 */
export interface EnumwaiiDeriveBuilder<
  TRaw extends string,
  TIdentity extends string,
  TValue,
> {
  /**
   * Builds an exhaustive lookup from contextually typed member/output tuples.
   *
   * @param entries One typed tuple for every source member, in any order.
   * @returns A derived lookup whose `get` result is `TValue`.
   */
  <
    const TKeys extends readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ],
  >(
    ...entries: {
      readonly [TIndex in keyof TKeys]: readonly [TKeys[TIndex], TValue];
    } & EnumwaiiValidateDeriveEntries<
      TRaw,
      TIdentity,
      {
        readonly [TIndex in keyof TKeys]: readonly [TKeys[TIndex], TValue];
      }
    >
  ): EnumwaiiDerived<TRaw, TIdentity, TValue>;
}

/**
 * One source-member/output tuple accepted by entry-based `Enumwaii.derive`.
 *
 * Keeping the source member in a value position preserves declaration
 * provenance during inference. The public overload validates that a tuple is
 * provided for every member exactly once.
 *
 * @example
 * ```ts
 * type RoleRaw = "ADMIN" | "USER";
 * type RoleIdentity = EnumwaiiIdentity<RoleRaw>;
 * type LabelEntry = EnumwaiiDeriveEntry<RoleRaw, RoleIdentity, string>;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#entry-based-derivation
 */
export type EnumwaiiDeriveEntry<
  TRaw extends string,
  TIdentity extends string,
  TValue = unknown,
> = readonly [EnumwaiiValue<TRaw, TIdentity>, TValue];

/**
 * One source-member/output tuple accepted by `Enumwaii.deriveTo`.
 *
 * The output is either one branded member of the target declaration or a
 * readonly array of target members (which may be empty). Both source and
 * target provenance are checked statically, and target membership is checked
 * at runtime as well.
 *
 * @example
 * ```ts
 * type RoleRaw = "ADMIN" | "USER";
 * type RoleIdentity = EnumwaiiIdentity<RoleRaw>;
 * type PermissionRaw = "READ" | "WRITE";
 * type PermissionIdentity = EnumwaiiIdentity<PermissionRaw>;
 * type GrantEntry = EnumwaiiDeriveToEntry<
 *   RoleRaw,
 *   RoleIdentity,
 *   PermissionRaw,
 *   PermissionIdentity
 * >;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#deriveto
 */
export type EnumwaiiDeriveToEntry<
  TRaw extends string,
  TIdentity extends string,
  TTargetRaw extends string,
  TTargetIdentity extends string,
> = readonly [
  EnumwaiiValue<TRaw, TIdentity>,
  (
    | EnumwaiiValue<TTargetRaw, TTargetIdentity>
    | readonly EnumwaiiValue<TTargetRaw, TTargetIdentity>[]
  ),
];

type EnumwaiiDeriveEntriesRaw<
  TEntries extends readonly (readonly [string, unknown])[],
  TIdentity extends string,
> = EnumwaiiRawValue<TEntries[number][0], TIdentity>;

type EnumwaiiDuplicateDeriveEntryKeys<
  TEntries extends readonly (readonly [string, unknown])[],
  TSeen extends string = never,
> = TEntries extends readonly [
  readonly [infer TKey extends string, unknown],
  ...infer TRest extends readonly (readonly [string, unknown])[],
]
  ? TKey extends TSeen
    ? TKey | EnumwaiiDuplicateDeriveEntryKeys<TRest, TSeen>
    : EnumwaiiDuplicateDeriveEntryKeys<TRest, TSeen | TKey>
  : never;

/**
 * Compile-time exhaustiveness validator for tuple-based derivation.
 *
 * A valid entry list resolves to `unknown`; otherwise it produces a diagnostic
 * shape naming missing or duplicate source members. This support type is
 * exported from the source graph for declaration signatures but is not
 * package-addressable as a root consumer import.
 */
export type EnumwaiiValidateDeriveEntries<
  TRaw extends string,
  TIdentity extends string,
  TEntries extends readonly EnumwaiiDeriveEntry<TRaw, TIdentity>[],
> = [Exclude<TRaw, EnumwaiiDeriveEntriesRaw<TEntries, TIdentity>>] extends [
  never,
]
  ? [EnumwaiiDuplicateDeriveEntryKeys<TEntries>] extends [never]
    ? unknown
    : {
        readonly "~enumwaii-error": "Duplicate entry for member";
        readonly member: EnumwaiiDuplicateDeriveEntryKeys<TEntries>;
      }[]
  : {
      readonly "~enumwaii-error": "Missing entry for member";
      readonly member: Exclude<
        TRaw,
        EnumwaiiDeriveEntriesRaw<TEntries, TIdentity>
      >;
    }[];

/**
 * Extracts the raw literal from a branded member with a specified identity.
 *
 * This support type powers subset composition signatures. It is exported from
 * the source graph for declaration emission but is not package-addressable as
 * a root consumer import; consumers should infer values from the public
 * declaration APIs instead.
 */
export type EnumwaiiRawValue<TValue, TIdentity extends string> =
  TValue extends EnumwaiiValue<infer TRaw, TIdentity> ? TRaw : never;
