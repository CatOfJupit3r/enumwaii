import { em } from "enumwaii";
import { Console, Data, Effect, Either } from "effect";

import {
  applyDeployCommand,
  ansiColor,
  DEPLOY_COMMAND,
  DEPLOY_STATUS,
  DeployNotFound,
  DeployRepository,
  DeployRepositoryLive,
  DeployVersionConflict,
  describeStatus,
  IllegalDeployTransition,
  InvalidDeployInput,
} from "./deployment-pipeline";

const usageText = `shipctl — a pocket deploy orchestrator

Usage:
  shipctl list
  shipctl deploy <service>
  shipctl promote <id>
  shipctl retry <id>
  shipctl rollback <id>
  shipctl demo

An optional --version <n> on a mutation demonstrates stale-write protection.`;
export class CliUsageError extends Data.TaggedError("CliUsageError")<{
  readonly reason: string;
}> {}
type Mutation = {
  readonly command: (typeof DEPLOY_COMMAND)[keyof typeof DEPLOY_COMMAND];
  readonly id: string;
  readonly expectedVersion?: number;
};
const cliKinds = em(["HELP", "LIST", "DEMO", "MUTATE"]);
const CLI_KIND = cliKinds.cases;
const cliCommands = em({
  DEMO: "demo",
  LIST: "list",
  DEPLOY: "deploy",
  PROMOTE: "promote",
  RETRY: "retry",
  ROLLBACK: "rollback",
});
const CLI_COMMAND = cliCommands.enum;
const mutationCommands = cliCommands.omit([CLI_COMMAND.DEMO, CLI_COMMAND.LIST]);
const commandRoutes = mutationCommands.derive(
  [CLI_COMMAND.DEPLOY, DEPLOY_COMMAND.START],
  [CLI_COMMAND.PROMOTE, DEPLOY_COMMAND.PROMOTE],
  [CLI_COMMAND.RETRY, DEPLOY_COMMAND.RETRY],
  [CLI_COMMAND.ROLLBACK, DEPLOY_COMMAND.ROLLBACK],
);
type CliOptions =
  | { readonly kind: (typeof CLI_KIND)["HELP" | "LIST" | "DEMO"] }
  | { readonly kind: typeof CLI_KIND.MUTATE; readonly mutation: Mutation };
type CliError =
  | CliUsageError
  | InvalidDeployInput
  | IllegalDeployTransition
  | DeployNotFound
  | DeployVersionConflict;

function parseVersion(
  args: readonly string[],
): number | undefined | CliUsageError {
  if (args.length === 0) return undefined;
  if (args.length !== 2 || args[0] !== "--version")
    return new CliUsageError({
      reason: "Expected optional --version <number>",
    });
  const version = Number(args[1]);
  return Number.isInteger(version) && version > 0
    ? version
    : new CliUsageError({ reason: "--version must be a positive integer" });
}
export function parseCliArgs(
  args: readonly string[],
): Effect.Effect<CliOptions, CliUsageError> {
  if (args.length === 0 || (args.length === 1 && args[0] === CLI_COMMAND.DEMO))
    return Effect.succeed({ kind: CLI_KIND.DEMO });
  if (args.length === 1 && args[0] === "--help")
    return Effect.succeed({ kind: CLI_KIND.HELP });
  if (args.length === 1 && args[0] === CLI_COMMAND.LIST)
    return Effect.succeed({ kind: CLI_KIND.LIST });
  const [action, id, ...rest] = args;
  const parsedCommand = mutationCommands.safeParse(action);
  const command = parsedCommand.success
    ? commandRoutes.get(parsedCommand.value)
    : undefined;
  if (command === undefined || id === undefined)
    return Effect.fail(
      new CliUsageError({
        reason: "Choose list, deploy, promote, retry, rollback, or demo",
      }),
    );
  const expectedVersion = parseVersion(rest);
  if (expectedVersion instanceof CliUsageError)
    return Effect.fail(expectedVersion);
  return Effect.succeed({
    kind: CLI_KIND.MUTATE,
    mutation: { command, id, expectedVersion },
  });
}
function displayStatus(
  status: (typeof DEPLOY_STATUS)[keyof typeof DEPLOY_STATUS],
): string {
  const detail = describeStatus(status);
  return `${ansiColor(detail.color)}${detail.glyph} ${detail.label}\u001b[0m`;
}
function listDeploys(): Effect.Effect<void, never, DeployRepository> {
  return Effect.gen(function* () {
    const deploys = yield* (yield* DeployRepository).list();
    yield* Console.log(
      "\nshipctl  SERVICE          STATUS       VERSION\n────────────────────────────────────────────",
    );
    for (const deploy of deploys)
      yield* Console.log(
        `         ${deploy.service.padEnd(16)} ${displayStatus(deploy.status).padEnd(22)} v${deploy.version}`,
      );
  });
}
function runMutation(
  mutation: Mutation,
): Effect.Effect<void, CliError, DeployRepository> {
  return Effect.gen(function* () {
    const current = yield* (yield* DeployRepository).get(mutation.id);
    const updated = yield* applyDeployCommand(mutation.id, {
      state: current.status,
      command: mutation.command,
      expectedVersion: mutation.expectedVersion,
    });
    yield* Console.log(
      `${updated.service}: ${displayStatus(current.status)} → ${displayStatus(updated.status)} (v${updated.version})`,
    );
  });
}
function runDemo(): Effect.Effect<void, CliError, DeployRepository> {
  return Effect.gen(function* () {
    yield* Console.log(
      "\nshipctl / deployment pipeline\nA tiny deploy orchestrator for the services you ship.\n",
    );
    yield* listDeploys();
    yield* Console.log(
      "\nStory: deploy checkout-api, let email-worker recover, then show a stale write.",
    );
    yield* runMutation({ id: "checkout-api", command: DEPLOY_COMMAND.START });
    yield* runMutation({ id: "email-worker", command: DEPLOY_COMMAND.RETRY });
    const stale = yield* Effect.either(
      runMutation({
        id: "checkout-api",
        command: DEPLOY_COMMAND.PROMOTE,
        expectedVersion: 1,
      }),
    );
    if (Either.isLeft(stale))
      yield* Console.log(`stale write: ${stale.left._tag}`);
  });
}
function runOptions(
  options: CliOptions,
): Effect.Effect<void, CliError, DeployRepository> {
  if (options.kind === CLI_KIND.HELP) return Console.log(usageText);
  if (options.kind === CLI_KIND.LIST) return listDeploys();
  if (options.kind === CLI_KIND.DEMO) return runDemo();
  return "mutation" in options
    ? runMutation(options.mutation)
    : Console.log(usageText);
}
function formatError(error: CliError): string {
  switch (error._tag) {
    case "CliUsageError":
      return `${error.reason}\n\n${usageText}`;
    case "InvalidDeployInput":
      return `Invalid deploy input (${error.field})`;
    case "IllegalDeployTransition":
      return `Can't ${error.command.toLowerCase()} a ${error.state} deploy`;
    case "DeployVersionConflict":
      return `Someone else promoted ${error.id} first (expected v${error.expected}, found v${error.stored})`;
    case "DeployNotFound":
      return `Unknown deploy: ${error.id}`;
  }
}
const program = Effect.gen(function* () {
  return yield* runOptions(yield* parseCliArgs(process.argv.slice(2)));
}).pipe(Effect.provide(DeployRepositoryLive));
const result = await Effect.runPromise(Effect.either(program));
if (Either.isLeft(result)) {
  await Effect.runPromise(Console.error(formatError(result.left)));
  process.exitCode = result.left._tag === "CliUsageError" ? 2 : 1;
}
