import { describe, expect, it } from "vitest";
import { Script } from "node:vm";
import {
  assertTicketTransition,
  describeSeverity,
  describeTicketStatus,
  publicSeverityForTriage,
  SEVERITY,
  TICKET_STATUS,
  TicketTransitionConflict,
  triageSeverityForTicket,
} from "./src/domain/ticket-status";
import {
  hydrateTicket,
  InvalidTicketDocumentError,
} from "./src/persistence/ticket.hydrator";
import {
  strictTicketStatusPipe,
  defaultSeverityPipe,
  fallbackTicketStatusPipe,
} from "./src/http/ticket-status.pipes";
import { renderTicketConsole } from "./src/ui/ticket-dashboard";

const rawTicket = {
  _id: "ticket-1",
  status: "OPEN",
  severity: "URGENT",
  subject: "Login link expires immediately",
  memo: "Customer is on a deadline.",
  version: 1,
  createdAt: new Date("2026-01-02T09:00:00.000Z"),
  updatedAt: new Date("2026-01-02T09:00:00.000Z"),
} as const;

describe("Helpdesk ticket domain", () => {
  it("derives SLA presentation and allows the ticket workflow", () => {
    expect(describeSeverity(SEVERITY.URGENT)).toMatchObject({ slaHours: 4 });
    expect(describeTicketStatus(TICKET_STATUS.OPEN).label).toBe("Open");
    expect(() =>
      assertTicketTransition(TICKET_STATUS.OPEN, TICKET_STATUS.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      assertTicketTransition(TICKET_STATUS.CLOSED, TICKET_STATUS.OPEN),
    ).toThrow(TicketTransitionConflict);
  });
  it("hydrates raw Mongoose records fail-closed", () => {
    expect(hydrateTicket(rawTicket)).toMatchObject({
      subject: rawTicket.subject,
      status: TICKET_STATUS.OPEN,
      severity: SEVERITY.URGENT,
    });
    expect(() => hydrateTicket({ ...rawTicket, status: "open" })).toThrow(
      InvalidTicketDocumentError,
    );
    expect(() => hydrateTicket({ ...rawTicket, status: "RETIRED" })).toThrow(
      InvalidTicketDocumentError,
    );
  });
  it("defaults only a missing severity and rejects malformed values", () => {
    expect(defaultSeverityPipe.transform(undefined)).toBe(SEVERITY.NORMAL);
    expect(defaultSeverityPipe.transform(null)).toBe(SEVERITY.NORMAL);
    expect(() => defaultSeverityPipe.transform("CRITICAL")).toThrow(
      "Invalid ticket severity",
    );
    expect(() => defaultSeverityPipe.transform(42)).toThrow(
      "Invalid ticket severity",
    );
  });
  it("keeps CRITICAL triage internal and projects it to a public severity", () => {
    const internalTriage = triageSeverityForTicket(SEVERITY.URGENT);

    expect(internalTriage).toBe("CRITICAL");
    expect(publicSeverityForTriage(internalTriage)).toBe(SEVERITY.URGENT);
  });
  it("escapes ticket text before inserting it into the dashboard HTML", () => {
    expect(renderTicketConsole()).toContain("function escapeHtml(value)");
    expect(renderTicketConsole()).toContain("escapeHtml(ticket.subject)");
    expect(renderTicketConsole()).toContain("escapeHtml(ticket.memo");
  });
});

it("parses canonical ticket wire values through the Nest pipe", () => {
  expect(strictTicketStatusPipe.transform("WAITING_ON_CUSTOMER")).toBe(
    TICKET_STATUS.WAITING_ON_CUSTOMER,
  );
  for (const status of ["waiting-on-customer", "waiting_on_customer"]) {
    expect(() => strictTicketStatusPipe.transform(status)).toThrow(
      "Invalid ticket status",
    );
  }
});

it("renders severity form values from the public enum", () => {
  const html = renderTicketConsole();
  expect(html).toContain('<option value="NORMAL" selected>Normal</option>');
  expect(html).toContain('<option value="URGENT">Urgent</option>');
  expect(html).not.toContain("<option>URGENT</option>");
});

it("renders executable dashboard JavaScript with real line breaks", () => {
  const script = renderTicketConsole().match(
    /<script>([\s\S]*?)<\/script>/,
  )?.[1];
  expect(script).toBeDefined();
  expect(() => new Script(script!)).not.toThrow();
});

it("maps URL filters to constant-case ticket states", () => {
  expect(fallbackTicketStatusPipe.transform("waiting-on-customer")).toBe(
    TICKET_STATUS.WAITING_ON_CUSTOMER,
  );
  expect(fallbackTicketStatusPipe.transform("unknown")).toBe(
    TICKET_STATUS.OPEN,
  );
});
