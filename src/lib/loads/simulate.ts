import { inArray } from "drizzle-orm";

import { db } from "../db";
import { loads } from "../db/schema";

import { generateIncomingLoads } from "./feeds";
import { expireLoads, ingestLoads } from "./ingest";

const simulateIncomingLoads = async (): Promise<{
  expired: number;
  inserted: number;
  loads: (typeof loads.$inferSelect)[];
  merged: number;
  perSource: Record<string, number>;
}> => {
  const count: number = 3 + Math.floor(Math.random() * 8);
  const incoming = generateIncomingLoads(count);
  const summary = await ingestLoads(incoming);
  const expired: number = await expireLoads();
  const created = await db.select().from(loads).where(inArray(loads.id, incoming.map(({ id }) => id)));

  return { ...summary, expired: summary.expired + expired, loads: created };
};

export { simulateIncomingLoads };
