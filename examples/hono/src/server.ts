import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { openOrderDatabase } from "./db/client";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const database = await openOrderDatabase(
  process.env.PGLITE_DATA_DIR ?? "./.data/orders",
  { migrationsFolder: process.env.DRIZZLE_MIGRATIONS_DIR },
);
await database.repository.seed();

const app = createApp({ orders: database.repository });
const server = serve({ fetch: app.fetch, port });

console.log(`Counter is running at http://localhost:${port}`);
console.log("PGlite is ready; no external PostgreSQL server is required.");

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; closing the HTTP server and PGlite.`);

  server.close((serverError) => {
    void database
      .close()
      .then(() => {
        if (serverError !== undefined) {
          console.error(serverError);
          process.exitCode = 1;
        }
      })
      .catch((databaseError: unknown) => {
        console.error(databaseError);
        process.exitCode = 1;
      });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
