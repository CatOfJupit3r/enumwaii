import { EnumwaiiError } from "./enumwaii-error";

function describeReceived(received: unknown): string {
  if (received === undefined) return "undefined";
  if (typeof received === "bigint") return `${String(received)}n`;
  if (typeof received === "symbol") return String(received);
  if (typeof received === "function") return "[function]";
  if (typeof received === "number" && !Number.isFinite(received)) {
    return String(received);
  }

  try {
    const serialized = JSON.stringify(received);
    if (typeof serialized === "string") return serialized;
  } catch {
    // Fall through to a representation that never traverses the input.
  }

  return "[object]";
}

/**
 * Error thrown when an input is not a member and no parse recovery applies.
 *
 * `Enumwaii.parse` throws this error; `Enumwaii.safeParse` returns it in the
 * failure branch instead. The original input is available through
 * {@link received}, while {@link receivedText} provides a safe diagnostic
 * representation for logs and user interfaces. JSON-compatible values retain
 * their JSON representation; values such as `bigint`, symbols, functions,
 * circular structures, and hostile proxies use a non-throwing fallback. The
 * error does not identify which declaration produced an equal runtime string,
 * because brands are erased.
 *
 * @property received The exact unvalidated input that failed membership.
 * @property receivedText A safe display representation of the failed input.
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
   * A non-throwing diagnostic representation of {@link received}.
   *
   * JSON-compatible values use `JSON.stringify`. Inputs that cannot be
   * serialized are represented without traversing or coercing objects, so this
   * property is safe to render even for circular structures and hostile
   * proxies. Use {@link received} instead when the original value is required.
   */
  public readonly receivedText: string;

  /**
   * Creates a parse failure for the exact value received at the boundary.
   *
   * @param received The unvalidated input that failed membership validation.
   */
  public constructor(received: unknown) {
    const receivedText = describeReceived(received);
    super(`Cannot parse ${receivedText}`);
    this.name = "EnumwaiiParseError";
    this.received = received;
    this.receivedText = receivedText;
  }
}
