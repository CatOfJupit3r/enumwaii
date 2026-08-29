import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);

export const directEnum = roles.enum.ADMIN;
export const directRawEnum = roles.rawEnum.USER;
export const directCases = roles.cases.ADMIN;
export const computedView = roles["enum"].USER;
