import { EnumwaiiUnknownMemberError } from "../errors/enumwaii-unknown-member-error";

const memberAccessGuard: ProxyHandler<object> = {
  get(currentTarget, property, receiver) {
    if (
      typeof property !== "string" ||
      property in currentTarget ||
      property === "toJSON" ||
      property === "then" ||
      // React probes arbitrary objects to determine whether they are elements.
      property === "$$typeof"
    ) {
      return Reflect.get(currentTarget, property, receiver);
    }
    throw new EnumwaiiUnknownMemberError(property);
  },
};

export function guardMemberAccess<TTarget extends object>(
  target: TTarget,
): TTarget {
  return new Proxy(Object.freeze(target), memberAccessGuard) as TTarget;
}
