import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | undefined;

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurado.");
  pool ??= new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000 });
  return drizzle(pool);
}
