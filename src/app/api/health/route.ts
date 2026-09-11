import { sql } from "drizzle-orm";
import { runtimeConfig } from "@/server/config";
import { database } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = runtimeConfig();
    if (config.APP_MODE === "database") await database().execute(sql`select 1`);
    return Response.json({
      status: "ok",
      mode: config.APP_MODE,
      database: config.APP_MODE === "database" ? "connected" : "not-used",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ status: "degraded", message: error instanceof Error ? error.message : "Error de configuración" }, { status: 503 });
  }
}
