import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";

import {
  applyJobCommand,
  decodeJobCommand,
  describeStatus,
  JOB_COMMAND,
  JOB_STATUS,
  JobRepository,
  JobRepositoryLive,
  transition,
} from "./src/job-workflow";

describe("Effect job workflow", () => {
  it("decodes valid external state and command at the Effect boundary", async () => {
    const result = await Effect.runPromise(
      Effect.either(decodeJobCommand({ state: "QUEUED", command: "START" })),
    );

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.state).toBe(JOB_STATUS.QUEUED);
      expect(result.right.command).toBe(JOB_COMMAND.START);
    }
  });

  it("turns malformed external input into a tagged typed failure", async () => {
    const result = await Effect.runPromise(
      Effect.either(decodeJobCommand({ state: "WAITING", command: "START" })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("InvalidJobInput");
      expect(result.left.field).toBe("state");
    }
  });

  it("keeps command input separate from state decoding failures", async () => {
    const result = await Effect.runPromise(
      Effect.either(decodeJobCommand({ state: "QUEUED", command: "PAUSE" })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("InvalidJobInput");
      expect(result.left.field).toBe("command");
    }
  });

  it("rejects primitive and missing-shape input at the boundary", async () => {
    const primitive = await Effect.runPromise(
      Effect.either(decodeJobCommand("START")),
    );
    const missingShape = await Effect.runPromise(
      Effect.either(decodeJobCommand({ state: "QUEUED" })),
    );

    expect(Either.isLeft(primitive)).toBe(true);
    expect(Either.isLeft(missingShape)).toBe(true);
    if (Either.isLeft(primitive)) {
      expect(primitive.left.field).toBe("request");
    }
    if (Either.isLeft(missingShape)) {
      expect(missingShape.left.field).toBe("request");
    }
  });

  it("derives terminal and retry metadata exhaustively", () => {
    expect(describeStatus(JOB_STATUS.SUCCEEDED)).toEqual({
      status: JOB_STATUS.SUCCEEDED,
      terminal: true,
      retryable: false,
    });
    expect(describeStatus(JOB_STATUS.FAILED)).toEqual({
      status: JOB_STATUS.FAILED,
      terminal: false,
      retryable: true,
    });
  });

  it("performs a valid transition with branded members", async () => {
    const result = await Effect.runPromise(
      transition({ id: "job-1", status: JOB_STATUS.QUEUED }, JOB_COMMAND.START),
    );

    expect(result).toEqual({ id: "job-1", status: JOB_STATUS.RUNNING });
  });

  it("fails a valid-but-illegal transition with a distinct tagged error", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        transition(
          { id: "job-1", status: JOB_STATUS.SUCCEEDED },
          JOB_COMMAND.START,
        ),
      ),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("IllegalJobTransition");
      expect(result.left.state).toBe(JOB_STATUS.SUCCEEDED);
    }
  });

  it("supports retry from FAILED and preserves terminal behavior", async () => {
    const retried = await Effect.runPromise(
      transition({ id: "job-1", status: JOB_STATUS.FAILED }, JOB_COMMAND.RETRY),
    );
    expect(retried.status).toBe(JOB_STATUS.QUEUED);

    const terminal = await Effect.runPromise(
      Effect.either(
        transition(
          { id: "job-1", status: JOB_STATUS.SUCCEEDED },
          JOB_COMMAND.RETRY,
        ),
      ),
    );
    expect(Either.isLeft(terminal)).toBe(true);
  });

  it("persists branded state through a Ref-backed injected repository", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* JobRepository;
        yield* repository.save({ id: "job-1", status: JOB_STATUS.QUEUED });
        const updated = yield* applyJobCommand("job-1", {
          state: "QUEUED",
          command: "START",
        });
        const persisted = yield* repository.get("job-1");
        return { updated, persisted };
      }).pipe(Effect.provide(JobRepositoryLive)),
    );

    expect(result.updated.status).toBe(JOB_STATUS.RUNNING);
    expect(result.persisted.status).toBe(JOB_STATUS.RUNNING);
  });

  it("reports a stale claimed state as a distinct typed service failure", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const repository = yield* JobRepository;
          yield* repository.save({ id: "job-1", status: JOB_STATUS.QUEUED });
          return yield* applyJobCommand("job-1", {
            state: "RUNNING",
            command: "START",
          });
        }).pipe(Effect.provide(JobRepositoryLive)),
      ),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("JobStateConflict");
      if (result.left._tag === "JobStateConflict") {
        expect(result.left.stored).toBe(JOB_STATUS.QUEUED);
        expect(result.left.claimed).toBe(JOB_STATUS.RUNNING);
      }
    }
  });

  it("allows typed recovery for a missing job", async () => {
    const result = await Effect.runPromise(
      applyJobCommand("missing", { state: "QUEUED", command: "START" }).pipe(
        Effect.provide(JobRepositoryLive),
        Effect.catchTag("JobNotFound", (error) =>
          Effect.succeed(`recovered:${error.id}`),
        ),
      ),
    );

    expect(result).toBe("recovered:missing");
  });
});
