import "reflect-metadata";

import { BadRequestException, HttpStatus } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import { model, Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ORDER_STATUS,
  ORDER_STATUS_DB_ENUM,
  OrderTransitionConflict,
  type OrderStatus,
} from "./src/domain/order-status";
import { mapOrderException } from "./src/http/order-domain-exception.filter";
import { EnumwaiiParsePipe } from "./src/http/enumwaii-parse.pipe";
import {
  defaultOrderStatusPipe,
  fallbackOrderStatusPipe,
  strictOrderStatusPipe,
} from "./src/http/order-status.pipes";
import { OrdersController } from "./src/orders.controller";
import { OrderNotFoundError, OrderVersionConflict } from "./src/orders.errors";
import { OrdersService } from "./src/orders.service";
import {
  hydrateOrder,
  InvalidOrderDocumentError,
  type RawOrderDocument,
} from "./src/persistence/order.hydrator";
import { OrderRecord, OrderSchema } from "./src/persistence/order.schema";
import { renderOrderConsole } from "./src/ui/order-console";

const SchemaOrderModel = model<OrderRecord>(
  "EnumwaiiNestOrderSchemaTest",
  OrderSchema.clone(),
);

function rawOrder(overrides: Partial<RawOrderDocument> = {}): RawOrderDocument {
  return {
    _id: new Types.ObjectId("66b8f2f14145d8a9f14145d8"),
    status: ORDER_STATUS_DB_ENUM.PENDING,
    memo: "Handle with care",
    version: 1,
    createdAt: new Date("2026-08-30T09:00:00.000Z"),
    updatedAt: new Date("2026-08-30T09:00:00.000Z"),
    ...overrides,
  };
}

function leanQuery<T>(value: T) {
  return {
    lean: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(value),
    }),
  };
}

function sortedLeanQuery<T>(value: T) {
  return {
    sort: vi.fn().mockReturnValue(leanQuery(value)),
  };
}

describe("enumwaii Nest request pipes", () => {
  it("parses valid values and rejects unknown strings without listing members", () => {
    expect(strictOrderStatusPipe).toBeInstanceOf(EnumwaiiParsePipe);
    expect(strictOrderStatusPipe.transform("PAID")).toBe(ORDER_STATUS.PAID);

    try {
      strictOrderStatusPipe.transform("RETURNED");
      throw new Error("expected strict parsing to fail");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (error instanceof BadRequestException) {
        expect(error.getResponse()).toEqual({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid order status",
        });
        expect(JSON.stringify(error.getResponse())).not.toContain("PENDING");
      }
    }
  });

  it("keeps wrong primitives strict", () => {
    expect(() => strictOrderStatusPipe.transform(42)).toThrow(
      BadRequestException,
    );
  });

  it("separates nil-only default and malformed-input fallback policies", () => {
    expect(defaultOrderStatusPipe.transform(undefined)).toBe(
      ORDER_STATUS.PENDING,
    );
    expect(defaultOrderStatusPipe.transform(null)).toBe(ORDER_STATUS.PENDING);
    expect(() => defaultOrderStatusPipe.transform("RETURNED")).toThrow(
      BadRequestException,
    );
    expect(fallbackOrderStatusPipe.transform("RETURNED")).toBe(
      ORDER_STATUS.PENDING,
    );
    expect(fallbackOrderStatusPipe.transform(42)).toBe(ORDER_STATUS.PENDING);
  });
});

describe("real Mongoose schema and hydration boundary", () => {
  it("uses canonical raw enum values and the raw PENDING default", async () => {
    const document = new SchemaOrderModel({ memo: "Schema-only test" });

    expect(document.status).toBe(ORDER_STATUS_DB_ENUM.PENDING);
    expect(document.version).toBe(1);
    await expect(document.validate()).resolves.toBeUndefined();
  });

  it("rejects an unknown raw status through Mongoose enum validation", async () => {
    const document = new SchemaOrderModel();
    document.set("status", "RETURNED");

    await expect(document.validate()).rejects.toMatchObject({
      errors: { status: expect.anything() },
    });
  });

  it("rebrands a valid raw row and rejects a corrupt historical status", () => {
    const hydrated = hydrateOrder(
      rawOrder({ status: ORDER_STATUS_DB_ENUM.PAID }),
    );
    expect(hydrated.status).toBe(ORDER_STATUS.PAID);

    expect(() => hydrateOrder({ ...rawOrder(), status: "RETURNED" })).toThrow(
      InvalidOrderDocumentError,
    );
  });
});

