export function uppercase<const TValue extends string>(
  value: TValue,
): Uppercase<TValue> {
  return value.toUpperCase() as Uppercase<TValue>;
}
