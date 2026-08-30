import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import {
  assertOrderTransition,
  describeOrderStatus,
  getAllowedOrderTransitions,
  type OrderStatus,
  type OrderStatusPresentation,
} from "./domain/order-status";
import { OrderNotFoundError, OrderVersionConflict } from "./orders.errors";
import {
  hydrateOrder,
  type Order,
  type RawOrderDocument,
} from "./persistence/order.hydrator";
import { OrderRecord } from "./persistence/order.schema";

export interface OrderView extends Order {
  readonly presentation: OrderStatusPresentation;
  readonly allowedTransitions: readonly OrderStatus[];
}

function presentOrder(order: Order): OrderView {
  return {
    ...order,
    presentation: describeOrderStatus(order.status),
    allowedTransitions: getAllowedOrderTransitions(order.status),
  };
}

@Injectable()
export class OrdersService {
  public constructor(
    @InjectModel(OrderRecord.name)
    private readonly orderModel: Model<OrderRecord>,
  ) {}

  public describe(status: OrderStatus): OrderStatusPresentation {
    return describeOrderStatus(status);
  }

  public async list(): Promise<readonly OrderView[]> {
    const rows = await this.orderModel
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .lean<RawOrderDocument[]>()
      .exec();
    return rows.map((row) => presentOrder(hydrateOrder(row)));
  }

  public async create(
    status: OrderStatus,
    memo: string | null,
  ): Promise<OrderView> {
    const created = await this.orderModel.create({ status, memo });
    const row: unknown = created.toObject();
    return presentOrder(hydrateOrder(row));
  }

  public async transition(
    orderId: string,
    to: OrderStatus,
    expectedVersion: number,
  ): Promise<OrderView> {
    const selected = await this.orderModel
      .findById(orderId)
      .lean<RawOrderDocument | null>()
      .exec();
    if (selected === null) {
      throw new OrderNotFoundError(orderId);
    }

    const current = hydrateOrder(selected);
    if (current.version !== expectedVersion) {
      throw new OrderVersionConflict(orderId, expectedVersion, current.version);
    }
    assertOrderTransition(current.status, to);

    const updated = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, version: expectedVersion },
        { $set: { status: to }, $inc: { version: 1 } },
        { new: true, runValidators: true },
      )
      .lean<RawOrderDocument | null>()
      .exec();
    if (updated !== null) {
      return presentOrder(hydrateOrder(updated));
    }

    const latest = await this.orderModel
      .findById(orderId)
      .lean<RawOrderDocument | null>()
      .exec();
    if (latest === null) {
      throw new OrderNotFoundError(orderId);
    }
    const latestOrder = hydrateOrder(latest);
    throw new OrderVersionConflict(
      orderId,
      expectedVersion,
      latestOrder.version,
    );
  }
}
