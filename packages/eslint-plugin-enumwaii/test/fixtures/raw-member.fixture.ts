import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;

roles.derive([ROLE.ADMIN, "Administrator"], [ROLE.USER, "Member"]);

const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;
roles.deriveTo(
  permissions,
  // @ts-expect-error This raw array member is the lint rule's fixture.
  [ROLE.ADMIN, ["READ", PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);

// @ts-expect-error This invalid call is the lint rule's fixture.
roles.pick(["ADMIN"]);
// @ts-expect-error This invalid call is the lint rule's fixture.
roles.omit(["USER"]);

em([ROLE.ADMIN]);
em(roles.rawValues);
