import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;

export const parsed = roles.parse("ADMIN");
export const badComparison = parsed === "ADMIN";
export const goodComparison = parsed === ROLE.ADMIN;

export function describeRole(role: typeof parsed): string {
  switch (role) {
    case "USER":
      return "Member";
    default:
      return "Administrator";
  }
}
