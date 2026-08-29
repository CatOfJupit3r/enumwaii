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

export function describeOrderStatus(status: OrderStatus) {
  return { status, ...statusMetadata.get(status) };
}
