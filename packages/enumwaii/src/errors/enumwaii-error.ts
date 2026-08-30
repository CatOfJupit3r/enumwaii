/**
 * Base error for enumwaii declaration and runtime validation failures.
 *
 * Composition and derivation methods use this error for invalid members or
 * mappings. Catch this class when callers should handle any enumwaii-specific
 * failure, or catch `EnumwaiiParseError` when only input parsing should be
 * recovered.
 *
 * @example
 * ```ts
 * const ROLE = roles.enum;
 * try {
 *   roles.omit([ROLE.ADMIN, ROLE.USER, ROLE.GUEST]);
 * } catch (error) {
 *   if (error instanceof EnumwaiiError) report(error.message);
 * }
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md
 */
export class EnumwaiiError extends Error {
  /**
   * Creates an enumwaii-specific error with the supplied diagnostic message.
   *
   * @param message Human-readable description of the failed invariant.
   */
  public constructor(message: string) {
    super(message);
    this.name = "EnumwaiiError";
  }
}
