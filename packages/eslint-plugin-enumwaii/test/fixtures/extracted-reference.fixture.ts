import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
const ROLE_CASES = roles.cases;

const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

export const brandedMember = ROLE.ADMIN;
export const rawMember = RAW_ROLE.USER;
export const caseMember = ROLE_CASES.ADMIN;
export const parsed = roles.parse("ADMIN");
export const safelyParsed = roles.safeParse("USER");
export const isRole = roles.is("ADMIN");
export const picked = roles.pick([ROLE.ADMIN]);
export const omitted = roles.omit([ROLE.USER]);
export const extended = roles.extend(["GUEST"]);
export const combined = em.combine([roles, permissions]);
export const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
);
export const grants = roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);
export const brandedValues = roles.values;
export const rawValues = roles.rawValues;
export const standardResult = roles["~standard"].validate("ADMIN");

const unrelated = { enum: { ADMIN: "ADMIN" } } as const;
export const unrelatedEnumMember = unrelated.enum.ADMIN;

export type Role = (typeof roles)["~type"];
export type RoleKey = (typeof roles)["~keys"];
