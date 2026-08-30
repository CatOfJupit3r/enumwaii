/**
 * Converts a string to uppercase for callback-based enumwaii derivation.
 *
 * This helper delegates to the runtime string method `toUpperCase`; it does
 * not promise locale-aware casing. The generic return type preserves the
 * intrinsic `Uppercase<TValue>` literal transformation for TypeScript.
 *
 * @param value String member or other string to transform.
 * @returns The runtime uppercase string, typed as `Uppercase<TValue>`.
 *
 * @example
 * ```ts
 * import { em } from "enumwaii";
 * import { uppercase } from "enumwaii/derive-with";
 * const lowercaseRoles = em(["admin", "user"]);
 * const upperRoles = lowercaseRoles.derive(uppercase);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/derivation.md#callback-derivation
 */
export function uppercase<const TValue extends string>(
  value: TValue,
): Uppercase<TValue> {
  return value.toUpperCase() as Uppercase<TValue>;
}
