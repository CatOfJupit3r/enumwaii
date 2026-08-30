import { em, type InferEnumwaii } from "enumwaii";

export const jobStatuses = em([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export const JOB_STATUS = jobStatuses.enum;
export type JobStatus = InferEnumwaii<typeof jobStatuses>;

const allowedTransitions = jobStatuses.deriveTo(
  jobStatuses,
  [JOB_STATUS.QUEUED, [JOB_STATUS.RUNNING]],
  [
    JOB_STATUS.RUNNING,
    [JOB_STATUS.SUCCEEDED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
  ],
  [JOB_STATUS.SUCCEEDED, []],
  [JOB_STATUS.FAILED, [JOB_STATUS.RUNNING]],
  [JOB_STATUS.CANCELLED, []],
);

export interface JobRecord {
  readonly id: string;
  readonly owner: string;
  readonly status: JobStatus;
  readonly version: number;
}

export interface JobSummary extends JobRecord {
  readonly availableTransitions: JobStatus[];
}

export class JobNotFoundError extends Error {
  public constructor(public readonly jobId: string) {
    super(`Job "${jobId}" was not found`);
    this.name = "JobNotFoundError";
  }
}

export class JobVersionConflictError extends Error {
  public constructor(
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Expected job version ${expectedVersion}, but the current version is ${actualVersion}`,
    );
    this.name = "JobVersionConflictError";
  }
}

export class IllegalJobTransitionError extends Error {
  public constructor(
    public readonly from: JobStatus,
    public readonly to: JobStatus,
  ) {
    super(`Cannot transition a job from ${from} to ${to}`);
    this.name = "IllegalJobTransitionError";
  }
}

export function availableJobTransitions(from: JobStatus): JobStatus[] {
  const targets = allowedTransitions.get(from);
  return typeof targets === "string" ? [targets] : [...targets];
}

export function transitionJobStatus(from: JobStatus, to: JobStatus): JobStatus {
  if (!availableJobTransitions(from).includes(to)) {
    throw new IllegalJobTransitionError(from, to);
  }
  return to;
}

function seededJobs(): JobRecord[] {
  return [
    {
      id: "job-7",
      owner: "worker-1",
      status: JOB_STATUS.QUEUED,
      version: 0,
    },
    {
      id: "job-21",
      owner: "worker-2",
      status: JOB_STATUS.RUNNING,
      version: 3,
    },
    {
      id: "job-42",
      owner: "worker-3",
      status: JOB_STATUS.FAILED,
      version: 6,
    },
  ];
}

export class JobStore {
  private readonly records = new Map<string, JobRecord>();

  public constructor() {
    this.reset();
  }

  public list(): JobSummary[] {
    return [...this.records.values()].map((record) => ({
      ...record,
      availableTransitions: availableJobTransitions(record.status),
    }));
  }

  public find(jobId: string): JobRecord {
    const record = this.records.get(jobId);
    if (record === undefined) throw new JobNotFoundError(jobId);
    return record;
  }

  public transition(
    jobId: string,
    to: JobStatus,
    expectedVersion: number,
  ): JobRecord {
    const record = this.find(jobId);
    if (expectedVersion !== record.version) {
      throw new JobVersionConflictError(expectedVersion, record.version);
    }

    const status = transitionJobStatus(record.status, to);
    const updated = { ...record, status, version: record.version + 1 };
    this.records.set(jobId, updated);
    return updated;
  }

  public reset(): JobSummary[] {
    this.records.clear();
    for (const record of seededJobs()) this.records.set(record.id, record);
    return this.list();
  }
}
