import {
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

import { TicketTransitionConflict } from "../domain/ticket-status";
import { TicketNotFoundError, TicketVersionConflict } from "../tickets.errors";
import { InvalidTicketDocumentError } from "../persistence/ticket.hydrator";

export type TicketApplicationError =
  | InvalidTicketDocumentError
  | TicketNotFoundError
  | TicketTransitionConflict
  | TicketVersionConflict;

export interface TicketErrorResponse {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, string | number>>;
}

export function mapTicketException(
  exception: TicketApplicationError,
): TicketErrorResponse {
  if (exception instanceof TicketNotFoundError) {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      error: "Not Found",
      message: exception.message,
      details: { ticketId: exception.ticketId },
    };
  }

  if (exception instanceof TicketVersionConflict) {
    return {
      statusCode: HttpStatus.CONFLICT,
      error: "Version Conflict",
      message: exception.message,
      details: {
        ticketId: exception.ticketId,
        expectedVersion: exception.expectedVersion,
        actualVersion: exception.actualVersion,
      },
    };
  }

  if (exception instanceof TicketTransitionConflict) {
    return {
      statusCode: HttpStatus.CONFLICT,
      error: "Transition Conflict",
      message: exception.message,
      details: { from: exception.from, to: exception.to },
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: "Invalid Persisted Ticket",
    message: "A stored ticket could not be restored to the domain model",
    details: { field: exception.field },
  };
}

@Catch(
  InvalidTicketDocumentError,
  TicketNotFoundError,
  TicketTransitionConflict,
  TicketVersionConflict,
)
export class TicketDomainExceptionFilter implements ExceptionFilter<TicketApplicationError> {
  public catch(exception: TicketApplicationError, host: ArgumentsHost): void {
    const payload = mapTicketException(exception);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(payload.statusCode).json(payload);
  }
}
