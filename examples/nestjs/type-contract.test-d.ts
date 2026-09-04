import { em } from "enumwaii";
import {
  assertTicketTransition,
  describeTicketStatus,
  SEVERITY,
  TICKET_STATUS,
  TONE,
  type Tone,
  type TicketStatus,
} from "./src/domain/ticket-status";
import type { RawTicketDocument } from "./src/persistence/ticket.hydrator";
import type { RawTicketStatus } from "./src/persistence/ticket.schema";

declare const rawString: string;
declare const rawDatabaseStatus: RawTicketStatus;
declare const persistedTicket: RawTicketDocument;

// @ts-expect-error Untrusted strings must cross an enumwaii parser boundary.
describeTicketStatus(rawString);
// @ts-expect-error Mongoose's raw status union is deliberately not branded.
assertTicketTransition(rawDatabaseStatus, TICKET_STATUS.RESOLVED);
// @ts-expect-error A raw persisted field cannot masquerade as a domain member.
const unhydratedStatus: TicketStatus = persistedTicket.status;

const externalStatuses = em({ OPEN: "OPEN", SUSPENDED: "suspended" });
// @ts-expect-error An overlapping member owned by another enumwaii is foreign.
describeTicketStatus(externalStatuses.enum.OPEN);
assertTicketTransition(TICKET_STATUS.OPEN, TICKET_STATUS.IN_PROGRESS);
void SEVERITY.NORMAL;
void unhydratedStatus;

const validTone: Tone = TONE.BLUE;
// @ts-expect-error Presentation tones are owned members, too.
const rawTone: Tone = "BLUE";
void validTone;
void rawTone;
