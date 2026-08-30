import { implement, ORPCError } from "@orpc/server";

import { contract, ERROR_KIND, type TransitionResult } from "./contract";
import {
  availableJobTransitions,
  IllegalJobTransitionError,
  JobNotFoundError,
  JobStore,
  JobVersionConflictError,
  type JobRecord,
  type JobSummary,
} from "./domain/jobs";

export interface CallCounters {
  list: number;
  reset: number;
  status: number;
  transition: number;
}

export interface AppContext {
  readonly actor: string;
  readonly calls: CallCounters;
  readonly corruptOutput: boolean;
  readonly requestId: string;
  readonly store: JobStore;
}

export function createCallCounters(): CallCounters {
  return { list: 0, reset: 0, status: 0, transition: 0 };
}

export function contextFor(
  store: JobStore,
  options: Partial<Omit<AppContext, "store">> = {},
): AppContext {
  return {
    actor: "scheduler",
    calls: createCallCounters(),
    corruptOutput: false,
    requestId: "req-local",
    ...options,
    store,
  };
}

function summarize(record: JobRecord): JobSummary {
  return {
    ...record,
    availableTransitions: availableJobTransitions(record.status),
  };
}

function transitionResult(
  record: JobRecord,
  context: AppContext,
): TransitionResult {
  return {
    job: summarize(record),
    audit: { actor: context.actor, requestId: context.requestId },
  };
}

function corruptedStatusOutput(): unknown {
  return "CORRUPTED_OUTPUT";
}

const implementation = implement(contract).$context<AppContext>();

const contextMiddleware = implementation.middleware(
  async ({ context, next }) => {
    if (context.actor.trim().length === 0) {
      throw new ORPCError("FORBIDDEN", {
        message: "The x-actor header is required",
      });
    }

    return next({
      context: {
        ...context,
        requestId: `${context.requestId}:middleware`,
      },
    });
  },
);

const statusProcedure = implementation.status
  .use(contextMiddleware)
  .handler(({ context, input }) => {
    context.calls.status += 1;
    return context.corruptOutput ? corruptedStatusOutput() : input;
  });

const listProcedure = implementation.list
  .use(contextMiddleware)
  .handler(({ context }) => {
    context.calls.list += 1;
    return context.store.list();
  });

const transitionProcedure = implementation.transition
  .use(contextMiddleware)
  .handler(({ context, input, errors }) => {
    context.calls.transition += 1;
    try {
      const record = context.store.transition(
        input.jobId,
        input.to,
        input.expectedVersion,
      );
      return transitionResult(record, context);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        throw errors.NOT_FOUND({
          data: { kind: ERROR_KIND.NOT_FOUND, jobId: error.jobId },
        });
      }
      if (error instanceof JobVersionConflictError) {
        const current = context.store.find(input.jobId);
        throw errors.CONFLICT({
          data: {
            kind: ERROR_KIND.VERSION_CONFLICT,
            jobId: input.jobId,
            currentStatus: current.status,
            requestedStatus: input.to,
            expectedVersion: error.expectedVersion,
            actualVersion: error.actualVersion,
          },
        });
      }
      if (error instanceof IllegalJobTransitionError) {
        const current = context.store.find(input.jobId);
        throw errors.CONFLICT({
          data: {
            kind: ERROR_KIND.ILLEGAL_TRANSITION,
            jobId: input.jobId,
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
  transition: transitionProcedure,
  reset: resetProcedure,
});

export const local = {
  status: statusProcedure,
  list: listProcedure,
  transition: transitionProcedure,
  reset: resetProcedure,
};
