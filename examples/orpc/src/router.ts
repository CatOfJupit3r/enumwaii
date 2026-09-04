import { implement, ORPCError } from "@orpc/server";
import {
  contract,
  ERROR_KIND,
  type ReservationTransitionResult,
} from "./contract";
import {
  availableReservationTransitions,
  DoubleBookedError,
  IllegalReservationTransitionError,
  ReservationNotFoundError,
  ReservationStore,
  ReservationVersionConflictError,
  type ReservationRecord,
  type ReservationSummary,
} from "./domain/reservations";

export interface CallCounters {
  list: number;
  request: number;
  reset: number;
  status: number;
  transition: number;
}
export interface AppContext {
  readonly actor: string;
  readonly calls: CallCounters;
  readonly corruptOutput: boolean;
  readonly requestId: string;
  readonly store: ReservationStore;
}
export function createCallCounters(): CallCounters {
  return { list: 0, request: 0, reset: 0, status: 0, transition: 0 };
}
export function contextFor(
  store: ReservationStore,
  options: Partial<Omit<AppContext, "store">> = {},
): AppContext {
  return {
    actor: "host",
    calls: createCallCounters(),
    corruptOutput: false,
    requestId: "req-local",
    ...options,
    store,
  };
}
function summarize(record: ReservationRecord): ReservationSummary {
  return {
    ...record,
    availableTransitions: availableReservationTransitions(record.status),
  };
}
function transitionResult(
  record: ReservationRecord,
  context: AppContext,
): ReservationTransitionResult {
  return {
    reservation: summarize(record),
    audit: { actor: context.actor, requestId: context.requestId },
  };
}
const implementation = implement(contract).$context<AppContext>();
const contextMiddleware = implementation.middleware(
  async ({ context, next }) => {
    if (context.actor.trim().length === 0)
      throw new ORPCError("FORBIDDEN", {
        message: "The x-actor host name is required",
      });
    return next({
      context: { ...context, requestId: context.requestId + ":middleware" },
    });
  },
);
const statusProcedure = implementation.status
  .use(contextMiddleware)
  .handler(({ context, input }) => {
    context.calls.status += 1;
    return context.corruptOutput ? "CORRUPTED_OUTPUT" : input;
  });
const listProcedure = implementation.list
  .use(contextMiddleware)
  .handler(({ context }) => {
    context.calls.list += 1;
    return context.store.list();
  });
const requestProcedure = implementation.request
  .use(contextMiddleware)
  .handler(({ context, input, errors }) => {
    context.calls.request += 1;
    try {
      return context.store.request(input.owner, input.partySize, input.service);
    } catch (error) {
      if (error instanceof DoubleBookedError) {
        throw errors.DOUBLE_BOOKED({
          data: {
            kind: ERROR_KIND.DOUBLE_BOOKED,
            reservationId: error.reservationId,
          },
        });
      }
      throw error;
    }
  });
const transitionProcedure = implementation.transition
  .use(contextMiddleware)
  .handler(({ context, input, errors }) => {
    context.calls.transition += 1;
    try {
      return transitionResult(
        context.store.transition(
          input.reservationId,
          input.to,
          input.expectedVersion,
        ),
        context,
      );
    } catch (error) {
      if (error instanceof ReservationNotFoundError)
        throw errors.NOT_FOUND({
          data: {
            kind: ERROR_KIND.NOT_FOUND,
            reservationId: error.reservationId,
          },
        });
      if (error instanceof ReservationVersionConflictError) {
        const current = context.store.find(input.reservationId);
        throw errors.VERSION_CONFLICT({
          data: {
            kind: ERROR_KIND.VERSION_CONFLICT,
            reservationId: input.reservationId,
            currentStatus: current.status,
            requestedStatus: input.to,
            expectedVersion: error.expectedVersion,
            actualVersion: error.actualVersion,
          },
        });
      }
      if (error instanceof IllegalReservationTransitionError) {
        const current = context.store.find(input.reservationId);
        throw errors.ILLEGAL_TRANSITION({
          data: {
            kind: ERROR_KIND.ILLEGAL_TRANSITION,
            reservationId: input.reservationId,
            currentStatus: error.from,
            requestedStatus: error.to,
            actualVersion: current.version,
          },
        });
      }
      throw error;
    }
  });
const resetProcedure = implementation.reset
  .use(contextMiddleware)
  .handler(({ context }) => {
    context.calls.reset += 1;
    return context.store.reset();
  });
export const router = implementation.router({
  status: statusProcedure,
  list: listProcedure,
  request: requestProcedure,
  transition: transitionProcedure,
  reset: resetProcedure,
});
export const local = {
  status: statusProcedure,
  list: listProcedure,
  request: requestProcedure,
  transition: transitionProcedure,
  reset: resetProcedure,
};
