import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const bootstrapLogger = new Logger("Bootstrap");

function applicationPort(): number {
  const parsed = Number.parseInt(process.env["PORT"] ?? "3000", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = applicationPort();
  const host = process.env["HOST"] ?? "0.0.0.0";

  app.enableShutdownHooks();
  await app.listen(port, host);
  bootstrapLogger.log(
    `Helpdesk dashboard listening on http://localhost:${port}`,
  );
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack : String(error);
  bootstrapLogger.error("Nest application failed to start", message);
  process.exitCode = 1;
});
