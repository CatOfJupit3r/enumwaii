import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { OrderRepository } from "./order-repository";
import { orders } from "./schema";

const schema = { orders };
export type OrderDatabase = PgliteDatabase<typeof schema>;

export type OrderDatabaseHandle = {
  readonly client: PGlite;
  readonly db: OrderDatabase;
  readonly repository: OrderRepository;
  close(): Promise<void>;
};

async function prepareDataDirectory(dataDir: string): Promise<string> {
  if (dataDir.includes("://")) return dataDir;

  const absoluteDataDir = resolve(dataDir);
  await mkdir(dirname(absoluteDataDir), { recursive: true });
  return absoluteDataDir;
}

export async function openOrderDatabase(
  dataDir: string,
): Promise<OrderDatabaseHandle> {
  const client = await PGlite.create(await prepareDataDirectory(dataDir));
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: resolve(
      process.env.DRIZZLE_MIGRATIONS_DIR ?? "./drizzle",
    ),
  });

  return {
    client,
    db,
    repository: new OrderRepository(db),
    async close(): Promise<void> {
      await client.close();
    },
  };
}
