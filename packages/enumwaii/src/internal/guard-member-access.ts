import { EnumwaiiUnknownMemberError } from "../errors/enumwaii-unknown-member-error";

export function guardMemberAccess<TTarget extends object>(
  target: TTarget,
): TTarget {
  return new Proxy(Object.freeze(target), {
    get(currentTarget, property, receiver) {
      if (
        typeof property !== "string" ||
        property in currentTarget ||
        property === "toJSON" ||
        property === "then"
      ) {
        return Reflect.get(currentTarget, property, receiver);
      }
      throw new EnumwaiiUnknownMemberError(property);
    },
  });
}
