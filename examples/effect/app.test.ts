import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";

import {
  applyDeployCommand,
  decodeDeployCommand,
  DEPLOY_COMMAND,
  DEPLOY_STATUS,
  DeployRepository,
  DeployRepositoryLive,
  describeStatus,
  transition,
} from "./src/deployment-pipeline";

describe("shipctl deployment pipeline", () => {
  it("decodes untrusted state, command, and optional version at the CLI boundary", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        decodeDeployCommand({
          state: "QUEUED",
          command: "START",
          expectedVersion: 1,
        }),
      ),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result))
      expect(result.right).toMatchObject({
        state: DEPLOY_STATUS.QUEUED,
        command: DEPLOY_COMMAND.START,
        expectedVersion: 1,
      });
  });
  it("turns malformed deploy input into a tagged failure", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        decodeDeployCommand({ state: "WAITING", command: "START" }),
      ),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result))
      expect(result.left).toMatchObject({
        _tag: "InvalidDeployInput",
        field: "state",
      });
  });
  it("derives terminal, retry, glyph, and color metadata exhaustively", () => {
    expect(describeStatus(DEPLOY_STATUS.FAILED)).toMatchObject({
      terminal: true,
      retryable: true,
      glyph: "×",
      color: "RED",
    });
    expect(describeStatus(DEPLOY_STATUS.LIVE)).toMatchObject({
      terminal: true,
      retryable: false,
      glyph: "●",
    });
  });
  it("routes commands through an exhaustive deploy transition graph", async () => {
    const building = await Effect.runPromise(
      transition(
        {
          id: "checkout-api",
          service: "checkout-api",
          status: DEPLOY_STATUS.QUEUED,
          version: 1,
        },
        DEPLOY_COMMAND.START,
      ),
    );
    expect(building).toMatchObject({
      status: DEPLOY_STATUS.BUILDING,
      version: 2,
    });
    const illegal = await Effect.runPromise(
      Effect.either(transition(building, DEPLOY_COMMAND.RETRY)),
    );
    expect(Either.isLeft(illegal)).toBe(true);
  });
  it("keeps deploys in an injected Ref-backed repository and catches stale writes", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const repository = yield* DeployRepository;
          const started = yield* applyDeployCommand("checkout-api", {
            state: "QUEUED",
            command: "START",
            expectedVersion: 1,
          });
          const stale = yield* Effect.either(
            applyDeployCommand("checkout-api", {
              state: "BUILDING",
              command: "PROMOTE",
              expectedVersion: 1,
            }),
          );
          return {
            started,
            stale,
            persisted: yield* repository.get("checkout-api"),
          };
        }).pipe(Effect.provide(DeployRepositoryLive)),
      ),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.started.status).toBe(DEPLOY_STATUS.BUILDING);
      expect(result.right.persisted.status).toBe(DEPLOY_STATUS.BUILDING);
      expect(Either.isLeft(result.right.stale)).toBe(true);
    }
  });
  it("allows callers to recover a missing deployment by tag", async () => {
    const recovered = await Effect.runPromise(
      applyDeployCommand("missing", { state: "QUEUED", command: "START" }).pipe(
        Effect.provide(DeployRepositoryLive),
        Effect.catchTag("DeployNotFound", (error) =>
          Effect.succeed(`recovered:${error.id}`),
        ),
      ),
    );
    expect(recovered).toBe("recovered:missing");
  });
});
