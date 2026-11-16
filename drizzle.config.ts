import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: { url: process.env.POSTGRES_URL_NON_POOLING },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
});
