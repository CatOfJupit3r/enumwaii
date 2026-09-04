import { Types } from "mongoose";

import {
  severitySchema,
  ticketStatusSchema,
  type Severity,
  type TicketStatus,
} from "../domain/ticket-status";
import type { RawSeverity, RawTicketStatus } from "./ticket.schema";

export interface RawTicketDocument {
  readonly _id: Types.ObjectId | string;
  readonly status: RawTicketStatus;
  readonly severity: RawSeverity;
  readonly subject: string;
  readonly memo: string | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Ticket {
  readonly id: string;
  readonly status: TicketStatus;
  readonly severity: Severity;
  readonly subject: string;
  readonly memo: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type InvalidTicketField = "document" | keyof RawTicketDocument;

export class InvalidTicketDocumentError extends Error {
  public constructor(public readonly field: InvalidTicketField) {
    super("The persisted ticket has an invalid " + field + " field");
    this.name = "InvalidTicketDocumentError";
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hydrateId(input: unknown): string {
  if (input instanceof Types.ObjectId) return input.toHexString();
  if (typeof input === "string" && input.length > 0) return input;
  throw new InvalidTicketDocumentError("_id");
}

function hydrateDate(
  field: keyof Pick<RawTicketDocument, "createdAt" | "updatedAt">,
  input: unknown,
): string {
  if (!(input instanceof Date) || Number.isNaN(input.getTime()))
    throw new InvalidTicketDocumentError(field);
  return input.toISOString();
}

/** Re-establish enumwaii brands after raw values leave Mongoose. */
export function hydrateTicket(input: unknown): Ticket {
  if (!isRecord(input)) throw new InvalidTicketDocumentError("document");
  const status = ticketStatusSchema.safeParse(input.status);
  if (!status.success) throw new InvalidTicketDocumentError("status");
  const severity = severitySchema.safeParse(input.severity);
  if (!severity.success) throw new InvalidTicketDocumentError("severity");
  if (typeof input.subject !== "string" || input.subject.trim().length === 0)
    throw new InvalidTicketDocumentError("subject");
  if (input.memo !== null && typeof input.memo !== "string")
    throw new InvalidTicketDocumentError("memo");
  if (
    typeof input.version !== "number" ||
    !Number.isInteger(input.version) ||
    input.version < 1
  )
    throw new InvalidTicketDocumentError("version");
  return {
    id: hydrateId(input._id),
    status: status.value,
    severity: severity.value,
    subject: input.subject,
    memo: input.memo,
    version: input.version,
    createdAt: hydrateDate("createdAt", input.createdAt),
    updatedAt: hydrateDate("updatedAt", input.updatedAt),
  };
}
