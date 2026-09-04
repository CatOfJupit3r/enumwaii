import { em } from "enumwaii";
import {
  orderStatusSchema,
  ORDER_STATUS,
  drinkSizeSchema,
  DRINK_SIZE,
} from "../domain/order-status";

export const orderStatusUrlSchema = em({
  PLACED: "placed",
  BREWING: "brewing",
  READY: "ready",
  PICKED_UP: "picked-up",
  CANCELLED: "cancelled",
});
export const ORDER_STATUS_URL = orderStatusUrlSchema.enum;
export const orderStatusUrlToDomain = orderStatusUrlSchema.deriveTo(
  orderStatusSchema,
  [ORDER_STATUS_URL.PLACED, ORDER_STATUS.PLACED],
  [ORDER_STATUS_URL.BREWING, ORDER_STATUS.BREWING],
  [ORDER_STATUS_URL.READY, ORDER_STATUS.READY],
  [ORDER_STATUS_URL.PICKED_UP, ORDER_STATUS.PICKED_UP],
  [ORDER_STATUS_URL.CANCELLED, ORDER_STATUS.CANCELLED],
);

export const drinkSizeUrlSchema = em({
  SHORT: "short",
  TALL: "tall",
  GRANDE: "grande",
});
const DRINK_SIZE_URL = drinkSizeUrlSchema.enum;
export const drinkSizeUrlToDomain = drinkSizeUrlSchema.deriveTo(
  drinkSizeSchema,
  [DRINK_SIZE_URL.SHORT, DRINK_SIZE.SHORT],
  [DRINK_SIZE_URL.TALL, DRINK_SIZE.TALL],
  [DRINK_SIZE_URL.GRANDE, DRINK_SIZE.GRANDE],
);
