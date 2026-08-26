import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;

roles.derive({
  ADMIN: "Administrator",
  USER: "Member",
});

const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;
roles.deriveTo(permissions, {
  // @ts-expect-error This raw array member is the lint rule's fixture.
  ADMIN: ["READ", PERMISSION.WRITE],
  USER: PERMISSION.READ,
});

// @ts-expect-error This invalid call is the lint rule's fixture.
roles.pick(["ADMIN"]);
// @ts-expect-error This invalid call is the lint rule's fixture.
roles.omit(["USER"]);

em([ROLE.ADMIN]);
em(roles.rawValues);
