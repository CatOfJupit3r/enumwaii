import { createApp } from "../src/app";
import { openOrderDatabase } from "../src/db/client";

const database = await openOrderDatabase(
  Deno.env.get("PGLITE_DATA_DIR") ?? "./.data/orders-deno",
  { migrationsFolder: "./drizzle" },
);
await database.repository.seed();

const app = createApp({ orders: database.repository });
const port = Number(Deno.env.get("PORT") ?? "3000");

Deno.serve(
  {
    port,
    onListen({ hostname, port: listeningPort }) {
      console.log(
        `Orderline on Deno is running at http://${hostname}:${listeningPort}`,
      );
      console.log(
        "PGlite and Drizzle are using the same PostgreSQL schema as Node.",
      );
    },
  },
  app.fetch,
);
