import { ACTOR, ROLE, acceptRole } from "./reexport";
import type { Role } from "./reexport";

export function compareRole(role: Role): boolean {
  const ownedComparison = role === ROLE.ADMIN;
  const rawComparison = role === "ADMIN"; // expect:raw
  const foreignComparison = role === ACTOR.ADMIN; // expect:foreign
  return ownedComparison || rawComparison || foreignComparison;
}

export function switchRole(role: Role): string {
  switch (role) {
    case ROLE.ADMIN:
      return "owned";
    case "USER": // expect:raw
      return "raw";
    default:
      return "other";
  }
}

let reassigned: Role = ROLE.ADMIN;
reassigned = ROLE.USER;
reassigned = "ADMIN"; // expect:raw
acceptRole(reassigned); // expect:raw
