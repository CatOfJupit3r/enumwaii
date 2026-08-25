export function lowercase<const TValue extends string>(
  value: TValue,
): Lowercase<TValue> {
  return value.toLowerCase() as Lowercase<TValue>;
}
