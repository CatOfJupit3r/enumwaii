import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import {
  assertTicketTransition,
  describeSeverity,
  describeTicketStatus,
  getAllowedTicketTransitions,
  publicSeverityForTriage,
  triageSeverityForTicket,
  type Severity,
  type SeverityPresentation,
  type TicketStatus,
  type TicketStatusPresentation,
} from "./domain/ticket-status";
import { TicketNotFoundError, TicketVersionConflict } from "./tickets.errors";
import {
  hydrateTicket,
  type Ticket,
  type RawTicketDocument,
} from "./persistence/ticket.hydrator";
import { TicketRecord } from "./persistence/ticket.schema";

export interface TicketView extends Ticket {
  readonly presentation: TicketStatusPresentation;
  readonly severityPresentation: SeverityPresentation;
  readonly allowedTransitions: readonly TicketStatus[];
}

function presentTicket(ticket: Ticket): TicketView {
  const publicSeverity = publicSeverityForTriage(
    triageSeverityForTicket(ticket.severity),
  );
  return {
    ...ticket,
    severity: publicSeverity,
    presentation: describeTicketStatus(ticket.status),
    severityPresentation: describeSeverity(ticket.severity),
    allowedTransitions: getAllowedTicketTransitions(ticket.status),
  };
}

@Injectable()
export class TicketsService {
  public constructor(
    @InjectModel(TicketRecord.name)
    private readonly ticketModel: Model<TicketRecord>,
  ) {}

  public describe(status: TicketStatus): TicketStatusPresentation {
    return describeTicketStatus(status);
  }

  public async list(status?: TicketStatus): Promise<readonly TicketView[]> {
    const rows = await this.ticketModel
      .find(status === undefined ? {} : { status })
      .sort({ createdAt: -1, _id: -1 })
      .lean<RawTicketDocument[]>()
      .exec();
    return rows.map((row) => presentTicket(hydrateTicket(row)));
  }

  public async create(
    subject: string,
    severity: Severity,
    memo: string | null,
  ): Promise<TicketView> {
    const created = await this.ticketModel.create({ subject, severity, memo });
    return presentTicket(hydrateTicket(created.toObject()));
  }

  public async transition(
    ticketId: string,
    to: TicketStatus,
    expectedVersion: number,
  ): Promise<TicketView> {
    const selected = await this.ticketModel
      .findById(ticketId)
      .lean<RawTicketDocument | null>()
      .exec();
    if (selected === null) throw new TicketNotFoundError(ticketId);
    const current = hydrateTicket(selected);
    if (current.version !== expectedVersion)
      throw new TicketVersionConflict(
        ticketId,
        expectedVersion,
        current.version,
      );
    assertTicketTransition(current.status, to);
    const updated = await this.ticketModel
      .findOneAndUpdate(
        { _id: ticketId, version: expectedVersion },
        { $set: { status: to }, $inc: { version: 1 } },
        { new: true, runValidators: true },
      )
      .lean<RawTicketDocument | null>()
      .exec();
    if (updated !== null) return presentTicket(hydrateTicket(updated));
    const latest = await this.ticketModel
      .findById(ticketId)
      .lean<RawTicketDocument | null>()
      .exec();
    if (latest === null) throw new TicketNotFoundError(ticketId);
    throw new TicketVersionConflict(
      ticketId,
      expectedVersion,
      hydrateTicket(latest).version,
    );
  }
}
