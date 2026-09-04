import { em, type InferEnumwaii } from "enumwaii";

const tones = em(["BLUE", "AMBER", "PURPLE", "GREEN", "SLATE", "ORANGE"]);
export const TONE = tones.enum;
export type Tone = InferEnumwaii<typeof tones>;

const ticketStatuses = em([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);
const severities = em(["LOW", "NORMAL", "URGENT"]);
const triageSeverities = severities.extend(["CRITICAL"]);

/** Public ticket state, used at the HTTP and persistence boundaries. */
export const TICKET_STATUS = ticketStatuses.enum;
export const TICKET_STATUS_VALUES = ticketStatuses.values;
export type TicketStatus = InferEnumwaii<typeof ticketStatuses>;
export const ticketStatusSchema = ticketStatuses;

/** Customer-visible severity intentionally excludes the internal CRITICAL tier. */
export const SEVERITY = severities.enum;
export const SEVERITY_VALUES = severities.values;
export const severitySchema = severities;
export type Severity = InferEnumwaii<typeof severities>;
export const TRIAGE_SEVERITY = triageSeverities.enum;
export type TriageSeverity = InferEnumwaii<typeof triageSeverities>;
export const publicTriageSeveritySchema = triageSeverities.omit([
  TRIAGE_SEVERITY.CRITICAL,
]);

export const TICKET_STATUS_DB_ENUM = ticketStatuses.rawEnum;
export const TICKET_STATUS_DB_VALUES = ticketStatuses.rawValues;
export const SEVERITY_DB_ENUM = severities.rawEnum;
export const SEVERITY_DB_VALUES = severities.rawValues;

export interface TicketStatusPresentation {
  readonly label: string;
  readonly description: string;
  readonly tone: Tone;
  readonly terminal: boolean;
}

export interface SeverityPresentation {
  readonly label: string;
  readonly slaHours: number;
  readonly tone: Tone;
}

const statusPresentation = ticketStatuses.derive<TicketStatusPresentation>()(
  [
    TICKET_STATUS.OPEN,
    {
      label: "Open",
      description: "Awaiting agent triage",
      tone: TONE.BLUE,
      terminal: false,
    },
  ],
  [
    TICKET_STATUS.IN_PROGRESS,
    {
      label: "In progress",
      description: "An agent is investigating",
      tone: TONE.AMBER,
      terminal: false,
    },
  ],
  [
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    {
      label: "Waiting on customer",
      description: "More information is needed",
      tone: TONE.PURPLE,
      terminal: false,
    },
  ],
  [
    TICKET_STATUS.RESOLVED,
    {
      label: "Resolved",
      description: "The proposed fix is with the customer",
      tone: TONE.GREEN,
      terminal: false,
    },
  ],
  [
    TICKET_STATUS.CLOSED,
    {
      label: "Closed",
      description: "The ticket is complete",
      tone: TONE.SLATE,
      terminal: true,
    },
  ],
);

const severityPresentation = severities.derive<SeverityPresentation>()(
  [SEVERITY.LOW, { label: "Low", slaHours: 72, tone: TONE.SLATE }],
  [SEVERITY.NORMAL, { label: "Normal", slaHours: 24, tone: TONE.BLUE }],
  [SEVERITY.URGENT, { label: "Urgent", slaHours: 4, tone: TONE.ORANGE }],
);

const allowedTransitions = ticketStatuses.deriveTo(
  ticketStatuses,
  [TICKET_STATUS.OPEN, [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.CLOSED]],
  [
    TICKET_STATUS.IN_PROGRESS,
    [
      TICKET_STATUS.WAITING_ON_CUSTOMER,
      TICKET_STATUS.RESOLVED,
      TICKET_STATUS.CLOSED,
    ],
  ],
  [
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.CLOSED],
  ],
  [TICKET_STATUS.RESOLVED, [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.CLOSED]],
  [TICKET_STATUS.CLOSED, []],
);

export class TicketTransitionConflict extends Error {
  public constructor(
    public readonly from: TicketStatus,
    public readonly to: TicketStatus,
  ) {
    super(`Cannot transition a ticket from ${from} to ${to}`);
    this.name = "TicketTransitionConflict";
  }
}

export function describeTicketStatus(
  status: TicketStatus,
): TicketStatusPresentation {
  return statusPresentation.get(status);
}

export function describeSeverity(severity: Severity): SeverityPresentation {
  return severityPresentation.get(severity);
}

/**
 * Internal triage can escalate an urgent ticket to CRITICAL without exposing
 * that implementation detail through the public ticket response.
 */
export function triageSeverityForTicket(severity: Severity): TriageSeverity {
  if (severity === SEVERITY.URGENT) return TRIAGE_SEVERITY.CRITICAL;
  return triageSeverities.parse(severity);
}

/** Project an internal triage value back to the public Severity vocabulary. */
export function publicSeverityForTriage(triage: TriageSeverity): Severity {
  if (triage === TRIAGE_SEVERITY.CRITICAL) return SEVERITY.URGENT;

  const projected = publicTriageSeveritySchema.safeParse(triage);
  if (projected.success) return projected.value;
  throw new Error("Internal triage severity could not be projected publicly");
}

export function getAllowedTicketTransitions(
  status: TicketStatus,
): readonly TicketStatus[] {
  const targets = allowedTransitions.get(status);
  return typeof targets === "string" ? [targets] : targets;
}

export function assertTicketTransition(
  from: TicketStatus,
  to: TicketStatus,
): void {
  if (
    !getAllowedTicketTransitions(from).some((candidate) => candidate === to)
  ) {
    throw new TicketTransitionConflict(from, to);
  }
}
