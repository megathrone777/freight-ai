import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import { db } from "../db";
import { traces } from "../db/schema";
import { loads } from "../db/schema";
import { embedBatch } from "../embeddings";
import { emitEvent } from "../events";

import type { NormalizedLoad } from "./schema";

type IngestSummary = { expired: number; inserted: number; merged: number; perSource: Record<string, number> };

const embeddingText = (load: NormalizedLoad): string =>
  `${load.origin} to ${load.destination}. ${load.weightT} tonnes. ${load.description}`;

const ingestLoads = async (items: NormalizedLoad[]): Promise<IngestSummary> => {
  const vectors: number[][] = await embedBatch(items.map(embeddingText), "load");
  const summary: IngestSummary = { expired: 0, inserted: 0, merged: 0, perSource: {} };

  for (const [index, load] of items.entries()) {
    const vector: number[] | undefined = vectors[index];

    if (!vector) {
      throw new Error(`Missing embedding for load ${load.id}.`);
    }
    const vectorLiteral: string = `[${vector.join(",")}]`;
    const nearest = await db.execute<{ id: string; similarity: number }>(sql`
      SELECT id, 1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM loads
      WHERE lower(origin) = lower(${load.origin})
        AND lower(destination) = lower(${load.destination})
        AND pickup_at::date = ${load.pickupAt.toISOString().slice(0, 10)}::date
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT 1
    `);
    const match = nearest[0];

    if (match && +match.similarity > 0.92) {
      await db.update(loads).set({
        expiresAt: new Date(Math.max(load.expiresAt.getTime(), Date.now() + 3600000)),
        price: load.price,
        source: load.source,
        updatedAt: new Date(),
      }).where(sql`${loads.id} = ${match.id}`);
      summary.merged += 1;
    } else {
      const expired: boolean = load.expiresAt.getTime() < Date.now();

      await db.insert(loads).values({
        ...load,
        createdAt: new Date(),
        embedding: vector,
        status: expired ? "expired" : load.status,
        updatedAt: new Date(),
      });
      summary.inserted += 1;
      if (expired) {
        summary.expired += 1;
      }
      await emitEvent("LoadIngested", { id: load.id, source: load.source });
    }
    summary.perSource[load.source] = (summary.perSource[load.source] ?? 0) + 1;
  }

  return summary;
};

const expireLoads = async (): Promise<number> => {
  const expired = await db.update(loads).set({ status: "expired", updatedAt: new Date() })
    .where(sql`${loads.status} <> 'expired' AND ${loads.expiresAt} < now()`)
    .returning({ id: loads.id });

  for (const load of expired) {
    await emitEvent("LoadExpired", { id: load.id });
  }

  return expired.length;
};

const recordTrace = async (
  name: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  latencyMs: number
): Promise<void> => {
  await db.insert(traces).values({
    id: randomUUID(),
    input,
    latencyMs,
    name,
    output,
  });
};

export { embeddingText, expireLoads, ingestLoads, recordTrace };
export type { IngestSummary };
