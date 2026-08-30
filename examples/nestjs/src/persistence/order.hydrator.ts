import { Types } from "mongoose";

import { orderStatusSchema, type OrderStatus } from "../domain/order-status";
import type { RawOrderStatus } from "./order.schema";

export interface RawOrderDocument {
  readonly _id: Types.ObjectId | string;
  readonly status: RawOrderStatus;
  readonly memo: string | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Order {
  readonly id: string;
  readonly status: OrderStatus;
  readonly memo: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type InvalidOrderField =
  | "document"
  | "_id"
  | "status"
  | "memo"
  | "version"
  | "createdAt"
  | "updatedAt";

export class InvalidOrderDocumentError extends Error {
  public constructor(public readonly field: InvalidOrderField) {
    super(`The persisted order has an invalid ${field} field`);
    this.name = "InvalidOrderDocumentError";
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hydrateId(input: unknown): string {
  if (input instanceof Types.ObjectId) return input.toHexString();
  if (typeof input === "string" && input.length > 0) return input;
  throw new InvalidOrderDocumentError("_id");
}

function hydrateDate(field: "createdAt" | "updatedAt", input: unknown): string {
  if (!(input instanceof Date) || Number.isNaN(input.getTime())) {
    throw new InvalidOrderDocumentError(field);
  }
  return input.toISOString();
}

/** Re-establish the enumwaii brand after values leave the unbranded ODM. */
export function hydrateOrder(input: unknown): Order {
  if (!isRecord(input)) {
    throw new InvalidOrderDocumentError("document");
  }

  const statusResult = orderStatusSchema.safeParse(input["status"]);
  if (!statusResult.success) {
    throw new InvalidOrderDocumentError("status");
  }

  const memo = input["memo"];
  if (memo !== null && typeof memo !== "string") {
    throw new InvalidOrderDocumentError("memo");
  }

  const version = input["version"];
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new InvalidOrderDocumentError("version");
  }

  return {
    id: hydrateId(input["_id"]),
    status: statusResult.value,
    memo,
    version,
    createdAt: hydrateDate("createdAt", input["createdAt"]),
    updatedAt: hydrateDate("updatedAt", input["updatedAt"]),
  };
}
