import { emFromNativeEnum } from "./native-enum";

enum RoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

enum ActorCarrier {
  ADMIN = "ADMIN",
  BOT = "BOT",
}

const roles = emFromNativeEnum(RoleCarrier);
const sameRoles = emFromNativeEnum(RoleCarrier);
const actors = emFromNativeEnum(ActorCarrier);
const ROLE = roles.enum;
const ACTOR = actors.enum;
type Role = typeof roles["~type"];

declare function acceptRole(value: Role): void;
declare const input: unknown;

acceptRole(ROLE.ADMIN);
acceptRole(sameRoles.enum.ADMIN);
// @ts-expect-error raw strings are not enum members
acceptRole("ADMIN");
// @ts-expect-error a different native enum remains nominal
acceptRole(ACTOR.ADMIN);

const parsed = roles.parse(input);
acceptRole(parsed);

function identity<T>(value: T): T {
  return value;
}

acceptRole(identity(ROLE.ADMIN));
// @ts-expect-error generic identity does not invent enum ownership
acceptRole(identity("ADMIN" as const));

[ROLE.ADMIN].map(acceptRole);
new Set([ROLE.ADMIN]).forEach(acceptRole);
Promise.resolve(ROLE.ADMIN).then(acceptRole);

const labels = roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});

// @ts-expect-error native enum keys remain exhaustive
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
void narrow;
