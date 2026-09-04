import { Console, Data, Effect, Either } from "effect";

import {
  applyJobCommand,
  describeStatus,
  IllegalJobTransition,
  InvalidJobInput,
  JOB_STATUS,
  JobNotFound,
  JobRepository,
  JobRepositoryLive,
  JobStateConflict,
} from "./job-workflow";

const usageText = `Enumwaii / Effect job control room

Usage:
  pnpm --dir examples/effect dev
  pnpm --dir examples/effect dev -- --state QUEUED --command START
  pnpm --dir examples/effect dev -- --json '{"state":"QUEUED","command":"START"}' --id build-42

Options:
  --state <value>    Claimed external job state
  --command <value>  Claimed external command
  --json <payload>   Decode a JSON payload instead of --state/--command
  --id <id>          Job identifier (defaults to job-1)
  --demo             Run the built-in scenario
  --help             Show this help

With no options, the CLI runs a control-room scenario covering success,
malformed input, illegal transitions, stale state, and missing-job recovery.
`;

export class CliUsageError extends Data.TaggedError("CliUsageError")<{
  readonly reason: string;
}> {}

type CommandOptions = {
  readonly kind: "command";
  readonly id: string;
  readonly input: unknown;
};

type CliOptions =
  { readonly kind: "help" } | { readonly kind: "scenario" } | CommandOptions;

type WorkflowError =
  InvalidJobInput | IllegalJobTransition | JobNotFound | JobStateConflict;

type CliError = CliUsageError | WorkflowError;

function optionValue(
  args: readonly string[],
  index: number,
  option: string,
): string | CliUsageError {
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) {
    return new CliUsageError({ reason: `${option} requires a value` });
  }
  return value;
}

export function parseCliArgs(
  args: readonly string[],
): Effect.Effect<CliOptions, CliUsageError> {
  if (args.length === 0) {
    return Effect.succeed({ kind: "scenario" });
  }

  if (args.length === 1 && args[0] === "--help") {
    return Effect.succeed({ kind: "help" });
  }

  if (args.length === 1 && args[0] === "--demo") {
    return Effect.succeed({ kind: "scenario" });
  }

  if (args.includes("--demo")) {
    return Effect.fail(
      new CliUsageError({ reason: "--demo is only valid as the sole option" }),
    );
  }

  let id = "job-1";
  let state: string | undefined;
  let command: string | undefined;
  let jsonInput: unknown;
  let hasJsonInput = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === undefined) {
      return Effect.fail(new CliUsageError({ reason: "Missing argument" }));
    }

    switch (argument) {
      case "--id": {
        const value = optionValue(args, index, argument);
        if (value instanceof CliUsageError) return Effect.fail(value);
        if (value.length === 0) {
          return Effect.fail(
            new CliUsageError({ reason: "--id cannot be empty" }),
          );
        }
        id = value;
        index += 1;
        break;
      }
      case "--state": {
        const value = optionValue(args, index, argument);
        if (value instanceof CliUsageError) return Effect.fail(value);
        if (hasJsonInput) {
          return Effect.fail(
            new CliUsageError({
              reason: "--state/--command cannot be combined with --json",
            }),
          );
        }
        state = value;
        index += 1;
        break;
      }
      case "--command": {
        const value = optionValue(args, index, argument);
        if (value instanceof CliUsageError) return Effect.fail(value);
        if (hasJsonInput) {
          return Effect.fail(
            new CliUsageError({
              reason: "--state/--command cannot be combined with --json",
            }),
          );
        }
        command = value;
        index += 1;
        break;
      }
      case "--json": {
        const value = optionValue(args, index, argument);
        if (value instanceof CliUsageError) return Effect.fail(value);
        if (state !== undefined || command !== undefined || hasJsonInput) {
          return Effect.fail(
            new CliUsageError({
              reason:
                "--json can only be supplied once without --state/--command",
            }),
          );
        }
        try {
          jsonInput = JSON.parse(value);
        } catch {
          return Effect.fail(
            new CliUsageError({ reason: "--json must contain valid JSON" }),
          );
        }
        hasJsonInput = true;
        index += 1;
        break;
      }
      case "--help":
        return Effect.fail(
          new CliUsageError({
            reason: "--help cannot be combined with options",
          }),
        );
      default:
        return Effect.fail(
          new CliUsageError({ reason: `Unknown option: ${argument}` }),
        );
    }
  }

  let input: unknown;
  if (hasJsonInput) {
    input = jsonInput;
  } else if (state === undefined && command === undefined) {
    input = {};
  } else if (state === undefined) {
    input = { command };
  } else if (command === undefined) {
    input = { state };
  } else {
    input = { state, command };
  }

  return Effect.succeed({ kind: "command", id, input });
}

