import { sql } from "drizzle-orm";

import { db, emitEvent, schema } from "@/db";
import { embeddings } from "@/services";

import { embeddingText } from "./embeddingText";

const ingestLoads = async (items: TNormalizedLoad[]): Promise<TIngestSummary> => {
  const vectors: number[][] = await embeddings.embedBatch(items.map(embeddingText), "load");
  const summary: TIngestSummary = { expired: 0, inserted: 0, merged: 0, perSource: {} };

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
      await db
        .update(schema.loads)
        .set({
          expiresAt: new Date(Math.max(load.expiresAt.getTime(), Date.now() + 3600000)),
          price: load.price,
          source: load.source,
          updatedAt: new Date(),
        })
        .where(sql`${schema.loads.id} = ${match.id}`);
      summary.merged += 1;
    } else {
      const expired: boolean = load.expiresAt.getTime() < Date.now();

      await db.insert(schema.loads).values({
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

export { ingestLoads };
