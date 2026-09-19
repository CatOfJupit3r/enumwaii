import { em } from "enumwaii";
import * as v from "valibot";
import { z } from "zod";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
const ROLE_VALUES = roles.values;
const RAW_ROLE_VALUES = roles.rawValues;

z.enum(ROLE);
z.enum(RAW_ROLE);
z.nativeEnum(roles.rawEnum);
v.picklist(ROLE_VALUES);
v.picklist(RAW_ROLE_VALUES);
v.enum(RAW_ROLE);

const standardSchemaConsumer = (_schema: unknown) => {};
standardSchemaConsumer(roles);

z.enum(["LOCAL", "REMOTE"]);
v.picklist(["LOCAL", "REMOTE"]);
const unrelated = { ADMIN: "ADMIN", USER: "USER" } as const;
z.enum(unrelated);
