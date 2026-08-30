import { EnumwaiiError } from "./enumwaii-error";

/**
 * Error thrown when an input is not a member and no parse recovery applies.
 *
 * `Enumwaii.parse` throws this error; `Enumwaii.safeParse` returns it in the
 * failure branch instead. The original input is available through
 * {@link received}; the inherited `message` uses a JSON representation of that
 * input. If the input cannot be processed by `JSON.stringify` (for example, a
 * `bigint`), that serializer error can propagate before this error is created.
 * The error does not identify which declaration produced an equal runtime
 * string, because brands are erased.
 *
 * @property received The exact unvalidated input that failed membership.
 *
 * @example
 * ```ts
 * try {
 *   roles.parse(payload.role);
 * } catch (error) {
 *   if (error instanceof EnumwaiiParseError) audit(error.received);
 * }
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#parsing
 */
export class EnumwaiiParseError extends EnumwaiiError {
  /**
   * The exact unvalidated value that failed membership validation.
   *
   * Use this value for structured logging or recovery; it is retained by
   * reference and is not cloned, normalized, or branded.
   */
  public readonly received: unknown;

  /**
   * Creates a parse failure for the exact value received at the boundary.
   *
   * @param received The unvalidated input that failed membership validation.
   */
  public constructor(received: unknown) {
    super(`Cannot parse ${JSON.stringify(received)}`);
    this.name = "EnumwaiiParseError";
    this.received = received;
  }
}
