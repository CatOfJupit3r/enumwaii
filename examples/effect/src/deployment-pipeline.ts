import { Context, Data, Effect, Layer, Ref } from "effect";
import { em, type InferEnumwaii } from "enumwaii";

const colors = em(["GRAY", "YELLOW", "GREEN", "RED"]);
export const DEPLOY_COLOR = colors.enum;
export type DeployColor = InferEnumwaii<typeof colors>;
const ansiColors = colors.derive(
  [DEPLOY_COLOR.GRAY, "\u001b[90m"],
  [DEPLOY_COLOR.YELLOW, "\u001b[33m"],
  [DEPLOY_COLOR.GREEN, "\u001b[32m"],
  [DEPLOY_COLOR.RED, "\u001b[31m"],
);
export function ansiColor(color: DeployColor): string {
  return ansiColors.get(color);
}

const deployStatuses = em(["QUEUED", "BUILDING", "LIVE", "FAILED"]);
export const DEPLOY_STATUS = deployStatuses.enum;
export type DeployStatus = InferEnumwaii<typeof deployStatuses>;

const deployCommands = em(["START", "PROMOTE", "RETRY", "ROLLBACK"]);
export const DEPLOY_COMMAND = deployCommands.enum;
export type DeployCommand = InferEnumwaii<typeof deployCommands>;

export type Deploy = {
  readonly id: string;
  readonly service: string;
  readonly status: DeployStatus;
  readonly version: number;
};
export type ExternalDeployCommand = {
  readonly state: unknown;
  readonly command: unknown;
  readonly expectedVersion?: unknown;
};

export class InvalidDeployInput extends Data.TaggedError("InvalidDeployInput")<{
  readonly field: "request" | keyof ExternalDeployCommand;
  readonly received: unknown;
}> {}
export class IllegalDeployTransition extends Data.TaggedError(
  "IllegalDeployTransition",
)<{ readonly state: DeployStatus; readonly command: DeployCommand }> {}
export class DeployNotFound extends Data.TaggedError("DeployNotFound")<{
  readonly id: string;
}> {}
export class DeployVersionConflict extends Data.TaggedError(
  "DeployVersionConflict",
)<{
  readonly id: string;
  readonly stored: number;
  readonly expected: number;
}> {}

const statusMetadata = deployStatuses.derive(
  [
    DEPLOY_STATUS.QUEUED,
    {
      label: "Queued",
      glyph: "○",
      color: DEPLOY_COLOR.GRAY,
      terminal: false,
      retryable: false,
    },
  ],
  [
    DEPLOY_STATUS.BUILDING,
    {
      label: "Building",
      glyph: "◌",
      color: DEPLOY_COLOR.YELLOW,
      terminal: false,
      retryable: false,
    },
  ],
  [
    DEPLOY_STATUS.LIVE,
    {
      label: "Live",
      glyph: "●",
      color: DEPLOY_COLOR.GREEN,
      terminal: true,
      retryable: false,
    },
  ],
  [
    DEPLOY_STATUS.FAILED,
    {
      label: "Failed",
      glyph: "×",
      color: DEPLOY_COLOR.RED,
      terminal: true,
      retryable: true,
    },
  ],
);
const allowedCommands = deployStatuses.deriveTo(
  deployCommands,
  [DEPLOY_STATUS.QUEUED, [DEPLOY_COMMAND.START]],
  [DEPLOY_STATUS.BUILDING, [DEPLOY_COMMAND.PROMOTE]],
  [DEPLOY_STATUS.LIVE, [DEPLOY_COMMAND.ROLLBACK]],
  [DEPLOY_STATUS.FAILED, [DEPLOY_COMMAND.RETRY]],
);
const nextStatusByCommand = deployCommands.deriveTo(
  deployStatuses,
  [DEPLOY_COMMAND.START, DEPLOY_STATUS.BUILDING],
  [DEPLOY_COMMAND.PROMOTE, DEPLOY_STATUS.LIVE],
  [DEPLOY_COMMAND.RETRY, DEPLOY_STATUS.QUEUED],
  [DEPLOY_COMMAND.ROLLBACK, DEPLOY_STATUS.BUILDING],
);

export function describeStatus(status: DeployStatus) {
  return { status, ...statusMetadata.get(status) };
}
function isExternalDeployCommand(
  input: unknown,
): input is ExternalDeployCommand {
  return (
    typeof input === "object" &&
    input !== null &&
    "state" in input &&
    "command" in input
  );
}

