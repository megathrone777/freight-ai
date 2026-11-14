import { createRequire } from "node:module";

import type { loadEnvConfig as LoadEnvConfig } from "@next/env";

export {};

const loadEnvConfig: typeof LoadEnvConfig = createRequire(import.meta.url)("@next/env").loadEnvConfig;

loadEnvConfig(process.cwd());
const args: string[] = process.argv.slice(2);
const reset: boolean = args.includes("--reset");
const limitIndex: number = args.indexOf("--limit");
const parsedLimit: number = limitIndex >= 0 ? +(args[limitIndex + 1] ?? "") : 2000;

if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 2000) {
  throw new Error("--limit must be an integer between 1 and 2000.");
}
const migrationUrl: string | undefined = process.env.POSTGRES_URL_NON_POOLING;

if (!migrationUrl) {
  throw new Error("POSTGRES_URL_NON_POOLING is required for seeding.");
}
process.env.POSTGRES_URL = migrationUrl;

const { client } = await import("../src/lib/db");
const { generateSeedLoads } = await import("../src/lib/loads/feeds");
const { expireLoads, ingestLoads } = await import("../src/lib/loads/ingest");

try {
  if (reset) {
    await client`TRUNCATE TABLE negotiation_messages, negotiations, traces, domain_events, loads CASCADE`;
  }
  const summary = await ingestLoads(generateSeedLoads(parsedLimit));
  const newlyExpired: number = await expireLoads();

  console.log(JSON.stringify({ ...summary, expired: summary.expired + newlyExpired, requested: parsedLimit }, null, 2));
} finally {
  await client.end();
}
