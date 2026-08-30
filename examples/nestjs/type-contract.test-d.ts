import { em } from "enumwaii";

import {
  assertOrderTransition,
  describeOrderStatus,
  ORDER_STATUS,
  type OrderStatus,
} from "./src/domain/order-status";
import type { RawOrderDocument } from "./src/persistence/order.hydrator";
import type { RawOrderStatus } from "./src/persistence/order.schema";

declare const rawString: string;
declare const rawDatabaseStatus: RawOrderStatus;
declare const persistedOrder: RawOrderDocument;

// @ts-expect-error Untrusted strings must cross an enumwaii parser boundary.
describeOrderStatus(rawString);

// @ts-expect-error Mongoose's raw status union is deliberately not branded.
assertOrderTransition(rawDatabaseStatus, ORDER_STATUS.PAID);

// @ts-expect-error A raw persisted field cannot masquerade as a domain member.
const unhydratedStatus: OrderStatus = persistedOrder.status;

const shipmentStatuses = em(["PENDING", "IN_TRANSIT"]);
const SHIPMENT_STATUS = shipmentStatuses.enum;

// @ts-expect-error An overlapping member owned by another enumwaii is foreign.
describeOrderStatus(SHIPMENT_STATUS.PENDING);

assertOrderTransition(ORDER_STATUS.PENDING, ORDER_STATUS.PAID);

void unhydratedStatus;