function outcomeLabel(result: Either.Either<unknown, WorkflowError>): string {
  return Either.isRight(result) ? "OK" : `ERROR / ${result.left._tag}`;
}

function runScenario(): Effect.Effect<void, JobNotFound, JobRepository> {
  return Effect.gen(function* () {
    const repository = yield* JobRepository;
    yield* Console.log(
      [
        "",
        "╭────────────────────────────────────────────────────────────╮",
        "│ ENUMWAII / EFFECT JOB CONTROL ROOM                         │",
        "│ Branded state at the boundary, typed failures in the core   │",
        "╰────────────────────────────────────────────────────────────╯",
        "",
        "State model: QUEUED → RUNNING → SUCCEEDED | FAILED → QUEUED",
        "The demo repository is a Ref-backed Effect service.",
      ].join("\n"),
    );

    yield* repository.save({ id: "demo-job", status: JOB_STATUS.QUEUED });

    const successful = yield* Effect.either(
      applyJobCommand("demo-job", { state: "QUEUED", command: "START" }),
    );
    yield* Console.log(
      `  success       ${outcomeLabel(successful)} → ${JOB_STATUS.RUNNING}`,
    );

    const malformed = yield* Effect.either(
      applyJobCommand("demo-job", { state: "WAITING", command: "START" }),
    );
    yield* Console.log(`  malformed     ${outcomeLabel(malformed)}`);

    const illegal = yield* Effect.either(
      applyJobCommand("demo-job", { state: "RUNNING", command: "RETRY" }),
    );
    yield* Console.log(`  illegal       ${outcomeLabel(illegal)}`);

    const conflict = yield* Effect.either(
      applyJobCommand("demo-job", { state: "QUEUED", command: "START" }),
    );
    yield* Console.log(`  stale state   ${outcomeLabel(conflict)}`);

    const missing = yield* Effect.either(
      applyJobCommand("missing", { state: "QUEUED", command: "START" }),
    );
    if (Either.isLeft(missing) && missing.left._tag === "JobNotFound") {
      yield* Console.log("  missing job   RECOVERED / JobNotFound");
    } else {
      yield* Console.log(`  missing job   ${outcomeLabel(missing)}`);
    }

    const persisted = yield* repository.get("demo-job");
    const metadata = describeStatus(persisted.status);
    yield* Console.log(
      `\n  persisted     ${metadata.status} (terminal=${metadata.terminal}, retryable=${metadata.retryable})`,
    );
    yield* Console.log(
      "\nTry --state/--command to drive one command yourself.\n",
    );
  });
}

function runCommand(
  options: CommandOptions,
): Effect.Effect<void, WorkflowError, JobRepository> {
  return Effect.gen(function* () {
    const repository = yield* JobRepository;
    yield* repository.save({ id: options.id, status: JOB_STATUS.QUEUED });
    yield* Console.log(
      `Job ${options.id} seeded as ${JOB_STATUS.QUEUED}; decoding external command...`,
    );
    const updated = yield* applyJobCommand(options.id, options.input);
    const metadata = describeStatus(updated.status);
    yield* Console.log(
      `Transition accepted: ${updated.id} → ${metadata.status} (terminal=${metadata.terminal}, retryable=${metadata.retryable})`,
    );
  });
}

function runOptions(
  options: CliOptions,
): Effect.Effect<void, CliError, JobRepository> {
  switch (options.kind) {
    case "help":
      return Console.log(usageText);
    case "scenario":
      return runScenario();
    case "command":
      return runCommand(options);
  }
}

function printable(value: unknown): string {
  try {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? String(value) : encoded;
  } catch {
    return "<unprintable>";
  }
}

function formatError(error: CliError): string {
  switch (error._tag) {
    case "CliUsageError":
      return `Usage error: ${error.reason}\n\n${usageText}`;
    case "InvalidJobInput":
      return `Invalid job input (${error.field}): ${printable(error.received)}`;
    case "IllegalJobTransition":
      return `Illegal transition: ${error.state} + ${error.command}`;
    case "JobStateConflict":
      return `Stale state for ${error.id}: stored ${error.stored}, claimed ${error.claimed}`;
    case "JobNotFound":
      return `Job not found: ${error.id}`;
  }
}

function exitCode(error: CliError): number {
  return error._tag === "CliUsageError" ? 2 : 1;
}

const program = Effect.gen(function* () {
  const options = yield* parseCliArgs(process.argv.slice(2));
  return yield* runOptions(options);
}).pipe(Effect.provide(JobRepositoryLive));

async function main(): Promise<void> {
  const result = await Effect.runPromise(Effect.either(program));
  if (Either.isLeft(result)) {
    await Effect.runPromise(Console.error(formatError(result.left)));
    process.exitCode = exitCode(result.left);
  }
}

await main();
