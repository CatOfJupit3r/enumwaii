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

import type {
  OrderStatus,
  OrderStatusPresentation,
} from "./domain/order-status";
import {
  defaultOrderStatusPipe,
  fallbackOrderStatusPipe,
  strictOrderStatusPipe,
} from "./http/order-status.pipes";
import {
  mongoIdPipe,
  optionalMemoPipe,
  positiveIntegerPipe,
} from "./http/request-value.pipes";
import { OrdersService, type OrderView } from "./orders.service";

@Controller("api/orders")
export class OrdersController {
  public constructor(
    @Inject(OrdersService) private readonly ordersService: OrdersService,
  ) {}

  @Get()
  public list(): Promise<readonly OrderView[]> {
    return this.ordersService.list();
  }

  @Post()
  public create(
    @Body("status", defaultOrderStatusPipe) status: OrderStatus,
    @Body("memo", optionalMemoPipe) memo: string | null,
  ): Promise<OrderView> {
    return this.ordersService.create(status, memo);
  }

  @Patch(":id/status")
  public transition(
    @Param("id", mongoIdPipe) id: string,
    @Body("to", strictOrderStatusPipe) to: OrderStatus,
    @Body("expectedVersion", positiveIntegerPipe) expectedVersion: number,
  ): Promise<OrderView> {
    return this.ordersService.transition(id, to, expectedVersion);
  }
}

@Controller("api/boundary")
export class BoundaryController {
  public constructor(
    @Inject(OrdersService) private readonly ordersService: OrdersService,
  ) {}

  @Get("strict/:status")
  public strictParam(
    @Param("status", strictOrderStatusPipe) status: OrderStatus,
  ): OrderStatusPresentation {
    return this.ordersService.describe(status);
  }

  @Post("strict")
  public strictBody(
    @Body("status", strictOrderStatusPipe) status: OrderStatus,
  ): OrderStatusPresentation {
    return this.ordersService.describe(status);
  }

  @Get("default")
  public defaultQuery(
    @Query("status", defaultOrderStatusPipe) status: OrderStatus,
  ): OrderStatusPresentation {
    return this.ordersService.describe(status);
  }

  @Get("fallback")
  public fallbackQuery(
    @Query("status", fallbackOrderStatusPipe) status: OrderStatus,
  ): OrderStatusPresentation {
    return this.ordersService.describe(status);
  }
}
