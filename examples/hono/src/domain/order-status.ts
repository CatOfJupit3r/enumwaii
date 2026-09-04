import { lowercase } from "enumwaii/derive-with";
import { em, type InferEnumwaii } from "enumwaii";

const tones = em(["AMBER", "BLUE", "GREEN", "SLATE", "ROSE"]);
export const TONE = tones.enum;
export const toneClasses = tones.derive(lowercase);

const orderStatuses = em([
  "PLACED",
  "BREWING",
  "READY",
  "PICKED_UP",
  "CANCELLED",
]);
export const ORDER_STATUS = orderStatuses.enum;
export const ORDER_STATUS_VALUES = orderStatuses.values;
export type OrderStatus = InferEnumwaii<typeof orderStatuses>;
export const orderStatusSchema = orderStatuses;
export const ORDER_STATUS_DB_ENUM = orderStatuses.rawEnum;
export const ORDER_STATUS_DB_VALUES = orderStatuses.rawValues as readonly [
  (typeof orderStatuses.rawValues)[number],
  ...(typeof orderStatuses.rawValues)[number][],
];

const drinkSizes = em(["SHORT", "TALL", "GRANDE"]);
export const DRINK_SIZE = drinkSizes.enum;
export const DRINK_SIZE_VALUES = drinkSizes.values;
export type DrinkSize = InferEnumwaii<typeof drinkSizes>;
export const drinkSizeSchema = drinkSizes;
export const DRINK_SIZE_DB_ENUM = drinkSizes.rawEnum;
export const DRINK_SIZE_DB_VALUES = drinkSizes.rawValues as readonly [
  (typeof drinkSizes.rawValues)[number],
  ...(typeof drinkSizes.rawValues)[number][],
];

const statusPresentation = orderStatuses.derive(
  [
    ORDER_STATUS.PLACED,
    {
      label: "Placed",
      description: "Ticket received at the counter",
      tone: TONE.AMBER,
      terminal: false,
    },
  ],
  [
    ORDER_STATUS.BREWING,
    {
      label: "Brewing",
      description: "A barista is on it",
      tone: TONE.BLUE,
      terminal: false,
    },
  ],
  [
    ORDER_STATUS.READY,
    {
      label: "Ready",
      description: "Waiting at the handoff bar",
      tone: TONE.GREEN,
      terminal: false,
    },
  ],
  [
    ORDER_STATUS.PICKED_UP,
    {
      label: "Picked up",
      description: "Enjoy the coffee",
      tone: TONE.SLATE,
      terminal: true,
    },
  ],
  [
    ORDER_STATUS.CANCELLED,
    {
      label: "Cancelled",
      description: "Closed before handoff",
      tone: TONE.ROSE,
      terminal: true,
    },
  ],
);
const sizePresentation = drinkSizes.derive(
  [DRINK_SIZE.SHORT, { label: "Short", cents: 320 }],
  [DRINK_SIZE.TALL, { label: "Tall", cents: 420 }],
  [DRINK_SIZE.GRANDE, { label: "Grande", cents: 520 }],
);
const allowedTransitions = orderStatuses.deriveTo(
  orderStatuses,
  [ORDER_STATUS.PLACED, [ORDER_STATUS.BREWING, ORDER_STATUS.CANCELLED]],
  [ORDER_STATUS.BREWING, [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED]],
  [ORDER_STATUS.READY, [ORDER_STATUS.PICKED_UP]],
  [ORDER_STATUS.PICKED_UP, []],
  [ORDER_STATUS.CANCELLED, []],
);
export class OrderTransitionConflict extends Error {
  public constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Cannot move a café order from ${from} to ${to}`);
    this.name = "OrderTransitionConflict";
  }
}
export function describeOrderStatus(status: OrderStatus) {
  return statusPresentation.get(status);
}
export function describeDrinkSize(size: DrinkSize) {
  return sizePresentation.get(size);
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
  if (!getAllowedOrderTransitions(from).some((candidate) => candidate === to))
    throw new OrderTransitionConflict(from, to);
}
