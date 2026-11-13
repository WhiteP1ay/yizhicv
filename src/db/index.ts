import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL");
  }
  globalForDb.pool ??= new Pool({ connectionString });
  return globalForDb.pool;
}

export const db = drizzle(getPool(), { schema });

export * from "./schema";
