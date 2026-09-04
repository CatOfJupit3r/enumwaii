import { oc } from "@orpc/contract";
import { em } from "enumwaii";
import { zodSchema } from "enumwaii/zod";
import { z } from "zod";
import {
  reservationStatuses,
  reservationServices,
} from "./domain/reservations";

const errorKinds = em([
  "NOT_FOUND",
  "DOUBLE_BOOKED",
  "ILLEGAL_TRANSITION",
  "VERSION_CONFLICT",
]);
export const ERROR_KIND = errorKinds.enum;
const statusFieldSchema = zodSchema(reservationStatuses);
const errorKindSchema = zodSchema(errorKinds);

export const reservationSchema = z.strictObject({
  id: z.string().min(1),
  owner: z.string().min(1),
  service: zodSchema(reservationServices),
  partySize: z.int().min(1).max(12),
  status: statusFieldSchema,
  version: z.int().nonnegative(),
});
export const reservationSummarySchema = reservationSchema.extend({
  availableTransitions: z.array(statusFieldSchema),
});
export const transitionInputSchema = z.strictObject({
  reservationId: z.string().min(1),
  to: statusFieldSchema,
  expectedVersion: z.int().nonnegative(),
});
export const requestInputSchema = z.strictObject({
  owner: z.string().min(1),
  partySize: z.int().min(1).max(12),
  service: zodSchema(reservationServices),
});
export const transitionResultSchema = z.strictObject({
  reservation: reservationSummarySchema,
  audit: z.strictObject({
    actor: z.string().min(1),
    requestId: z.string().min(1),
  }),
});
export const reservationErrorDataSchema = z.strictObject({
  kind: errorKindSchema,
  reservationId: z.string().min(1),
  currentStatus: statusFieldSchema.optional(),
  requestedStatus: statusFieldSchema.optional(),
  expectedVersion: z.int().nonnegative().optional(),
  actualVersion: z.int().nonnegative().optional(),
});
const businessErrors = {
  NOT_FOUND: {
    status: 404,
    message: "Reservation not found",
    data: reservationErrorDataSchema,
  },
  DOUBLE_BOOKED: {
    status: 409,
    message: "Reservation already exists for this service",
    data: reservationErrorDataSchema,
  },
  ILLEGAL_TRANSITION: {
    status: 409,
    message: "Illegal reservation transition",
    data: reservationErrorDataSchema,
  },
  VERSION_CONFLICT: {
    status: 409,
    message: "Reservation version conflict",
    data: reservationErrorDataSchema,
  },
};
const procedures = {
  status: oc
    .route({
      method: "POST",
      path: "/reservations/availability",
      summary: "Validate and echo an availability status",
    })
    .input(reservationStatuses)
    .output(reservationStatuses),
  list: oc
    .route({
      method: "GET",
      path: "/reservations",
      summary: "List reservations for the host stand",
    })
    .input(z.strictObject({}))
    .output(z.array(reservationSummarySchema)),
  request: oc
    .route({
      method: "POST",
      path: "/reservations",
      summary: "Request a restaurant reservation",
    })
    .input(requestInputSchema)
    .output(reservationSummarySchema)
    .errors(businessErrors),
  transition: oc
    .route({
      method: "POST",
      path: "/reservations/{reservationId}/transitions",
      summary: "Apply a host action with optimistic concurrency",
    })
    .input(transitionInputSchema)
    .output(transitionResultSchema)
    .errors(businessErrors),
  reset: oc
    .route({
      method: "POST",
      path: "/reservations/reset",
      summary: "Restore the seeded reservations",
    })
    .input(z.strictObject({}))
    .output(z.array(reservationSummarySchema)),
};
export const contract = oc.prefix("/v1").tag("reservations").router(procedures);
export type Reservation = z.infer<typeof reservationSchema>;
export type ReservationSummary = z.infer<typeof reservationSummarySchema>;
export type ReservationTransitionInput = z.infer<typeof transitionInputSchema>;
export type ReservationTransitionResult = z.infer<
  typeof transitionResultSchema
>;
export type ReservationErrorData = z.infer<typeof reservationErrorDataSchema>;
