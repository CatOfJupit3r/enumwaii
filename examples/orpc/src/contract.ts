import { oc } from "@orpc/contract";
import { em } from "enumwaii";
import { zodSchema } from "enumwaii/zod";
import { z } from "zod";

import { jobStatuses } from "./domain/jobs";

const errorKinds = em(["NOT_FOUND", "ILLEGAL_TRANSITION", "VERSION_CONFLICT"]);
export const ERROR_KIND = errorKinds.enum;

const statusFieldSchema = zodSchema(jobStatuses);
const errorKindSchema = zodSchema(errorKinds);

export const jobSchema = z.strictObject({
  id: z.string().min(1),
  owner: z.string().min(1),
  status: statusFieldSchema,
  version: z.int().nonnegative(),
});

export const jobSummarySchema = jobSchema.extend({
  availableTransitions: z.array(statusFieldSchema),
});

export const transitionInputSchema = z.strictObject({
  jobId: z.string().min(1),
  to: statusFieldSchema,
  expectedVersion: z.int().nonnegative(),
});

export const transitionResultSchema = z.strictObject({
  job: jobSummarySchema,
  audit: z.strictObject({
    actor: z.string().min(1),
    requestId: z.string().min(1),
  }),
});

export const jobErrorDataSchema = z.strictObject({
  kind: errorKindSchema,
  jobId: z.string().min(1),
  currentStatus: statusFieldSchema.optional(),
  requestedStatus: statusFieldSchema.optional(),
  expectedVersion: z.int().nonnegative().optional(),
  actualVersion: z.int().nonnegative().optional(),
});

const businessErrors = {
  NOT_FOUND: {
    status: 404,
    message: "Job not found",
    data: jobErrorDataSchema,
  },
  CONFLICT: {
    status: 409,
    message: "Job transition conflict",
    data: jobErrorDataSchema,
  },
};

const procedures = {
  status: oc
    .route({
      method: "POST",
      path: "/jobs/status",
      summary: "Validate and echo one job status",
    })
    .input(jobStatuses)
    .output(jobStatuses),
  list: oc
    .route({
      method: "GET",
      path: "/jobs",
      summary: "List the process-local demo jobs",
    })
    .input(z.strictObject({}))
    .output(z.array(jobSummarySchema)),
  transition: oc
    .route({
      method: "POST",
      path: "/jobs/{jobId}/transitions",
      summary: "Apply an optimistic-concurrency job transition",
    })
    .input(transitionInputSchema)
    .output(transitionResultSchema)
    .errors(businessErrors),
  reset: oc
    .route({
      method: "POST",
      path: "/jobs/reset",
      summary: "Restore the demo jobs to their seed state",
    })
    .input(z.strictObject({}))
    .output(z.array(jobSummarySchema)),
};

export const contract = oc.prefix("/v1").tag("jobs").router(procedures);

export type Job = z.infer<typeof jobSchema>;
export type JobSummary = z.infer<typeof jobSummarySchema>;
export type TransitionInput = z.infer<typeof transitionInputSchema>;
export type TransitionResult = z.infer<typeof transitionResultSchema>;
export type JobErrorData = z.infer<typeof jobErrorDataSchema>;
