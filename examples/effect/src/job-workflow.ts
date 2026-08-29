import { Context, Data, Effect, Layer, Ref } from "effect";
import { em, type InferEnumwaii } from "enumwaii";

const jobStatuses = em(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"]);

export const JOB_STATUS = jobStatuses.enum;
export type JobStatus = InferEnumwaii<typeof jobStatuses>;

const jobCommands = em(["START", "SUCCEED", "FAIL", "RETRY"]);

export const JOB_COMMAND = jobCommands.enum;
export type JobCommand = InferEnumwaii<typeof jobCommands>;

export type Job = {
  readonly id: string;
  readonly status: JobStatus;
};

export type ExternalJobCommand = {
  readonly state: unknown;
  readonly command: unknown;
};

export class InvalidJobInput extends Data.TaggedError("InvalidJobInput")<{
  readonly field: "request" | "state" | "command";
  readonly received: unknown;
}> {}

export class IllegalJobTransition extends Data.TaggedError(
  "IllegalJobTransition",
)<{
  readonly state: JobStatus;
  readonly command: JobCommand;
}> {}

export class JobNotFound extends Data.TaggedError("JobNotFound")<{
  readonly id: string;
}> {}

export class JobStateConflict extends Data.TaggedError("JobStateConflict")<{
  readonly id: string;
  readonly stored: JobStatus;
  readonly claimed: JobStatus;
}> {}

const statusMetadata = jobStatuses.derive(
  [JOB_STATUS.QUEUED, { terminal: false, retryable: false }],
  [JOB_STATUS.RUNNING, { terminal: false, retryable: false }],
  [JOB_STATUS.SUCCEEDED, { terminal: true, retryable: false }],
  [JOB_STATUS.FAILED, { terminal: false, retryable: true }],
);

/** The status-to-command table is exhaustive and contains only owned values. */
const allowedCommands = jobStatuses.deriveTo(
  jobCommands,
  [JOB_STATUS.QUEUED, [JOB_COMMAND.START]],
  [JOB_STATUS.RUNNING, [JOB_COMMAND.SUCCEED, JOB_COMMAND.FAIL]],
  [JOB_STATUS.SUCCEEDED, []],
  [JOB_STATUS.FAILED, [JOB_COMMAND.RETRY]],
);

/** Each command has one destination; legality is checked with allowedCommands. */
const nextStatusByCommand = jobCommands.deriveTo(
  jobStatuses,
  [JOB_COMMAND.START, JOB_STATUS.RUNNING],
  [JOB_COMMAND.SUCCEED, JOB_STATUS.SUCCEEDED],
  [JOB_COMMAND.FAIL, JOB_STATUS.FAILED],
  [JOB_COMMAND.RETRY, JOB_STATUS.QUEUED],
);

export function describeStatus(status: JobStatus) {
  return { status, ...statusMetadata.get(status) };
}

function isExternalJobCommand(input: unknown): input is ExternalJobCommand {
  return (
    typeof input === "object" &&
    input !== null &&
    "state" in input &&
    "command" in input
  );
}

/** Decode the untrusted boundary before any workflow code sees branded values. */
export function decodeJobCommand(
  input: unknown,
): Effect.Effect<
  { readonly state: JobStatus; readonly command: JobCommand },
  InvalidJobInput
> {
  return Effect.gen(function* () {
    if (!isExternalJobCommand(input)) {
      return yield* Effect.fail(
        new InvalidJobInput({ field: "request", received: input }),
      );
    }

    const state = jobStatuses.safeParse(input.state);
    if (!state.success) {
      return yield* Effect.fail(
        new InvalidJobInput({ field: "state", received: input.state }),
      );
    }

    const command = jobCommands.safeParse(input.command);
    if (!command.success) {
      return yield* Effect.fail(
        new InvalidJobInput({ field: "command", received: input.command }),
      );
    }

    return { state: state.value, command: command.value };
  });
}

export function transition(
  job: Job,
  command: JobCommand,
): Effect.Effect<Job, IllegalJobTransition> {
  return Effect.gen(function* () {
    const allowed = allowedCommands.get(job.status);
    if (!allowed.some((candidate) => candidate === command)) {
      return yield* Effect.fail(
        new IllegalJobTransition({ state: job.status, command }),
      );
    }

    return { ...job, status: nextStatusByCommand.get(command) };
  });
}

export interface JobRepository {
  readonly get: (id: string) => Effect.Effect<Job, JobNotFound>;
  readonly save: (job: Job) => Effect.Effect<void>;
}

export const JobRepository = Context.GenericTag<JobRepository>("JobRepository");

/** A process-local repository keeps branded Job values inside the Ref. */
export const JobRepositoryLive = Layer.effect(
  JobRepository,
  Effect.gen(function* () {
    const jobs = yield* Ref.make(new Map<string, Job>());

    return {
      get: (id: string) =>
        Effect.gen(function* () {
          const job = (yield* Ref.get(jobs)).get(id);
          if (job === undefined) {
            return yield* Effect.fail(new JobNotFound({ id }));
          }
          return job;
        }),
      save: (job: Job) =>
        Ref.update(jobs, (stored) => {
          const next = new Map(stored);
          next.set(job.id, job);
          return next;
        }),
    } satisfies JobRepository;
  }),
);

export function applyJobCommand(
  id: string,
  input: unknown,
): Effect.Effect<
  Job,
  InvalidJobInput | JobNotFound | JobStateConflict | IllegalJobTransition,
  JobRepository
> {
  return Effect.gen(function* () {
    const request = yield* decodeJobCommand(input);
    const repository = yield* JobRepository;
    const current = yield* repository.get(id);

    if (current.status !== request.state) {
      return yield* Effect.fail(
        new JobStateConflict({
          id,
          stored: current.status,
          claimed: request.state,
        }),
      );
    }

    const updated = yield* transition(current, request.command);
    yield* repository.save(updated);
    return updated;
  });
}
