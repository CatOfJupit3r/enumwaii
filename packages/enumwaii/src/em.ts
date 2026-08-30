import { Enumwaii } from "./enumwaii";
import type { EnumwaiiIdentity, EnumwaiiSource } from "./types/enumwaii";

type NonEmptyStrings = readonly [string, ...string[]];
type RawOf<TValues extends NonEmptyStrings> = TValues[number];
type SourceRaw<TSource> =
  TSource extends EnumwaiiSource<infer TRaw, infer _TIdentity> ? TRaw : never;

/**
 * Callable and combinable construction surface for {@link Enumwaii} declarations.
 *
 * Call `em` with a non-empty tuple of string literals when you are declaring a
 * closed vocabulary. The complete, de-duplicated raw member set determines the
 * static identity, so declarations with the same set remain compatible even
 * when their order differs. Use `combine` when composing existing declarations
 * so that the combined set receives its own identity.
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
   * empty tuple is rejected at runtime. The declaration has no runtime name,
   * and its identity is derived from the complete member union.
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
   * Combines one or more existing declarations into a declaration for their
   * union of members.
   *
   * Use this when related vocabularies need one target domain. Members are
   * concatenated in source order and duplicate raw values are retained only at
   * their first occurrence. The result receives identity from the complete
   * combined set; it does not preserve any source instance identity.
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

function createEnumwaii(rawValues: NonEmptyStrings): Enumwaii<string, string> {
  return new Enumwaii(rawValues);
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
 * Call `em` with a non-empty string-literal tuple to obtain an
 * {@link Enumwaii}; use `em.combine` when the member sets of existing sources
 * should become one new combined identity. The input is copied, duplicate
 * members are removed in first-seen order, and the resulting runtime surfaces
 * are frozen plain objects.
 *
 * @throws An `EnumwaiiError` if the runtime input to a call or combination has
 * no members.
 *
 * @example
 * ```ts
 * const roles = em(["ADMIN", "USER"]);
 * const permissions = em.combine([em(["READ"]), em(["WRITE"])]);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/branding-and-identity.md
 */
export const em = Object.assign(createEnumwaii, {
  combine: combineEnumwaii,
}) as Em;