/** Decode argv/JSON input before workflow code receives branded members. */
export function decodeDeployCommand(input: unknown): Effect.Effect<
  {
    readonly state: DeployStatus;
    readonly command: DeployCommand;
    readonly expectedVersion?: number;
  },
  InvalidDeployInput
> {
  return Effect.gen(function* () {
    if (!isExternalDeployCommand(input))
      return yield* Effect.fail(
        new InvalidDeployInput({ field: "request", received: input }),
      );
    const state = deployStatuses.safeParse(input.state);
    if (!state.success)
      return yield* Effect.fail(
        new InvalidDeployInput({ field: "state", received: input.state }),
      );
    const command = deployCommands.safeParse(input.command);
    if (!command.success)
      return yield* Effect.fail(
        new InvalidDeployInput({ field: "command", received: input.command }),
      );
    if (
      input.expectedVersion !== undefined &&
      (typeof input.expectedVersion !== "number" ||
        !Number.isInteger(input.expectedVersion) ||
        input.expectedVersion < 1)
    )
      return yield* Effect.fail(
        new InvalidDeployInput({
          field: "expectedVersion",
          received: input.expectedVersion,
        }),
      );
    return {
      state: state.value,
      command: command.value,
      expectedVersion: input.expectedVersion,
    };
  });
}

export function transition(
  deploy: Deploy,
  command: DeployCommand,
): Effect.Effect<Deploy, IllegalDeployTransition> {
  return Effect.gen(function* () {
    if (
      !allowedCommands
        .get(deploy.status)
        .some((candidate) => candidate === command)
    )
      return yield* Effect.fail(
        new IllegalDeployTransition({ state: deploy.status, command }),
      );
    return {
      ...deploy,
      status: nextStatusByCommand.get(command),
      version: deploy.version + 1,
    };
  });
}

export interface DeployRepository {
  readonly get: (id: string) => Effect.Effect<Deploy, DeployNotFound>;
  readonly list: () => Effect.Effect<readonly Deploy[]>;
  readonly save: (deploy: Deploy) => Effect.Effect<void>;
}
export const DeployRepository =
  Context.GenericTag<DeployRepository>("DeployRepository");
const seededDeploys: readonly Deploy[] = [
  {
    id: "checkout-api",
    service: "checkout-api",
    status: DEPLOY_STATUS.QUEUED,
    version: 1,
  },
  {
    id: "email-worker",
    service: "email-worker",
    status: DEPLOY_STATUS.FAILED,
    version: 3,
  },
  { id: "web", service: "web", status: DEPLOY_STATUS.LIVE, version: 8 },
];
export const DeployRepositoryLive = Layer.effect(
  DeployRepository,
  Effect.gen(function* () {
    const deploys = yield* Ref.make(
      new Map(seededDeploys.map((deploy) => [deploy.id, deploy])),
    );
    return {
      get: (id) =>
        Effect.gen(function* () {
          const deploy = (yield* Ref.get(deploys)).get(id);
          return deploy === undefined
            ? yield* Effect.fail(new DeployNotFound({ id }))
            : deploy;
        }),
      list: () =>
        Ref.get(deploys).pipe(Effect.map((items) => [...items.values()])),
      save: (deploy) =>
        Ref.update(deploys, (stored) => new Map(stored).set(deploy.id, deploy)),
    } satisfies DeployRepository;
  }),
);

export function applyDeployCommand(
  id: string,
  input: unknown,
): Effect.Effect<
  Deploy,
  | InvalidDeployInput
  | DeployNotFound
  | DeployVersionConflict
  | IllegalDeployTransition,
  DeployRepository
> {
  return Effect.gen(function* () {
    const request = yield* decodeDeployCommand(input);
    const repository = yield* DeployRepository;
    const current = yield* repository.get(id);
    if (current.status !== request.state)
      return yield* Effect.fail(
        new IllegalDeployTransition({
          state: current.status,
          command: request.command,
        }),
      );
    if (
      request.expectedVersion !== undefined &&
      current.version !== request.expectedVersion
    )
      return yield* Effect.fail(
        new DeployVersionConflict({
          id,
          stored: current.version,
          expected: request.expectedVersion,
        }),
      );
    const updated = yield* transition(current, request.command);
    yield* repository.save(updated);
    return updated;
  });
}
