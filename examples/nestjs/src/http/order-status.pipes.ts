import { ORDER_STATUS, orderStatusSchema } from "../domain/order-status";
import { EnumwaiiParsePipe } from "./enumwaii-parse.pipe";

export const strictOrderStatusPipe = new EnumwaiiParsePipe(
  orderStatusSchema,
  {},
  "order status",
);

export const defaultOrderStatusPipe = new EnumwaiiParsePipe(
  orderStatusSchema,
  { default: ORDER_STATUS.PENDING },
  "order status",
);

export const fallbackOrderStatusPipe = new EnumwaiiParsePipe(
  orderStatusSchema,
  { fallback: ORDER_STATUS.PENDING },
  "order status",
);
