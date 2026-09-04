import { Enumwaii } from "./enumwaii";
import type { EnumwaiiIdentity, EnumwaiiSource } from "./types/enumwaii";

type NonEmptyStrings = readonly [string, ...string[]];
type RawOf<TValues extends NonEmptyStrings> = TValues[number];
type RawOfMap<TMap extends Readonly<Record<string, string>>> =
  TMap[keyof TMap] & string;
type SourceRaw<TSource> =
  TSource extends EnumwaiiSource<infer TRaw, infer _TIdentity> ? TRaw : never;

/**
 * Callable and combinable construction surface for {@link Enumwaii} declarations.
 *
 * Call `em` with a non-empty tuple of string literals, or with a key-to-value
 * object when developer-facing names need to differ from wire values. The
 * complete, de-duplicated raw value set determines static identity, so keys are
 * cosmetic and declarations with the same value set remain compatible. Use
 * `combine` when composing existing declarations so that the combined set
 * receives its own identity.
 *
 * @example
 * ```ts
 * const roles = em(["ADMIN", "USER"]);
 * const ROLE = roles.enum;
 * ROLE.ADMIN; // branded application member
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md
 */
export interface Em {
  /**
   * Declares a non-empty closed set of string members.
   *
   * Use the returned declaration's `.enum` view for application values. Input
   * is copied and duplicate raw values are removed in first-seen order; an
   * empty tuple is rejected at runtime. Identity is derived from the complete
   * member union.
   *
   * @param rawValues Non-empty string-literal members to own.
   * @returns An {@link Enumwaii} declaration with branded members and frozen
   * public member surfaces.
   * @throws An `EnumwaiiError` if the runtime input has no members.
   *
   * @example
   * ```ts
   * const status = em(["OPEN", "CLOSED"] as const);
   * const STATUS = status.enum;
   * const value = STATUS.OPEN;
   * ```
   */
  <const TValues extends NonEmptyStrings>(
    rawValues: TValues,
  ): Enumwaii<RawOf<TValues>, EnumwaiiIdentity<RawOf<TValues>>>;

  /**
   * Declares a closed set with developer-facing keys mapped to raw values.
   *
   * Use this escape hatch when an external protocol's canonical strings do not
   * follow the naming convention desired in application code. Keys appear on
   * `.enum`, `.rawEnum`, and `.cases`; values drive parsing, iteration,
   * Standard Schema validation, adapters, derivation, and declaration identity.
   * The object is copied, and its values must be unique.
   *
   * @param members Key-to-raw value members to own.
   * @returns An {@link Enumwaii} declaration whose public object views retain
   * the supplied keys while all value-oriented APIs use the mapped strings.
   * @throws An `EnumwaiiError` if the runtime object is empty or contains a
   * duplicate value.
   *
   * @example
   * ```ts
   * const statuses = em({
   *   ORDER_PAID: "order-paid",
   *   ORDER_PENDING: "order-pending",
   * });
   * statuses.enum.ORDER_PAID; // branded "order-paid"
   * ```
   */
  <const TMap extends Readonly<Record<string, string>>>(
    members: TMap,
  ): Enumwaii<RawOfMap<TMap>, EnumwaiiIdentity<RawOfMap<TMap>>, TMap>;

  /**
   * Combines one or more existing declarations into a declaration for their
   * union of members.
   *
   * Use this when related vocabularies need one target domain. Members are
   * concatenated in source order and duplicate raw values are retained only at
   * their first occurrence. The result receives identity from the complete
   * combined set and exposes identity keys where key equals value; source
   * aliases are declaration-local and are not merged.
   *
   * @param sources Non-empty declarations to combine.
   * @returns A declaration for the combined member set with frozen public
   * member surfaces.
   * @throws An `EnumwaiiError` if the runtime source list is empty.
   *
   * @example
   * ```ts
   * const reads = em(["READ"]);
   * const writes = em(["WRITE"]);
   * const permissions = em.combine([reads, writes]);
   * ```
   *
   * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md#composition-and-identity
   */
  combine: <
    const TSources extends readonly [EnumwaiiSource, ...EnumwaiiSource[]],
  >(
    sources: TSources,
  ) => Enumwaii<
    SourceRaw<TSources[number]>,
    EnumwaiiIdentity<SourceRaw<TSources[number]>>
  >;
}

function createEnumwaii(
  members: NonEmptyStrings | Readonly<Record<string, string>>,
): Enumwaii<string, string, Readonly<Record<string, string>>> {
  return new Enumwaii(members as never);
}

function combineEnumwaii<
  const TSources extends readonly [EnumwaiiSource, ...EnumwaiiSource[]],
>(
  sources: TSources,
): Enumwaii<
  SourceRaw<TSources[number]>,
  EnumwaiiIdentity<SourceRaw<TSources[number]>>
> {
  const values = sources.flatMap((source) => source.rawValues);
  return new Enumwaii(values as never);
}

/**
 * Declares closed string vocabularies and combines existing declarations.
 *
 * Call `em` with a non-empty string-literal tuple or key-to-value object to
 * obtain an {@link Enumwaii}; use `em.combine` when the member sets of existing
 * sources should become one new combined identity. Inputs are copied, and the
 * resulting runtime surfaces are frozen plain objects.
 *
 * @throws An `EnumwaiiError` if the runtime input to a call or combination has
 * no members, or if an object declaration contains duplicate values.
 *
 * @example
 * ```ts
 * const roles = em(["ADMIN", "USER"]);
 * const statuses = em({ ORDER_PAID: "order-paid" });
 * const permissions = em.combine([em(["READ"]), em(["WRITE"])]);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md
 */
export const em = Object.assign(createEnumwaii, {
  combine: combineEnumwaii,
}) as Em;
