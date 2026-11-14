import { createRequire } from "node:module";

import { defineConfig } from "drizzle-kit";

import type { loadEnvConfig as LoadEnvConfig } from "@next/env";

const loadEnvConfig: typeof LoadEnvConfig = createRequire(import.meta.url)("@next/env").loadEnvConfig;

loadEnvConfig(process.cwd());
const databaseUrl: string | undefined = process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
  throw new Error("POSTGRES_URL_NON_POOLING is required for migrations.");
}

export default defineConfig({
  dbCredentials: { url: databaseUrl },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
});
