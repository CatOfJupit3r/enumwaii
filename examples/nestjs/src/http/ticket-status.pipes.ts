import {
  TICKET_STATUS_URL,
  ticketStatusUrlSchema,
  ticketStatusUrlToDomain,
} from "./ticket-status-url";
import {
  SEVERITY,
  TICKET_STATUS,
  severitySchema,
  ticketStatusSchema,
} from "../domain/ticket-status";
import { EnumwaiiParsePipe } from "./enumwaii-parse.pipe";

export const strictTicketStatusPipe = new EnumwaiiParsePipe(
  ticketStatusSchema,
  {},
  "ticket status",
);

export const defaultTicketStatusPipe = new EnumwaiiParsePipe(
  ticketStatusSchema,
  { default: TICKET_STATUS.OPEN },
  "ticket status",
);

const fallbackTicketStatusUrlPipe = new EnumwaiiParsePipe(
  ticketStatusUrlSchema,
  { fallback: TICKET_STATUS_URL.OPEN },
  "ticket status",
);
export const fallbackTicketStatusPipe = {
  transform(input: unknown) {
    return ticketStatusUrlToDomain.get(
      fallbackTicketStatusUrlPipe.transform(input),
    );
  },
};

export const defaultSeverityPipe = new EnumwaiiParsePipe(
  severitySchema,
  { default: SEVERITY.NORMAL },
  "ticket severity",
);
