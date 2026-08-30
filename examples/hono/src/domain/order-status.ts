import { em, type InferEnumwaii } from "enumwaii";

const orderStatuses = em(["PENDING", "PAID", "SHIPPED", "CANCELLED"]);

/** Stable branded views for application and domain code. */
export const ORDER_STATUS = orderStatuses.enum;
export const ORDER_STATUS_VALUES = orderStatuses.values;
export type OrderStatus = InferEnumwaii<typeof orderStatuses>;
/** The declaration itself is the scalar Standard Schema validator. */
export const orderStatusSchema = orderStatuses;

/** Raw integration views are consumed only by the PostgreSQL schema. */
export const ORDER_STATUS_DB_ENUM = orderStatuses.rawEnum;
const [firstDatabaseStatus, ...remainingDatabaseStatuses] =
  orderStatuses.rawValues;
export const ORDER_STATUS_DB_VALUES = [
  firstDatabaseStatus,
  ...remainingDatabaseStatuses,
] as const;

export type OrderStatusPresentation = {
  readonly label: string;
  readonly description: string;
  readonly tone: "amber" | "blue" | "green" | "slate";
  readonly terminal: boolean;
};

const statusPresentation = orderStatuses.derive(
  [
    ORDER_STATUS.PENDING,
    {
      label: "Pending",
      description: "Awaiting payment confirmation",
      tone: "amber",
      terminal: false,
    },
  ],
  [
    ORDER_STATUS.PAID,
    {
      label: "Paid",
      description: "Cleared for warehouse dispatch",
      tone: "blue",
      terminal: false,
    },
  ],
  [
    ORDER_STATUS.SHIPPED,
    {
      label: "Shipped",
      description: "Handed to the delivery partner",
      tone: "green",
      terminal: true,
    },
  ],
  [
    ORDER_STATUS.CANCELLED,
    {
      label: "Cancelled",
      description: "Closed without fulfillment",
      tone: "slate",
      terminal: true,
    },
  ],
);

const allowedTransitions = orderStatuses.deriveTo(
  orderStatuses,
  [ORDER_STATUS.PENDING, [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED]],
  [ORDER_STATUS.PAID, [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED]],
  [ORDER_STATUS.SHIPPED, []],
  [ORDER_STATUS.CANCELLED, []],
);

export class OrderTransitionConflict extends Error {
  public constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Cannot transition an order from ${from} to ${to}`);
    this.name = "OrderTransitionConflict";
  }
}

export function describeOrderStatus(
  status: OrderStatus,
): OrderStatusPresentation {
  return statusPresentation.get(status);
}

export function getAllowedOrderTransitions(
  status: OrderStatus,
): readonly OrderStatus[] {
  return allowedTransitions.get(status);
}

export function assertOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  const allowed = getAllowedOrderTransitions(from);
  if (!allowed.some((candidate) => candidate === to)) {
    throw new OrderTransitionConflict(from, to);
  }
}
