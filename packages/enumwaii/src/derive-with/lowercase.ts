/**
 * Converts a string to lowercase for callback-based enumwaii derivation.
 *
 * This helper delegates to the runtime string method `toLowerCase`; it does
 * not promise locale-aware casing. The generic return type preserves the
 * intrinsic `Lowercase<TValue>` literal transformation for TypeScript.
 *
 * @param value String member or other string to transform.
 * @returns The runtime lowercase string, typed as `Lowercase<TValue>`.
 *
 * @example
 * ```ts
 * import { lowercase } from "enumwaii/derive-with";
 * const lowerRoles = roles.derive(lowercase);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#callback-derivation
 */
export function lowercase<const TValue extends string>(
  value: TValue,
): Lowercase<TValue> {
  return value.toLowerCase() as Lowercase<TValue>;
}
