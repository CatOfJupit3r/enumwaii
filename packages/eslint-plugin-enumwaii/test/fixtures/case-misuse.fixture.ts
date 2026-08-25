import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE_CASES = roles.cases;

export const BAD_ALIAS = roles.cases;
export const computed = ROLE_CASES["ADMIN"];
export const leaked = ROLE_CASES.USER;
