import { emNative } from "./native-carrier";

declare enum RoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

declare enum ActorCarrier {
  ADMIN = "ADMIN",
  BOT = "BOT",
}

declare enum DuplicateRoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

const roles = emNative<RoleCarrier>()(["ADMIN", "USER", "GUEST"]);
const actors = emNative<ActorCarrier>()(["ADMIN", "BOT"]);
const duplicateRoles = emNative<DuplicateRoleCarrier>()([
  "ADMIN",
  "USER",
  "GUEST",
]);
const sameCarrierRoles = emNative<RoleCarrier>()([
  "GUEST",
  "ADMIN",
  "USER",
]);

const ROLE = roles.enum;
const ACTOR = actors.enum;
type Role = typeof roles["~type"];

declare const input: unknown;
declare function acceptRole(role: Role): void;

acceptRole(ROLE.ADMIN);
// @ts-expect-error native enum carrier rejects raw strings
acceptRole("ADMIN");
// @ts-expect-error native enum carrier rejects overlapping foreign enums
acceptRole(ACTOR.ADMIN);

const raw = "ADMIN" as const;
// @ts-expect-error raw aliases remain raw
acceptRole(raw);

const owned = ROLE.ADMIN;
acceptRole(owned);

const foreign = ACTOR.ADMIN;
// @ts-expect-error foreign aliases remain foreign
acceptRole(foreign);

const parsed = roles.parse(input);
acceptRole(parsed);

const asserted = "ADMIN" as Role;
acceptRole(asserted);

function identity<T>(value: T): T {
  return value;
}

acceptRole(identity(ROLE.ADMIN));
// @ts-expect-error identity does not manufacture ownership
acceptRole(identity("ADMIN" as const));

[ROLE.ADMIN].map((role) => acceptRole(role));
new Set([ROLE.ADMIN]).forEach(acceptRole);
Promise.resolve(ROLE.ADMIN).then(acceptRole);

function returnOwned(): Role {
  return ROLE.ADMIN;
}

function returnRaw(): Role {
  // @ts-expect-error raw return is rejected by TypeScript
  return "ADMIN";
}

function launder(_role: Role): "ADMIN" {
  return "ADMIN";
}

// @ts-expect-error laundering result is still raw
acceptRole(launder(ROLE.ADMIN));

const holder: { role: Role } = {
  role: ROLE.ADMIN,
};

const badHolder: { role: Role } = {
  // @ts-expect-error contextual raw value is rejected
  role: "ADMIN",
};

const { role } = holder;
acceptRole(role);

declare const externalRole: Role;
acceptRole(externalRole);

acceptRole(sameCarrierRoles.enum.ADMIN);
// @ts-expect-error independently generated same-set enum carriers are nominally incompatible
acceptRole(duplicateRoles.enum.ADMIN);

const labels = roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});

// @ts-expect-error generated native carriers keep derive exhaustive
roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
});

type Tagged =
  | { readonly kind: RoleCarrier.ADMIN; readonly admin: true }
  | { readonly kind: RoleCarrier.USER; readonly user: true }
  | { readonly kind: RoleCarrier.GUEST; readonly guest: true };

function narrow(value: Tagged): boolean {
  switch (value.kind) {
    case ROLE.ADMIN:
      return value.admin;
    case ROLE.USER:
      return value.user;
    case ROLE.GUEST:
      return value.guest;
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

void labels;
void returnOwned;
void returnRaw;
void narrow;
