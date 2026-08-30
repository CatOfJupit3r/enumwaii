import {
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

import { OrderTransitionConflict } from "../domain/order-status";
import { OrderNotFoundError, OrderVersionConflict } from "../orders.errors";
import { InvalidOrderDocumentError } from "../persistence/order.hydrator";

export type OrderApplicationError =
  | InvalidOrderDocumentError
  | OrderNotFoundError
  | OrderTransitionConflict
  | OrderVersionConflict;

export interface OrderErrorResponse {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, string | number>>;
}

export function mapOrderException(
  exception: OrderApplicationError,
): OrderErrorResponse {
  if (exception instanceof OrderNotFoundError) {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      error: "Not Found",
      message: exception.message,
      details: { orderId: exception.orderId },
    };
  }

  if (exception instanceof OrderVersionConflict) {
    return {
      statusCode: HttpStatus.CONFLICT,
      error: "Version Conflict",
      message: exception.message,
      details: {
        orderId: exception.orderId,
        expectedVersion: exception.expectedVersion,
        actualVersion: exception.actualVersion,
      },
    };
  }

  if (exception instanceof OrderTransitionConflict) {
    return {
      statusCode: HttpStatus.CONFLICT,
      error: "Transition Conflict",
      message: exception.message,
      details: { from: exception.from, to: exception.to },
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: "Invalid Persisted Order",
    message: "A stored order could not be restored to the domain model",
    details: { field: exception.field },
  };
}

@Catch(
  InvalidOrderDocumentError,
  OrderNotFoundError,
  OrderTransitionConflict,
  OrderVersionConflict,
)
export class OrderDomainExceptionFilter implements ExceptionFilter<OrderApplicationError> {
  public catch(exception: OrderApplicationError, host: ArgumentsHost): void {
    const payload = mapOrderException(exception);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(payload.statusCode).json(payload);
  }
}
