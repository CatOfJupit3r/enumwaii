import { createApp } from "../src/app";
import { openOrderDatabase } from "../src/db/client";

const database = await openOrderDatabase(
  Bun.env.PGLITE_DATA_DIR ?? "./.data/orders-bun",
  { migrationsFolder: "./drizzle" },
);
await database.repository.seed();

const app = createApp({ orders: database.repository });
const port = Number(Bun.env.PORT ?? "3000");
const server = Bun.serve({ port, fetch: app.fetch });

console.log(`Orderline on Bun is running at ${server.url.toString()}`);
console.log("PGlite and Drizzle are using the same PostgreSQL schema as Node.");
