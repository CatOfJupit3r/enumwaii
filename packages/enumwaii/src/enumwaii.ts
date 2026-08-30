import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiError } from "./errors/enumwaii-error";
import { EnumwaiiParseError } from "./errors/enumwaii-parse-error";
import { createStandardSchemaProps } from "./internal/create-standard-schema";
import type {
  EnumwaiiCases,
  EnumwaiiDeriveBuilder,
  EnumwaiiDeriveEntry,
  EnumwaiiDerived,
  EnumwaiiDeriveToEntry,
  EnumwaiiIdentity,
  EnumwaiiParseOptions,
  EnumwaiiRawValue,
  EnumwaiiSafeParseResult,
  EnumwaiiValue,
  EnumwaiiValidateDeriveEntries,
  EnumwaiiValues,
} from "./types/enumwaii";

/**
 * A closed, nominally branded vocabulary of string members.
 *
 * Use `em` to construct a declaration, then use `.enum` for ordinary
 * application values and `parse`/`safeParse`/`is` when strings enter from an
 * untrusted boundary. Members are ordinary strings at runtime, while their
 * TypeScript brand retains the declaration identity. The declaration owns a
 * copied, de-duplicated member set and exposes frozen member objects and
 * tuples. Composition methods preserve or intentionally create identity as
 * described by their individual comments.
 *
 * @example
 * ```ts
 * const roles = em(["ADMIN", "USER"]);
 * const role = roles.parse(inputFromRequest);
 * if (roles.is(role)) console.log(role);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md
 */
export class Enumwaii<
  TRaw extends string,
  TIdentity extends string = EnumwaiiIdentity<TRaw>,
