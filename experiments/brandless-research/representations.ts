declare const valueBrand: unique symbol;
declare const containerBrand: unique symbol;

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight
    ? 1
    : 2
    ? true
    : false;
type Expect<T extends true> = T;

type RequiredBrand<TLiteral extends string, TIdentity extends string> =
  TLiteral & {
    readonly [valueBrand]: TIdentity;
  };

type OptionalBrand<TLiteral extends string, TIdentity extends string> =
  TLiteral & {
    readonly [valueBrand]?: TIdentity;
  };

type OptionalInvariantBrand<
  TLiteral extends string,
  TIdentity extends string,
> = TLiteral & {
  readonly [valueBrand]?: (value: TIdentity) => TIdentity;
};

type UnionBrand<TLiteral extends string, TIdentity extends string> =
  | TLiteral
  | RequiredBrand<TLiteral, TIdentity>;

type PhantomAlias<
  TLiteral extends string,
  _TIdentity extends string,
> = TLiteral;

type NativeContainer<TRaw extends string, TIdentity extends string> = Readonly<{
  [K in TRaw]: K;
}> & {
  readonly [containerBrand]: TIdentity;
};

type RoleRaw = "ADMIN" | "USER" | "GUEST";
type ActorRaw = "ADMIN" | "BOT";

declare const requiredRoleAdmin: RequiredBrand<"ADMIN", "roles">;
declare const requiredActorAdmin: RequiredBrand<"ADMIN", "actors">;
declare const optionalRoleAdmin: OptionalBrand<"ADMIN", "roles">;
declare const optionalActorAdmin: OptionalBrand<"ADMIN", "actors">;
declare const optionalInvariantRoleAdmin: OptionalInvariantBrand<
  "ADMIN",
  "roles"
>;
declare const optionalInvariantActorAdmin: OptionalInvariantBrand<
  "ADMIN",
  "actors"
>;
declare const unionRoleAdmin: UnionBrand<"ADMIN", "roles">;
declare const unionActorAdmin: UnionBrand<"ADMIN", "actors">;

declare function acceptRequired(
  value: RequiredBrand<RoleRaw, "roles">,
): void;
declare function acceptOptional(value: OptionalBrand<RoleRaw, "roles">): void;
declare function acceptOptionalInvariant(
  value: OptionalInvariantBrand<RoleRaw, "roles">,
): void;
declare function acceptUnion(value: UnionBrand<RoleRaw, "roles">): void;
declare function acceptAlias(value: PhantomAlias<RoleRaw, "roles">): void;

acceptRequired(requiredRoleAdmin);
// @ts-expect-error required value metadata rejects raw strings
acceptRequired("ADMIN");
// @ts-expect-error required value metadata rejects foreign identities
acceptRequired(requiredActorAdmin);

acceptOptional(optionalRoleAdmin);
acceptOptional("ADMIN");
// @ts-expect-error optional identity can reject marked foreign values, but raw bypasses it
acceptOptional(optionalActorAdmin);

acceptOptionalInvariant(optionalInvariantRoleAdmin);
acceptOptionalInvariant("ADMIN");
// @ts-expect-error optional invariant identity still rejects only marked foreign values
acceptOptionalInvariant(optionalInvariantActorAdmin);

acceptUnion(unionRoleAdmin);
acceptUnion("ADMIN");
acceptUnion(unionActorAdmin);

acceptAlias("ADMIN");
acceptAlias("ADMIN" as PhantomAlias<"ADMIN", "actors">);

const requiredKeyObject = {
  [requiredRoleAdmin]: true,
};
const optionalKeyObject = {
  [optionalRoleAdmin]: true,
};
const optionalInvariantKeyObject = {
  [optionalInvariantRoleAdmin]: true,
};
const unionKeyObject = {
  [unionRoleAdmin]: true,
};

const roleContainer = null as unknown as NativeContainer<RoleRaw, "roles">;
const actorContainer = null as unknown as NativeContainer<ActorRaw, "actors">;
const nativeKeyObject = {
  [roleContainer.ADMIN]: true,
};

type _RequiredKeyWidens = Expect<
  Equal<keyof typeof requiredKeyObject, string | number>
>;
type _OptionalKeyWidens = Expect<
  Equal<keyof typeof optionalKeyObject, string | number>
>;
type _OptionalInvariantKeyWidens = Expect<
  Equal<keyof typeof optionalInvariantKeyObject, string | number>
>;
type _UnionKeyWidens = Expect<
  Equal<keyof typeof unionKeyObject, string | number>
>;
type _ContainerKeyStaysLiteral = Expect<
  Equal<keyof typeof nativeKeyObject, "ADMIN">
>;

declare function acceptPlainRole(value: RoleRaw): void;
acceptPlainRole(roleContainer.ADMIN);
acceptPlainRole(actorContainer.ADMIN);
acceptPlainRole("ADMIN");
