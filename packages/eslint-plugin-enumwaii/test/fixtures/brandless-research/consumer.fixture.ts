import {
  ACTOR,
  ROLE,
  SAME_ROLE,
  acceptRole,
  acceptSchemaRole,
  asyncOwned,
  asyncRaw,
  conditionalOwned,
  conditionalRaw,
  constrainedIdentity,
  identity,
  overloadedIdentity,
  ownedGenerator,
  rawGenerator,
  replaceOwnedWithRaw,
  returnOwned,
  returnRaw,
  roles,
} from "./reexport";
import type { Role } from "./reexport";

declare const input: unknown;
declare const flag: boolean;

acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // expect:raw
acceptRole(ACTOR.ADMIN); // expect:foreign

const raw = "ADMIN" as const;
acceptRole(raw); // expect:raw

const owned = ROLE.ADMIN;
acceptRole(owned);

const foreign = ACTOR.ADMIN;
acceptRole(foreign); // expect:foreign

const parsed = roles.parse(input);
acceptRole(parsed);

const asserted = "ADMIN" as Role;
acceptRole(asserted); // expect:raw

acceptRole(identity(ROLE.ADMIN));
acceptRole(identity("ADMIN" as const)); // expect:raw

acceptRole(constrainedIdentity(ROLE.ADMIN));
acceptRole(constrainedIdentity("ADMIN")); // expect:raw

acceptRole(overloadedIdentity(ROLE.ADMIN));
acceptRole(overloadedIdentity("ADMIN")); // expect:raw

[ROLE.ADMIN].map((role) => acceptRole(role));
[ROLE.ADMIN, ROLE.USER].forEach((role) => acceptRole(role));
new Set([ROLE.ADMIN]).forEach(acceptRole);
Promise.resolve(ROLE.ADMIN).then(acceptRole);

const ownedSet = new Set([ROLE.ADMIN]);
for (const roleFromSet of ownedSet) acceptRole(roleFromSet);

const ownedMap = new Map([["admin", ROLE.ADMIN]] as const);
for (const roleFromMap of ownedMap.values()) acceptRole(roleFromMap);

const ownedArray = [...[ROLE.ADMIN, ROLE.USER]];
ownedArray.forEach(acceptRole);

const rawArray = [...["ADMIN" as const]];
rawArray.forEach(acceptRole); // expect:raw

acceptRole(returnOwned());
acceptRole(returnRaw()); // expect:raw
acceptRole(conditionalOwned(flag));
acceptRole(conditionalRaw(flag)); // expect:raw
acceptRole(replaceOwnedWithRaw(ROLE.ADMIN)); // expect:raw

const holder: { role: Role } = {
  role: ROLE.ADMIN,
};

const badHolder: { role: Role } = {
  role: "ADMIN", // expect:raw
};

const { role } = holder;
acceptRole(role);

const spreadHolder: { role: Role } = {
  ...holder,
};
acceptRole(spreadHolder.role);

const badSpreadHolder: { role: Role } = {
  ...{ role: "ADMIN" as const }, // expect:raw
};
acceptRole(badSpreadHolder.role); // expect:raw

for (const generatedRole of ownedGenerator()) acceptRole(generatedRole);
for (const generatedRaw of rawGenerator()) acceptRole(generatedRaw); // expect:raw

asyncOwned().then(acceptRole);
asyncRaw().then(acceptRole); // expect:raw

acceptSchemaRole(ROLE.ADMIN);
acceptSchemaRole("ADMIN"); // expect:raw

acceptRole(SAME_ROLE.ADMIN);

declare const externalRole: Role;
acceptRole(externalRole);

declare const externalString: "ADMIN";
acceptRole(externalString); // expect:unowned

void badHolder;
