import { em } from "enumwaii";
import { ticketStatusSchema, TICKET_STATUS } from "../domain/ticket-status";

export const ticketStatusUrlSchema = em({
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  WAITING_ON_CUSTOMER: "waiting-on-customer",
  RESOLVED: "resolved",
  CLOSED: "closed",
});
export const TICKET_STATUS_URL = ticketStatusUrlSchema.enum;
export const ticketStatusUrlToDomain = ticketStatusUrlSchema.deriveTo(
  ticketStatusSchema,
  [TICKET_STATUS_URL.OPEN, TICKET_STATUS.OPEN],
  [TICKET_STATUS_URL.IN_PROGRESS, TICKET_STATUS.IN_PROGRESS],
  [TICKET_STATUS_URL.WAITING_ON_CUSTOMER, TICKET_STATUS.WAITING_ON_CUSTOMER],
  [TICKET_STATUS_URL.RESOLVED, TICKET_STATUS.RESOLVED],
  [TICKET_STATUS_URL.CLOSED, TICKET_STATUS.CLOSED],
);
