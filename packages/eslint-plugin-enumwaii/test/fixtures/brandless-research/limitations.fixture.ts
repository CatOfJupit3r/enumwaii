import { ROLE, acceptRole } from "./reexport";

const collidingSlots = new Map([
  ["ADMIN" as const, ROLE.ADMIN],
] as const);

for (const validValue of collidingSlots.values()) {
  acceptRole(validValue); // expect:false-positive-raw
}

declare function externallyDeclaredIdentity<T>(value: T): T;

// This is accepted because declaration files are treated as contracts. A lying
// implementation could manufacture a raw value and is an explicit trust boundary.
acceptRole(externallyDeclaredIdentity(ROLE.ADMIN));
