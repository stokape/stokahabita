import "server-only";
import { z } from "zod";

const schema = z.object({
  APP_MODE: z.enum(["demo", "database"]).default("demo"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_PASSWORD: z.string().min(32).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type RuntimeConfig = z.infer<typeof schema>;

export function runtimeConfig(): RuntimeConfig {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Configuración inválida: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  if (parsed.data.APP_MODE === "database" && (!parsed.data.DATABASE_URL || !parsed.data.SESSION_PASSWORD)) {
    throw new Error("El modo database requiere DATABASE_URL y SESSION_PASSWORD.");
  }
  return parsed.data;
}