describe("Nest service and controller with the documented model-token mock", () => {
  const orderModel = {
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };

  let moduleFixture: TestingModule;
  let service: OrdersService;
  let controller: OrdersController;

  beforeEach(async () => {
    vi.clearAllMocks();
    moduleFixture = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        {
          provide: getModelToken(OrderRecord.name),
          useValue: orderModel,
        },
      ],
    }).compile();
    service = moduleFixture.get(OrdersService);
    controller = moduleFixture.get(OrdersController);
  });

  afterEach(async () => {
    await moduleFixture.close();
  });

  it("lists and creates through actual Model methods", async () => {
    const pending = rawOrder();
    const paid = rawOrder({
      _id: new Types.ObjectId("66b8f2f14145d8a9f14145d9"),
      status: ORDER_STATUS_DB_ENUM.PAID,
    });
    orderModel.find.mockReturnValue(sortedLeanQuery([pending]));
    orderModel.create.mockResolvedValue({ toObject: () => paid });

    await expect(controller.list()).resolves.toMatchObject([
      { status: ORDER_STATUS.PENDING, version: 1 },
    ]);
    await expect(
      controller.create(ORDER_STATUS.PAID, "Priority dispatch"),
    ).resolves.toMatchObject({
      status: ORDER_STATUS.PAID,
      presentation: { label: "Paid" },
    });
    expect(orderModel.find).toHaveBeenCalledOnce();
    expect(orderModel.create).toHaveBeenCalledWith({
      status: ORDER_STATUS.PAID,
      memo: "Priority dispatch",
    });
  });

  it("performs a legal transition with an atomic version predicate", async () => {
    const selected = rawOrder();
    const updated = rawOrder({
      status: ORDER_STATUS_DB_ENUM.PAID,
      version: 2,
      updatedAt: new Date("2026-08-30T09:01:00.000Z"),
    });
    orderModel.findById.mockReturnValueOnce(leanQuery(selected));
    orderModel.findOneAndUpdate.mockReturnValueOnce(leanQuery(updated));

    await expect(
      service.transition(selected._id.toString(), ORDER_STATUS.PAID, 1),
    ).resolves.toMatchObject({ status: ORDER_STATUS.PAID, version: 2 });
    expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: selected._id.toString(), version: 1 },
      { $set: { status: ORDER_STATUS.PAID }, $inc: { version: 1 } },
      { new: true, runValidators: true },
    );
  });

  it("keeps illegal transitions distinct from parse failures", async () => {
    const shipped = rawOrder({
      status: ORDER_STATUS_DB_ENUM.SHIPPED,
    });
    orderModel.findById.mockReturnValueOnce(leanQuery(shipped));

    await expect(
      service.transition(shipped._id.toString(), ORDER_STATUS.PAID, 1),
    ).rejects.toBeInstanceOf(OrderTransitionConflict);
    expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("reports a missing record and a stale observed version", async () => {
    orderModel.findById.mockReturnValueOnce(leanQuery(null));
    await expect(
      service.transition("000000000000000000000000", ORDER_STATUS.PAID, 1),
    ).rejects.toBeInstanceOf(OrderNotFoundError);

    orderModel.findById.mockReturnValueOnce(
      leanQuery(rawOrder({ version: 3 })),
    );
    await expect(
      service.transition("66b8f2f14145d8a9f14145d8", ORDER_STATUS.PAID, 2),
    ).rejects.toMatchObject({ expectedVersion: 2, actualVersion: 3 });
  });

  it("detects a clean compare-and-update race", async () => {
    const selected = rawOrder();
    const latest = rawOrder({ version: 2 });
    orderModel.findById
      .mockReturnValueOnce(leanQuery(selected))
      .mockReturnValueOnce(leanQuery(latest));
    orderModel.findOneAndUpdate.mockReturnValueOnce(leanQuery(null));

    await expect(
      service.transition(selected._id.toString(), ORDER_STATUS.PAID, 1),
    ).rejects.toMatchObject({
      orderId: selected._id.toString(),
      expectedVersion: 1,
      actualVersion: 2,
    });
  });
});

describe("domain exception filter mapping", () => {
  it("maps missing, workflow, version, and corrupt-row errors separately", () => {
    const id = "66b8f2f14145d8a9f14145d8";

    expect(mapOrderException(new OrderNotFoundError(id))).toMatchObject({
      statusCode: HttpStatus.NOT_FOUND,
      error: "Not Found",
    });
    expect(
      mapOrderException(
        new OrderTransitionConflict(ORDER_STATUS.SHIPPED, ORDER_STATUS.PAID),
      ),
    ).toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      error: "Transition Conflict",
    });
    expect(mapOrderException(new OrderVersionConflict(id, 1, 2))).toMatchObject(
      { statusCode: HttpStatus.CONFLICT, error: "Version Conflict" },
    );
    expect(
      mapOrderException(new InvalidOrderDocumentError("status")),
    ).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Invalid Persisted Order",
    });
  });
});

describe("served operations console", () => {
  it("targets the live list, create, transition, and boundary routes", () => {
    const html = renderOrderConsole();

    expect(html).toContain("fetch(path, options)");
    expect(html).toContain("/api/orders");
    expect(html).toContain("/api/boundary/default");
    expect(html).toContain("Optimistic version conflict");
  });
});

function acceptDomainStatus(status: OrderStatus): OrderStatus {
  return status;
}

void acceptDomainStatus;