> implements StandardSchemaV1<unknown, EnumwaiiValue<TRaw, TIdentity>> {
  /**
   * The default application surface: a frozen object mapping each raw member
   * to its branded {@link EnumwaiiValue}.
   *
   * Use this view for function arguments, comparisons, defaults, fixtures, and
   * derivation. It is the same plain runtime object as {@link rawEnum} and
   * {@link cases}; those names represent different static views only. Unknown
   * properties follow ordinary object behavior and read as `undefined`.
   *
   * @example
   * ```ts
   * const ROLE = roles.enum;
   * acceptRole(ROLE.ADMIN);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#enum-the-default
   */
  public readonly enum: {
    readonly [K in TRaw]: EnumwaiiValue<K, TIdentity>;
  };

  /**
   * A frozen raw-literal view of the member object for integration APIs that
   * cannot accept enumwaii's TypeScript brand.
   *
   * Prefer {@link enum} in application code. Values returned from a provider
   * or other integration should be validated with {@link parse},
   * {@link safeParse}, or {@link is} before re-entering branded code. At
   * runtime this is the same object as `enum` and `cases`.
   *
   * @example
   * ```ts
   * const RAW_ROLE = roles.rawEnum;
   * provider.configure({ defaultRole: RAW_ROLE.USER });
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#rawenum-and-rawvalues-integration-escapes
   */
  public readonly rawEnum: {
    readonly [K in TRaw]: K;
  };

  /**
   * A raw-literal object view intended specifically for native discriminated
   * union narrowing.
   *
   * Use `cases` when a union discriminant must be a plain literal for
   * TypeScript's `switch` or equality narrowing. It is not a second general
   * purpose enum; use {@link enum} for application values. The frozen runtime
   * object is shared with `enum` and `rawEnum`.
   *
   * @example
   * ```ts
   * const EVENT_CASE = eventType.cases;
   * type Event =
   *   | { type: typeof EVENT_CASE.CREATED; record: unknown }
   *   | { type: typeof EVENT_CASE.DELETED; id: string };
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#cases-native-discriminated-union-narrowing
   */
  public readonly cases: EnumwaiiCases<TRaw, TIdentity>;

  /**
   * The frozen tuple of branded members in first-seen declaration order.
   *
   * Iterate this view when application code needs every owned member. Do not
   * pass it to `em` to reconstruct a declaration: use {@link extend},
   * {@link pick}, {@link omit}, or `em.combine` to retain the intended
   * identity relationship.
   *
   * @example
   * ```ts
   * for (const role of roles.values) acceptRole(role);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#values-branded-iteration
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
   */
  public readonly values: EnumwaiiValues<
    EnumwaiiValue<TRaw, TIdentity>,
    TIdentity
  >;

  /**
   * The frozen tuple of unbranded raw members in first-seen declaration order.
   *
   * Use this escape surface only for integrations that require literal strings
   * or arrays. Data coming back from that boundary must be validated before it
   * is treated as an owned member.
   *
   * @example
   * ```ts
   * database.defineEnum("role", roles.rawValues);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#rawenum-and-rawvalues-integration-escapes
   */
  public readonly rawValues: EnumwaiiValues<TRaw, TIdentity>;

  /**
   * The Standard Schema v1 protocol surface for strict membership validation.
   *
   * Pass the whole declaration to a Standard Schema consumer when supported,
   * or call this property's `validate` function directly. A valid value returns
   * `{ value }`; an invalid value returns protocol issues containing the parse
   * message. This path validates membership only and does not apply parse
   * recovery options such as `default` or `fallback`. Issue construction uses
   * the same non-throwing diagnostic representation as {@link parse}, including
   * for `bigint`, circular structures, and hostile proxies.
   *
   * @example
   * ```ts
   * consumer.acceptSchema(roles);
   * const result = roles["~standard"].validate(input);
   * ```
   *
   * @see https://standardschema.dev/
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
   */
  public readonly "~standard": StandardSchemaV1<
    unknown,
    EnumwaiiValue<TRaw, TIdentity>
  >["~standard"];

  /**
   * Declaration-only raw member union for TypeScript record helpers.
   *
   * `~keys` is erased and absent at runtime; use {@link rawValues} when a
   * runtime array is needed. It is useful with `satisfies` for external
   * raw-keyed records.
   *
   * @example
   * ```ts
   * const labels = {
   *   ADMIN: "Administrator",
   *   USER: "Member",
   * } as const satisfies Record<(typeof roles)["~keys"], string>;
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#type-only-properties
   */
  declare public readonly "~keys": TRaw;

  /**
   * Declaration-only branded member union for extracting this enum's value
   * type with `typeof declaration["~type"]`.
   *
   * `~type` is erased and absent at runtime. Prefer this helper or
   * `InferEnumwaii` when a named type alias is needed; do not use it as a
   * runtime property.
   *
   * @example
   * ```ts
   * type Role = (typeof roles)["~type"];
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#type-only-properties
   */
  declare public readonly "~type": EnumwaiiValue<TRaw, TIdentity>;

  /**
   * Declaration-only result type returned by this enum's {@link safeParse}.
   *
   * `~safeParseResult` is erased and absent at runtime. Use it when a function
   * or component needs to name this exact declaration's parse result without
   * reconstructing its raw and identity parameters or using `ReturnType`.
   *
   * @example
   * ```ts
   * type RoleParseResult = (typeof roles)["~safeParseResult"];
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md#type-only-properties
   */
  declare public readonly "~safeParseResult": EnumwaiiSafeParseResult<
    TRaw,
    TIdentity
  >;

  private readonly memberSet: ReadonlySet<string>;

  /**
   * Creates a declaration from a non-empty tuple of raw members.
   *
   * Prefer calling `em`; direct construction is useful when a generic
   * wrapper already has the `Enumwaii` type. The input is copied immediately,
   * duplicate values are removed in first-seen order, and all exposed member
   * objects and tuples are frozen. The constructor has no runtime enum name.
   *
   * @param rawValues Non-empty raw member tuple to own.
   * @throws {@link EnumwaiiError} If the runtime tuple is empty.
   *
   * @example
   * ```ts
   * const roles = new Enumwaii(["ADMIN", "USER"]);
   * ```
   */
  public constructor(rawValues: readonly [TRaw, ...TRaw[]]) {
    if (rawValues.length === 0) {
      throw new EnumwaiiError("An enum must have at least one member");
    }

    const ownedRawValues = Object.freeze([
      ...new Set(rawValues),
    ]) as unknown as EnumwaiiValues<TRaw, TIdentity>;
    const memberSet = new Set<string>(ownedRawValues);

    this.rawValues = ownedRawValues;
    this.memberSet = memberSet;
    this.values = ownedRawValues as unknown as EnumwaiiValues<
      EnumwaiiValue<TRaw, TIdentity>,
      TIdentity
    >;
    const members = Object.freeze(
      Object.fromEntries(ownedRawValues.map((value) => [value, value])),
    );
    this.enum = members as {
      readonly [K in TRaw]: EnumwaiiValue<K, TIdentity>;
    };
    this.rawEnum = members as { readonly [K in TRaw]: K };
    this.cases = members as EnumwaiiCases<TRaw, TIdentity>;
    this["~standard"] = createStandardSchemaProps(this);
  }

  /**
   * Tests whether an unknown value is a string in this declaration's member
   * set and narrows it to the branded member union.
   *
   * Use this as a non-throwing boundary check when you want to branch rather
   * than recover or throw. Runtime membership cannot distinguish equal strings
   * originating from different declarations.
   *
   * @param input Value to test.
   * @returns `true` only for a string accepted by this declaration.
   *
   * @example
   * ```ts
   * if (roles.is(payload.role)) useRole(payload.role);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#parsing
   */
  public is(input: unknown): input is EnumwaiiValue<TRaw, TIdentity> {
    return typeof input === "string" && this.memberSet.has(input);
  }

  /**
   * Validates an unknown value and returns an owned branded member.
   *
   * Invalid values throw {@link EnumwaiiParseError}. `default` is considered
   * only for `null` or `undefined`; `fallback` handles any otherwise-invalid
   * input, and `default` wins when both apply to a nil input. TypeScript
   * requires both recovery values to be members of this declaration; they are
   * trusted and are not revalidated at runtime. Error construction is safe for
   * arbitrary inputs and retains the exact rejected value.
   *
   * @param input Value to validate.
   * @param options Optional nil default and invalid-input fallback.
   * @returns The existing or recovered branded member.
   * @throws {@link EnumwaiiParseError} When input is invalid and no applicable
   * recovery option is supplied.
   *
   * @example
   * ```ts
   * const ROLE = roles.enum;
   * const role = roles.parse(payload.role, { fallback: ROLE.USER });
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#defaults-and-fallbacks
   */
  public parse(
    input: unknown,
    options?: EnumwaiiParseOptions<EnumwaiiValue<TRaw, TIdentity>>,
  ): EnumwaiiValue<TRaw, TIdentity> {
    const result = this.safeParse(input, options);
    if (result.success) return result.value;
    throw result.error;
  }

  /**
   * Validates an unknown value and returns a discriminated success/failure
   * result instead of throwing an {@link EnumwaiiParseError} for an ordinary
   * invalid input.
   *
   * The recovery rules match {@link parse}: `default` applies only to
   * `null`/`undefined`, `fallback` applies to all other invalid inputs, and
   * `default` wins when both apply. Without recovery, every invalid input
   * produces an {@link EnumwaiiParseError}; diagnostic construction is safe for
   * arbitrary values and retains the exact rejected input. Recovery values are
   * trusted after TypeScript checks and are not revalidated at runtime. Success
   * contains the branded member.
   *
   * @param input Value to validate.
   * @param options Optional nil default and invalid-input fallback.
   * @returns A discriminated result whose `success` flag narrows `value` or
   * `error`.
   * @example
   * ```ts
   * const result = roles.safeParse(payload.role);
   * if (result.success) useRole(result.value);
   * else report(result.error);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#parsing
   */
  public safeParse(
    input: unknown,
    options?: EnumwaiiParseOptions<EnumwaiiValue<TRaw, TIdentity>>,
  ): EnumwaiiSafeParseResult<TRaw, TIdentity> {
    if (this.is(input)) return { success: true, value: input };
    if (
      (input === null || input === undefined) &&
      options?.default !== undefined
    ) {
      return { success: true, value: options.default };
    }
    if (options?.fallback !== undefined) {
      return { success: true, value: options.fallback };
    }
    return {
      success: false,
      error: new EnumwaiiParseError(input),
    };
  }

  /**
   * Adds members while retaining this declaration's identity.
   *
   * The source members stay compatible with the original declaration and
   * extra duplicates are removed in first-seen order. Use this for an intentional
   * superset; use `em` for an independently identified declaration.
   *
   * @param extraValues Non-empty raw literals to add.
   * @returns A new declaration with the source identity, extended raw domain,
   * and frozen public member surfaces.
   *
   * @example
   * ```ts
   * const allRoles = roles.extend(["BOT"]);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
   */
  public extend<TExtra extends string>(
    extraValues: readonly [TExtra, ...TExtra[]],
  ): Enumwaii<TRaw | TExtra, TIdentity> {
    return new Enumwaii([...this.rawValues, ...extraValues] as [
      TRaw | TExtra,
      ...(TRaw | TExtra)[],
    ]) as unknown as Enumwaii<TRaw | TExtra, TIdentity>;
  }

  /**
   * Creates a non-empty subset while retaining this declaration's identity.
   *
   * Pass branded members from this declaration in the desired order. Unknown
   * members fail at runtime, and an empty selection is rejected by the
   * constructor; duplicate selections are de-duplicated by the new declaration.
   *
   * @param pickedValues Non-empty owned members to keep.
   * @returns A subset declaration with the source identity and frozen public
   * member surfaces.
   * @throws {@link EnumwaiiError} If a selected member is unknown or the
   * runtime selection is empty.
   *
   * @example
   * ```ts
   * const ROLE = roles.enum;
   * const staffRoles = roles.pick([ROLE.ADMIN, ROLE.USER]);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
   */
  public pick<
    const TPicked extends readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ],
  >(
    pickedValues: TPicked,
  ): Enumwaii<EnumwaiiRawValue<TPicked[number], TIdentity>, TIdentity> {
    for (const value of pickedValues) {
      if (!this.memberSet.has(value)) {
        throw new EnumwaiiError(`Cannot pick unknown member "${value}"`);
      }
    }
    return new Enumwaii(pickedValues as never) as unknown as Enumwaii<
      EnumwaiiRawValue<TPicked[number], TIdentity>,
      TIdentity
    >;
  }

  /**
   * Creates a subset by removing members while retaining this declaration's
   * identity.
   *
   * Every omitted member must belong to this declaration, and at least one
   * source member must remain. The returned values preserve source order.
   *
   * @param omittedValues Non-empty owned members to remove.
   * @returns A subset declaration with the source identity and frozen public
   * member surfaces.
   * @throws {@link EnumwaiiError} If a member is unknown or every member would
   * be removed.
   *
   * @example
   * ```ts
   * const ROLE = roles.enum;
   * const nonGuestRoles = roles.omit([ROLE.GUEST]);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
   */
  public omit<
    const TOmitted extends readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ],
  >(
    omittedValues: TOmitted,
  ): Enumwaii<
    Exclude<TRaw, EnumwaiiRawValue<TOmitted[number], TIdentity>>,
    TIdentity
  > {
    const omittedSet = new Set<string>(omittedValues);
    for (const value of omittedValues) {
      if (!this.memberSet.has(value)) {
        throw new EnumwaiiError(`Cannot omit unknown member "${value}"`);
      }
    }

    const remaining = this.rawValues.filter((value) => !omittedSet.has(value));
    if (remaining.length === 0) {
      throw new EnumwaiiError("Cannot omit every member");
    }
    return new Enumwaii(remaining as never) as unknown as Enumwaii<
      Exclude<TRaw, EnumwaiiRawValue<TOmitted[number], TIdentity>>,
      TIdentity
    >;
  }

  /**
   * Derives an exhaustive lookup by applying one callback to every member.
   *
   * Choose this overload when all outputs follow the same transformation. The
   * callback receives a branded source member and is invoked once per member;
   * no missing or duplicate entries are possible. The result's `get` method
   * returns the union of output types, and its raw-keyed `record` is shallowly
   * frozen; returned objects and arrays remain caller-owned.
   *
   * @param build Transformation applied to every branded member.
   * @returns A derived lookup with frozen `get` and shallowly frozen `record`
   * views.
   *
   * @example
   * ```ts
   * const lowerRoles = roles.derive((role) => role.toLowerCase());
   * const ROLE = roles.enum;
   * lowerRoles.get(ROLE.ADMIN); // string
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#callback-derivation
   */
  public derive<TValue>(
    build: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue>;

  /**
   * Creates a contextually typed exhaustive entry builder.
   *
   * Choose this overload when derived outputs should conform to a named type.
   * Supplying the output type once checks every object literal without a
   * repeated `satisfies`, while the returned builder retains the same source
   * provenance, exhaustiveness, and duplicate checks as entry-based
   * derivation.
   *
   * @returns A function that accepts one typed tuple for every source member.
   *
   * @example
   * ```ts
   * const labels = roles.derive<RoleMetadata>()(
   *   [ROLE.ADMIN, { label: "Administrator" }],
   *   [ROLE.USER, { label: "Member" }],
   * );
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#contextually-typed-entries
   */
  public derive<TValue>(): EnumwaiiDeriveBuilder<TRaw, TIdentity, TValue>;

  /**
   * Derives an exhaustive lookup from branded `[member, output]` tuples.
   *
   * Choose this overload when each source member needs an explicit output or
   * when outputs do not share one transformation. Tuple values retain source
   * provenance, so TypeScript rejects raw strings, members from incompatible
   * declarations, missing members, and duplicate members. Runtime construction
   * repeats those unknown/missing/duplicate checks for JavaScript and unsafe
   * casts.
   *
   * @param entries One tuple for every source member, in any order.
   * @returns A derived lookup; `get` returns the union of tuple outputs and
   * `record` exposes the shallowly frozen raw-keyed lookup.
   * @throws {@link EnumwaiiError} If runtime entries are unknown, missing, or
   * duplicated.
   *
   * @example
   * ```ts
   * const ROLE = roles.enum;
   * const labels = roles.derive(
   *   [ROLE.ADMIN, "Administrator"],
   *   [ROLE.USER, "Member"],
   *   [ROLE.GUEST, "Guest"],
   * );
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#entry-based-derivation
   */
  public derive<
    const TEntries extends readonly [
      EnumwaiiDeriveEntry<TRaw, TIdentity>,
      ...EnumwaiiDeriveEntry<TRaw, TIdentity>[],
    ],
  >(
    ...entries: TEntries &
      EnumwaiiValidateDeriveEntries<TRaw, TIdentity, TEntries>
  ): EnumwaiiDerived<TRaw, TIdentity, TEntries[number][1]>;

  public derive<TValue>(
    ...input: readonly unknown[]
  ):
    | EnumwaiiDerived<TRaw, TIdentity, TValue>
    | EnumwaiiDeriveBuilder<TRaw, TIdentity, TValue> {
    if (input.length === 0) {
      return ((
        ...entries: readonly EnumwaiiDeriveEntry<TRaw, TIdentity, TValue>[]
      ) =>
        this.buildDerived(
          this.createDerivedMapping(entries),
        )) as EnumwaiiDeriveBuilder<TRaw, TIdentity, TValue>;
    }

    const first = input[0];
    if (typeof first === "function") {
      const build = first as (value: EnumwaiiValue<TRaw, TIdentity>) => TValue;
      const mapping = Object.fromEntries(
        this.values.map((value) => [value, build(value)]),
      ) as Record<TRaw, TValue>;
      return this.buildDerived(mapping);
    }

    return this.buildDerived(
      this.createDerivedMapping(
        input as readonly EnumwaiiDeriveEntry<TRaw, TIdentity, TValue>[],
      ),
    );
  }

  /**
   * Derives an exhaustive lookup whose outputs are members of another enumwaii
   * declaration.
   *
   * Use this for relationships between two closed vocabularies. Each source
   * tuple must be exhaustive and provenance-preserving like entry-based
   * {@link derive}; its output may be one target member or a readonly array of
   * target members (including an empty array). Runtime validation checks every
   * target value belongs to `target`, while source unknown/missing/duplicate
   * entries are also rejected. This runtime check is string membership only:
   * after an unsafe cast or JavaScript bypass, an equal string from a foreign
   * declaration is indistinguishable from a target member. The source identity
   * is retained by the result's static type.
   *
   * @param target Declaration that owns every derived target member.
   * @param entries One tuple for every source member.
   * @returns A derived lookup whose `get` result is the union of output shapes
   * and whose `record` is a shallowly frozen raw-keyed lookup.
   * @throws {@link EnumwaiiError} If source entries are invalid or an output is
   * outside the target declaration.
   *
   * @example
   * ```ts
   * const permissions = em(["READ", "WRITE"]);
   * const ROLE = roles.enum;
   * const PERMISSION = permissions.enum;
   * const grants = roles.deriveTo(
   *   permissions,
   *   [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
   *   [ROLE.USER, PERMISSION.READ],
   *   [ROLE.GUEST, []],
   * );
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#deriveto
   */
  public deriveTo<
    TTargetRaw extends string,
    TTargetIdentity extends string,
    const TEntries extends readonly [
      EnumwaiiDeriveToEntry<TRaw, TIdentity, TTargetRaw, TTargetIdentity>,
      ...EnumwaiiDeriveToEntry<TRaw, TIdentity, TTargetRaw, TTargetIdentity>[],
    ],
  >(
    target: Enumwaii<TTargetRaw, TTargetIdentity>,
    ...entries: TEntries &
      EnumwaiiValidateDeriveEntries<TRaw, TIdentity, TEntries>
  ): EnumwaiiDerived<TRaw, TIdentity, TEntries[number][1]> {
    const mapping = this.createDerivedMapping(entries);
    for (const value of Object.values(mapping)) {
      const targetValues = Array.isArray(value) ? value : [value];
      if (targetValues.some((targetValue) => !target.is(targetValue))) {
        throw new EnumwaiiError(
          "Derived mapping contains a value outside the target enum",
        );
      }
    }
    return this.buildDerived(mapping);
  }

  private createDerivedMapping<TValue>(
    entries: readonly EnumwaiiDeriveEntry<TRaw, TIdentity, TValue>[],
  ): Record<TRaw, TValue> {
    const seen = new Set<string>();
    for (const [key] of entries) {
      if (!this.memberSet.has(key)) {
        throw new EnumwaiiError(`Derived mapping has unknown key "${key}"`);
      }
      if (seen.has(key)) {
        throw new EnumwaiiError(`Derived mapping has duplicate key "${key}"`);
      }
      seen.add(key);
    }
    for (const value of this.rawValues) {
      if (!seen.has(value)) {
        throw new EnumwaiiError(`Derived mapping is missing "${value}"`);
      }
    }
    return Object.fromEntries(entries) as Record<TRaw, TValue>;
  }

  private buildDerived<TValue>(
    mapping: Record<TRaw, TValue>,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    function lookup(value: EnumwaiiValue<TRaw, TIdentity>): TValue {
      return mapping[value];
    }

    return Object.freeze({
      get: lookup,
      record: Object.freeze(mapping),
    });
  }
}
