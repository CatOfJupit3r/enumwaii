import { em, type InferEnumwaii } from "enumwaii";

const orderStatuses = em(["PENDING", "PAID", "SHIPPED"]);

export const ORDER_STATUS = orderStatuses.enum;
export type OrderStatus = InferEnumwaii<typeof orderStatuses>;
export const orderStatusSchema = orderStatuses;

const statusMetadata = orderStatuses.derive(
  [ORDER_STATUS.PENDING, { label: "Pending", terminal: false }],
  [ORDER_STATUS.PAID, { label: "Paid", terminal: false }],
  [ORDER_STATUS.SHIPPED, { label: "Shipped", terminal: true }],
);

const allowedTransitions = orderStatuses.deriveTo(
  orderStatuses,
  [ORDER_STATUS.PENDING, ORDER_STATUS.PAID],
  [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED, []],
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

export function describeOrderStatus(status: OrderStatus) {
  return { status, ...statusMetadata.get(status) };
}

export function transitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): OrderStatus {
  const allowed = allowedTransitions.get(from);
  const isAllowed = Array.isArray(allowed)
    ? allowed.some((candidate) => candidate === to)
    : allowed === to;
  if (!isAllowed) {
    throw new OrderTransitionConflict(from, to);
  }
  return to;
}
