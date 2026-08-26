import { em } from "../../../../../experiments/brandless-research/brandless";

export const roles = em(["ADMIN", "USER", "GUEST"]);
export const ROLE = roles.enum;
export type Role = (typeof roles)["~type"];

export const sameRoles = em(["GUEST", "ADMIN", "USER"]);
export const SAME_ROLE = sameRoles.enum;

export const actors = em(["ADMIN", "BOT"]);
export const ACTOR = actors.enum;
export type Actor = (typeof actors)["~type"];

export function acceptRole(role: Role): void {
  void role;
}

export function acceptActor(actor: Actor): void {
  void actor;
}

export function identity<T>(value: T): T {
  return value;
}

export function constrainedIdentity<T extends Role>(value: T): T {
  return value;
}

export function overloadedIdentity(value: Role): Role;
export function overloadedIdentity<T extends Role>(value: T): T;
export function overloadedIdentity(value: Role): Role {
  return value;
}

export function replaceOwnedWithRaw(_role: Role): "ADMIN" {
  return "ADMIN"; // expect:raw
}

export function returnOwned(): Role {
  return ROLE.ADMIN;
}

export function returnRaw(): Role {
  return "ADMIN"; // expect:raw
}

export function conditionalOwned(flag: boolean): Role {
  return flag ? ROLE.ADMIN : ROLE.USER;
}

export function conditionalRaw(flag: boolean): Role {
  return flag ? ROLE.ADMIN : "USER"; // expect:raw
}

export function* ownedGenerator(): Generator<Role, void, unknown> {
  yield ROLE.ADMIN;
  yield ROLE.USER;
}

export function* rawGenerator(): Generator<Role, void, unknown> {
  yield "ADMIN"; // expect:raw
}

export async function asyncOwned(): Promise<Role> {
  return ROLE.ADMIN;
}

export async function asyncRaw(): Promise<Role> {
  return "ADMIN"; // expect:raw
}

export type InferOutput<TSchema> = TSchema extends {
  readonly "~type": infer TOutput;
}
  ? TOutput
  : never;

export type SchemaRole = InferOutput<typeof roles>;

export function acceptSchemaRole(role: SchemaRole): void {
  void role;
}
