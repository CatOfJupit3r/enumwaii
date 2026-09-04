import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { type Severity, type TicketStatus } from "./domain/ticket-status";
import {
  defaultSeverityPipe,
  fallbackTicketStatusPipe,
  strictTicketStatusPipe,
} from "./http/ticket-status.pipes";
import {
  mongoIdPipe,
  optionalMemoPipe,
  positiveIntegerPipe,
} from "./http/request-value.pipes";
import { TicketsService, type TicketView } from "./tickets.service";

@Controller("api/tickets")
export class TicketsController {
  public constructor(
    @Inject(TicketsService) private readonly ticketsService: TicketsService,
  ) {}

  @Get()
  public list(
    @Query("status", fallbackTicketStatusPipe) status: TicketStatus,
  ): Promise<readonly TicketView[]> {
    return this.ticketsService.list(status);
  }

  @Post()
  public create(
    @Body("subject") subject: unknown,
    @Body("severity", defaultSeverityPipe) severity: Severity,
    @Body("memo", optionalMemoPipe) memo: string | null,
  ): Promise<TicketView> {
    const text = typeof subject === "string" ? subject.trim() : "";
    if (text.length === 0 || text.length > 140)
      throw new Error("A ticket subject is required");
    return this.ticketsService.create(text, severity, memo);
  }

  @Patch(":id/status")
  public transition(
    @Param("id", mongoIdPipe) id: string,
    @Body("to", strictTicketStatusPipe) to: TicketStatus,
    @Body("expectedVersion", positiveIntegerPipe) expectedVersion: number,
  ): Promise<TicketView> {
    return this.ticketsService.transition(id, to, expectedVersion);
  }
}
